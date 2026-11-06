import { getAuthorizedCalendar } from './lib/googleAuth.js';
import { computeSlotsForDate, eventsForDate } from './lib/availability.js';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_DATES = 62;
const DAY_MS = 24 * 60 * 60 * 1000;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const dates = req.body?.dates;
  const valid =
    Array.isArray(dates) &&
    dates.length > 0 &&
    dates.length <= MAX_DATES &&
    dates.every((d) => typeof d === 'string' && DATE_RE.test(d) && !Number.isNaN(Date.parse(`${d}T00:00:00Z`)));
  if (!valid) return res.status(400).json({ error: `Expected "dates": 1-${MAX_DATES} strings in YYYY-MM-DD format` });

  const sorted = [...dates].sort();
  const timeMin = new Date(`${sorted[0]}T00:00:00Z`);
  const timeMax = new Date(new Date(`${sorted[sorted.length - 1]}T00:00:00Z`).getTime() + DAY_MS);

  try {
    const calendar = await getAuthorizedCalendar(['https://www.googleapis.com/auth/calendar.events.readonly']);

    const events = [];
    let pageToken;
    do {
      const { data } = await calendar.events.list({
        calendarId: process.env.GOOGLE_CALENDAR_ID,
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
        showDeleted: false,
        maxResults: 2500,
        pageToken,
      });
      events.push(...(data.items || []));
      pageToken = data.nextPageToken;
    } while (pageToken);

    const slots = Object.fromEntries(
      dates.map((date) => [date, computeSlotsForDate(date, eventsForDate(events, date))])
    );
    return res.status(200).json({ slots });
  } catch (error) {
    console.error('get-month-availability error:', error.message);
    return res.status(500).json({ error: 'Failed to retrieve availability', details: error.message });
  }
}
