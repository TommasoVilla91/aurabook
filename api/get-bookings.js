import { getAuthorizedCalendar } from './lib/googleAuth.js';

/**
 * Parsa la descrizione dell'evento calendario per estrarre i campi strutturati.
 * Formato atteso (da create-booking-event.js):
 *   "Motivo visita: <testo>\n\nContatti:\nTelefono: <tel>\nEmail: <email>\nData di nascita: <data>"
 */
function parseDescription(description = '') {
  const extract = (label) => {
    const match = description.match(new RegExp(`${label}:\\s*(.+)`));
    return match ? match[1].trim() : '—';
  };

  // Il motivo visita va fino alla prima riga vuota
  const motivoMatch = description.match(/Motivo visita:\s*([\s\S]+?)\n\n/);

  return {
    phone:     extract('Telefono'),
    email:     extract('Email'),
    birthdate: extract('Data di nascita'),
    message:   motivoMatch ? motivoMatch[1].trim() : '—',
  };
}

/**
 * Parsa nome e cognome dal summary dell'evento.
 * Formato: "DA CONFERMARE: prenotazione Nome Cognome Eventuale"
 */
function parseSummary(summary = '') {
  const match = summary.match(/prenotazione\s+(.+)/i);
  if (!match) return { name: '—', surname: '—' };
  const parts = match[1].trim().split(/\s+/);
  return {
    name:    parts[0] || '—',
    surname: parts.slice(1).join(' ') || '—',
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const calendar = await getAuthorizedCalendar([
      'https://www.googleapis.com/auth/calendar.events.readonly',
    ]);

    // Legge tutti gli eventi dell'anno corrente ± 1 anno per avere storico e futuro
    const now = new Date();
    const timeMin = new Date(now.getFullYear() - 1, 0, 1).toISOString();
    const timeMax = new Date(now.getFullYear() + 1, 11, 31, 23, 59, 59).toISOString();

    const response = await calendar.events.list({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: 'startTime',
      showDeleted: false,
      maxResults: 500, // limite generoso per coprire tutti i booking
    });

    const items = response.data.items || [];

    // Filtra solo gli eventi di prenotazione (summary inizia con "DA CONFERMARE:")
    const bookings = items
      .filter((e) => e.summary && /^DA CONFERMARE:/i.test(e.summary))
      .map((e) => {
        const { name, surname } = parseSummary(e.summary);
        const { phone, email, birthdate, message } = parseDescription(e.description);

        // Data e orario dalla dateTime dell'evento (formato ISO con timezone)
        const startISO = e.start?.dateTime || e.start?.date || '';
        const endISO   = e.end?.dateTime   || e.end?.date   || '';

        return {
          id:        e.id,
          name,
          surname,
          phone,
          email,
          birthdate,
          message,
          startISO,  // ISO completo, usato dal frontend per separare passate/future
          date:      startISO ? new Date(startISO).toLocaleDateString('it-IT', {
            weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
            timeZone: 'Europe/Rome',
          }) : '—',
          time:      startISO ? new Date(startISO).toLocaleTimeString('it-IT', {
            hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome',
          }) : '—',
          status:    e.status || 'tentative',   // tentative | confirmed | cancelled
          eventLink: e.htmlLink || null,
        };
      });

    return res.status(200).json({ bookings });
  } catch (err) {
    console.error('get-bookings error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch bookings', details: err.message });
  }
}
