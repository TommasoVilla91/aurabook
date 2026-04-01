import { getAuthorizedCalendar } from './lib/googleAuth.js';

const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID;

// ─────────────────────────────────────────────────────────────
// Helper: offset italiano rispetto a UTC (stesso approccio di get-available-slots.js)
// ─────────────────────────────────────────────────────────────
function getItalianUTCOffsetHours(dateString) {
  const testDate = new Date(`${dateString}T12:00:00Z`);
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Rome',
    timeZoneName: 'shortOffset',
  });
  const parts = formatter.formatToParts(testDate);
  const offsetPart = parts.find((p) => p.type === 'timeZoneName');
  if (offsetPart) {
    const match = offsetPart.value.match(/GMT([+-]\d+)/);
    if (match && match[1]) return parseInt(match[1], 10);
  }
  return 1; // fallback UTC+1 (CET)
}

// ─────────────────────────────────────────────────────────────
// Helper: aggiunge 1 ora a una stringa HH:MM
// ─────────────────────────────────────────────────────────────
function addOneHour(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  const totalMinutes = h * 60 + m + 60;
  const endH = Math.floor(totalMinutes / 60) % 24;
  const endM = totalMinutes % 60;
  return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
}

// ─────────────────────────────────────────────────────────────
// Helper: parsing descrizione evento (stesso formato di get-bookings.js)
// ─────────────────────────────────────────────────────────────
function parseDescription(description = '') {
  const extract = (label) => {
    const match = description.match(new RegExp(`${label}:\\s*(.+)`));
    return match ? match[1].trim() : '—';
  };
  const motivoMatch = description.match(/Motivo visita:\s*([\s\S]+?)\n\n/);
  return {
    phone:     extract('Telefono'),
    email:     extract('Email'),
    birthdate: extract('Data di nascita'),
    message:   motivoMatch ? motivoMatch[1].trim() : '—',
  };
}

// ─────────────────────────────────────────────────────────────
// Handler principale
// ─────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const calendar = await getAuthorizedCalendar();

    // ─── DELETE: elimina l'evento dal calendario ───────────────
    if (req.method === 'DELETE') {
      const { eventId } = req.body;
      if (!eventId) return res.status(400).json({ error: 'Missing eventId' });

      await calendar.events.delete({ calendarId: CALENDAR_ID, eventId });
      return res.status(200).json({ success: true });
    }

    // ─── PATCH: modifica l'evento e lo aggiorna su GCal ────────
    if (req.method === 'PATCH') {
      const { eventId, name, surname, phone, email, bookingDate, bookingTime } = req.body;

      if (!eventId || !name || !surname || !bookingDate || !bookingTime) {
        return res.status(400).json({ error: 'Campi obbligatori mancanti' });
      }

      const endTime      = addOneHour(bookingTime);
      const italianOff   = getItalianUTCOffsetHours(bookingDate);
      const [y, mo, d]   = bookingDate.split('-').map(Number);
      const [sh, sm]     = bookingTime.split(':').map(Number);
      const [eh, em]     = endTime.split(':').map(Number);

      // Intervalli UTC del nuovo slot
      const slotStartUTC = new Date(Date.UTC(y, mo - 1, d, sh - italianOff, sm));
      const slotEndUTC   = new Date(Date.UTC(y, mo - 1, d, eh - italianOff, em));

      // Controlla conflitti: carica tutti gli eventi del giorno, escluso l'evento corrente
      const dayEventsRes = await calendar.events.list({
        calendarId:   CALENDAR_ID,
        timeMin:      new Date(`${bookingDate}T00:00:00Z`).toISOString(),
        timeMax:      new Date(`${bookingDate}T23:59:59.999Z`).toISOString(),
        singleEvents: true,
        orderBy:      'startTime',
        showDeleted:  false,
      });

      const conflicting = (dayEventsRes.data.items || [])
        .filter((e) => e.transparency !== 'transparent') // ignora eventi "libero"
        .filter((e) => e.id !== eventId)                 // escludi l'evento che stiamo modificando
        .filter((e) => !!e.start?.dateTime)              // solo eventi con orario (non all-day)
        .find((e) => {
          const eStart = new Date(e.start.dateTime).getTime();
          const eEnd   = new Date(e.end.dateTime).getTime();
          // Sovrapposizione: i due intervalli si intersecano
          return eStart < slotEndUTC.getTime() && eEnd > slotStartUTC.getTime();
        });

      if (conflicting) {
        return res.status(409).json({
          error:   'conflict',
          message: `Lo slot delle ${bookingTime} del ${new Date(slotStartUTC).toLocaleDateString('it-IT', { timeZone: 'Europe/Rome', day: 'numeric', month: 'long', year: 'numeric' })} è già occupato da un altro evento ("${conflicting.summary || 'evento senza titolo'}"). Scegli un orario diverso.`,
        });
      }

      // Legge l'evento corrente per preservare i campi non modificabili (motivo, data di nascita)
      const currentEvent = await calendar.events.get({ calendarId: CALENDAR_ID, eventId });
      const { birthdate, message } = parseDescription(currentEvent.data.description);

      // Ricostruisce la descrizione con i nuovi dati di contatto + campi preservati
      const newDescription =
        `Motivo visita: ${message}\n\nContatti:\nTelefono: ${phone || '—'}\nEmail: ${email || '—'}\nData di nascita: ${birthdate}`;

      // Aggiorna l'evento su Google Calendar
      const updated = await calendar.events.patch({
        calendarId:  CALENDAR_ID,
        eventId,
        requestBody: {
          summary:     `DA CONFERMARE: prenotazione ${name} ${surname}`,
          description: newDescription,
          start: { dateTime: `${bookingDate}T${bookingTime}:00`, timeZone: 'Europe/Rome' },
          end:   { dateTime: `${bookingDate}T${endTime}:00`,     timeZone: 'Europe/Rome' },
        },
      });

      // Costruisce la risposta nello stesso formato di get-bookings.js
      const ev       = updated.data;
      const startISO = ev.start?.dateTime || '';

      return res.status(200).json({
        booking: {
          id:        ev.id,
          name,
          surname,
          phone:     phone || '—',
          email:     email || '—',
          birthdate,
          message,
          startISO,
          date:      startISO ? new Date(startISO).toLocaleDateString('it-IT', {
            weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
            timeZone: 'Europe/Rome',
          }) : '—',
          time:      startISO ? new Date(startISO).toLocaleTimeString('it-IT', {
            hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome',
          }) : '—',
          status:    ev.status || 'tentative',
          eventLink: ev.htmlLink || null,
        },
      });
    }

    return res.status(405).json({ error: 'Method Not Allowed' });

  } catch (error) {
    console.error('manage-booking error:', error.message);
    return res.status(500).json({ error: 'Errore del server', details: error.message });
  }
}
