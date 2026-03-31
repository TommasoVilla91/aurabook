import { google } from 'googleapis';

// Helper: autentica con il service account e ritorna un client Google Calendar
async function getCalendarClient() {
  const credentialsString = process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS;
  if (!credentialsString) throw new Error('GOOGLE_SERVICE_ACCOUNT_CREDENTIALS not configured');

  const credentials = JSON.parse(credentialsString);
  const jwtClient = new google.auth.JWT(
    credentials.client_email,
    null,
    credentials.private_key.replace(/\\n/g, '\n'),
    ['https://www.googleapis.com/auth/calendar.events']
  );
  await jwtClient.authorize();
  return google.calendar({ version: 'v3', auth: jwtClient });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const calendarId = process.env.GOOGLE_CALENDAR_ID;

  try {
    const calendar = await getCalendarClient();

    // ── GET: lista ferie future ─────────────────────────────────────────────
    if (req.method === 'GET') {
      const response = await calendar.events.list({
        calendarId,
        timeMin: new Date().toISOString(),
        privateExtendedProperty: 'aurabookType=vacation',
        singleEvents: true,
        orderBy: 'startTime',
        showDeleted: false,
      });

      const vacations = (response.data.items || []).map((e) => ({
        id: e.id,
        date: e.start.date,   // formato YYYY-MM-DD
        summary: e.summary,
      }));

      return res.status(200).json({ vacations });
    }

    // ── POST: aggiungi giorno di ferie ──────────────────────────────────────
    if (req.method === 'POST') {
      const { date } = req.body;  // es. "2026-08-15"
      if (!date) return res.status(400).json({ error: 'Missing date parameter' });

      // Google Calendar usa la fine esclusiva per gli eventi all-day:
      // un evento dal 15 al 16 agosto appare come "15 agosto" nel calendario.
      const [y, m, d] = date.split('-').map(Number);
      const endDate = new Date(Date.UTC(y, m - 1, d + 1));
      const endDateStr = endDate.toISOString().split('T')[0];

      const created = await calendar.events.insert({
        calendarId,
        requestBody: {
          summary: '🌴 Ferie',
          start: { date },
          end:   { date: endDateStr },
          extendedProperties: {
            private: { aurabookType: 'vacation' },
          },
        },
      });

      return res.status(200).json({
        success: true,
        vacation: {
          id: created.data.id,
          date,
          summary: created.data.summary,
        },
      });
    }

    // ── DELETE: rimuovi giorno di ferie per eventId ─────────────────────────
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
