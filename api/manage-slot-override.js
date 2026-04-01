import { getAuthorizedCalendar } from './lib/googleAuth.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const calendarId = process.env.GOOGLE_CALENDAR_ID;

  try {
    const calendar = await getAuthorizedCalendar();

    // ── GET ?date=YYYY-MM-DD : cerca l'override per quel giorno ─────────────
    if (req.method === 'GET') {
      const { date } = req.query;
      if (!date) return res.status(400).json({ error: 'Missing date query parameter' });

      const response = await calendar.events.list({
        calendarId,
        // Cerca solo eventi all-day del giorno specifico
        timeMin: `${date}T00:00:00Z`,
        timeMax: `${date}T23:59:59Z`,
        privateExtendedProperty: 'aurabookType=slot-override',
        singleEvents: true,
        showDeleted: false,
      });

      const item = (response.data.items || []).find((e) => e.start?.date === date);

      if (!item) {
        return res.status(200).json({ override: null });
      }

      const slots = JSON.parse(item.extendedProperties?.private?.slots || '[]');
      return res.status(200).json({
        override: { id: item.id, date: item.start.date, slots },
      });
    }

    // ── POST { date, slots } : crea o sostituisce l'override ────────────────
    if (req.method === 'POST') {
      const { date, slots } = req.body;
      if (!date || !Array.isArray(slots)) {
        return res.status(400).json({ error: 'Missing date or slots array' });
      }

      // Normalizza e deduplicazione slot (formato HH:MM, ordinati)
      const normalized = [...new Set(
        slots
          .map((s) => s.trim())
          .filter((s) => /^\d{2}:\d{2}$/.test(s))
      )].sort();

      // Cerca se esiste già un override per questo giorno → se sì, cancellalo prima
      const existing = await calendar.events.list({
        calendarId,
        timeMin: `${date}T00:00:00Z`,
        timeMax: `${date}T23:59:59Z`,
        privateExtendedProperty: 'aurabookType=slot-override',
        singleEvents: true,
        showDeleted: false,
      });

      const existingItem = (existing.data.items || []).find((e) => e.start?.date === date);
      if (existingItem) {
        await calendar.events.delete({ calendarId, eventId: existingItem.id });
      }

      // GCal usa la fine esclusiva per gli all-day: giorno+1
      const [y, m, d] = date.split('-').map(Number);
      const endDate = new Date(Date.UTC(y, m - 1, d + 1)).toISOString().split('T')[0];

      const created = await calendar.events.insert({
        calendarId,
        requestBody: {
          summary: `⚙️ Orari personalizzati`,
          start: { date },
          end:   { date: endDate },
          extendedProperties: {
            private: {
              aurabookType: 'slot-override',
              slots: JSON.stringify(normalized),
            },
          },
        },
      });

      return res.status(200).json({
        success: true,
        override: { id: created.data.id, date, slots: normalized },
      });
    }

    // ── DELETE { eventId } : rimuove l'override → torna agli slot standard ──
    if (req.method === 'DELETE') {
      const { eventId } = req.body;
      if (!eventId) return res.status(400).json({ error: 'Missing eventId parameter' });

      await calendar.events.delete({ calendarId, eventId });
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method Not Allowed' });

  } catch (err) {
    console.error('manage-slot-override error:', err.message);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
}
