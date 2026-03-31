import { getAuthorizedCalendar } from './lib/googleAuth.js';

// Aggiunge 1 giorno a una stringa YYYY-MM-DD (per la fine esclusiva GCal)
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

    // ── GET: lista ferie future ─────────────────────────────────────────────
    if (req.method === 'GET') {
      const response = await calendar.events.list({
        calendarId,
        timeMin: new Date().toISOString(),
        privateExtendedProperty: 'aurabookType=vacation',
        singleEvents: false,   // non espandere: vogliamo l'evento unico del range
        orderBy: 'updated',
        showDeleted: false,
      });

      const vacations = (response.data.items || [])
        .filter((e) => e.start?.date)  // solo all-day
        .sort((a, b) => a.start.date.localeCompare(b.start.date))
        .map((e) => {
          const dateFrom = e.start.date;
          // GCal end è esclusivo: sottraiamo 1 giorno per il dateTo reale
          const [y, m, d] = e.end.date.split('-').map(Number);
          const dateTo = new Date(Date.UTC(y, m - 1, d - 1)).toISOString().split('T')[0];
          return { id: e.id, dateFrom, dateTo };
        });

      return res.status(200).json({ vacations });
    }

    // ── POST: aggiungi range di ferie ───────────────────────────────────────
    if (req.method === 'POST') {
      const { dateFrom, dateTo } = req.body;
      if (!dateFrom) return res.status(400).json({ error: 'Missing dateFrom parameter' });

      const startDate = dateFrom;
      // Se dateTo non è specificato o è uguale a dateFrom → singolo giorno
      const endDate = addOneDay(dateTo && dateTo >= dateFrom ? dateTo : dateFrom);

      // Label per il summary del calendario
      const isSingleDay = endDate === addOneDay(dateFrom);
      const summary = isSingleDay ? '🌴 Ferie' : `🌴 Ferie (${dateFrom} → ${dateTo})`;

      const created = await calendar.events.insert({
        calendarId,
        requestBody: {
          summary,
          start: { date: startDate },
          end:   { date: endDate },
          extendedProperties: {
            private: { aurabookType: 'vacation' },
          },
        },
      });

      // dateTo reale = endDate - 1 giorno
      const [y, m, d] = endDate.split('-').map(Number);
      const realDateTo = new Date(Date.UTC(y, m - 1, d - 1)).toISOString().split('T')[0];

      return res.status(200).json({
        success: true,
        vacation: {
          id: created.data.id,
          dateFrom: startDate,
          dateTo: realDateTo,
        },
      });
    }

    // ── DELETE: rimuovi range di ferie per eventId ──────────────────────────
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
