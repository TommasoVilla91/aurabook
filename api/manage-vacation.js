import { getAuthorizedCalendar } from './lib/googleAuth.js';

// Aggiunge 1 giorno a una stringa YYYY-MM-DD (per la fine esclusiva GCal sugli all-day)
function addOneDay(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + 1));
  return next.toISOString().split('T')[0];
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const calendarId = process.env.GOOGLE_CALENDAR_ID;

  try {
    const calendar = await getAuthorizedCalendar();

    // ── GET: lista ferie + blocchi orari futuri ────────────────────────────
    if (req.method === 'GET') {
      // Recupera sia vacation (all-day) che partial-block (timed) con due query separate
      // perché GCal non supporta OR su privateExtendedProperty
      const [vacRes, blockRes] = await Promise.all([
        calendar.events.list({
          calendarId,
          timeMin: new Date().toISOString(),
          privateExtendedProperty: 'aurabookType=vacation',
          singleEvents: false,
          orderBy: 'updated',
          showDeleted: false,
        }),
        calendar.events.list({
          calendarId,
          timeMin: new Date().toISOString(),
          privateExtendedProperty: 'aurabookType=partial-block',
          singleEvents: true,
          orderBy: 'startTime',
          showDeleted: false,
        }),
      ]);

      // Mappa ferie all-day
      const vacations = (vacRes.data.items || [])
        .filter((e) => e.start?.date)
        .sort((a, b) => a.start.date.localeCompare(b.start.date))
        .map((e) => {
          const dateFrom = e.start.date;
          const [y, m, d] = e.end.date.split('-').map(Number);
          const dateTo = new Date(Date.UTC(y, m - 1, d - 1)).toISOString().split('T')[0];
          return { id: e.id, type: 'vacation', dateFrom, dateTo };
        });

      // Mappa blocchi orari parziali (timed events)
      const partialBlocks = (blockRes.data.items || [])
        .filter((e) => e.start?.dateTime)
        .map((e) => {
          // Estrae la data e gli orari dal dateTime (formato ISO con offset)
          const startDT = new Date(e.start.dateTime);
          const endDT   = new Date(e.end.dateTime);
          const dateFrom = e.start.dateTime.split('T')[0];
          const timeFrom = startDT.toLocaleTimeString('it-IT', {
            hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome',
          });
          const timeTo = endDT.toLocaleTimeString('it-IT', {
            hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome',
          });
          return { id: e.id, type: 'partial-block', dateFrom, dateTo: dateFrom, timeFrom, timeTo };
        });

      // Unisce e ordina per data
      const all = [...vacations, ...partialBlocks]
        .sort((a, b) => a.dateFrom.localeCompare(b.dateFrom));

      return res.status(200).json({ vacations: all });
    }

    // ── POST: aggiungi ferie o blocco orario ────────────────────────────────
    if (req.method === 'POST') {
      const { dateFrom, dateTo, timeFrom, timeTo } = req.body;
      if (!dateFrom) return res.status(400).json({ error: 'Missing dateFrom parameter' });

      let requestBody;

      if (timeFrom && timeTo) {
        // ── Blocco orario parziale (timed event) ──────────────────────────
        // GCal interpreta dateTime senza offset nel fuso timeZone specificato
        requestBody = {
          summary: `🕐 Blocco ${timeFrom}–${timeTo}`,
          start: { dateTime: `${dateFrom}T${timeFrom}:00`, timeZone: 'Europe/Rome' },
          end:   { dateTime: `${dateFrom}T${timeTo}:00`,   timeZone: 'Europe/Rome' },
          extendedProperties: { private: { aurabookType: 'partial-block' } },
        };

        const created = await calendar.events.insert({ calendarId, requestBody });

        // Rilegge gli orari dall'evento creato (GCal restituisce con offset)
        const startDT = new Date(created.data.start.dateTime);
        const endDT   = new Date(created.data.end.dateTime);
        const tfmt = (dt) => dt.toLocaleTimeString('it-IT', {
          hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome',
        });

        return res.status(200).json({
          success: true,
          vacation: {
            id: created.data.id,
            type: 'partial-block',
            dateFrom,
            dateTo: dateFrom,
            timeFrom: tfmt(startDT),
            timeTo:   tfmt(endDT),
          },
        });

      } else {
        // ── Ferie intere (all-day) ─────────────────────────────────────────
        const startDate = dateFrom;
        const endDate   = addOneDay(dateTo && dateTo >= dateFrom ? dateTo : dateFrom);
        const isSingleDay = endDate === addOneDay(dateFrom);
        const summary  = isSingleDay ? '🌴 Ferie' : `🌴 Ferie (${dateFrom} → ${dateTo})`;

        requestBody = {
          summary,
          start: { date: startDate },
          end:   { date: endDate },
          extendedProperties: { private: { aurabookType: 'vacation' } },
        };

        const created = await calendar.events.insert({ calendarId, requestBody });

        const [y, m, d] = endDate.split('-').map(Number);
        const realDateTo = new Date(Date.UTC(y, m - 1, d - 1)).toISOString().split('T')[0];

        return res.status(200).json({
          success: true,
          vacation: {
            id: created.data.id,
            type: 'vacation',
            dateFrom: startDate,
            dateTo: realDateTo,
          },
        });
      }
    }

    // ── DELETE: rimuovi per eventId ─────────────────────────────────────────
    if (req.method === 'DELETE') {
      const { eventId } = req.body;
      if (!eventId) return res.status(400).json({ error: 'Missing eventId parameter' });

      await calendar.events.delete({ calendarId, eventId });
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method Not Allowed' });

  } catch (err) {
    console.error('manage-vacation error:', err.message);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
}
