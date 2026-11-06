import { getAuthorizedCalendar } from './lib/googleAuth.js';
import { computeSlotsForDate } from './lib/availability.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { date: dateString } = req.body;
  if (!dateString) return res.status(400).json({ error: 'Missing date parameter' });

  try {
    const calendar = await getAuthorizedCalendar(['https://www.googleapis.com/auth/calendar.events.readonly']);

    const calendarResponse = await calendar.events.list({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      timeMin: new Date(`${dateString}T00:00:00Z`).toISOString(),
      timeMax: new Date(`${dateString}T23:59:59.999Z`).toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      showDeleted: false,
    });

    const events = calendarResponse.data.items || [];
    return res.status(200).json({ slots: computeSlotsForDate(dateString, events) });
  } catch (error) {
    console.error('get-available-slots error:', error.message);
    return res.status(500).json({ error: 'Failed to retrieve available slots', details: error.message });
  }
}
