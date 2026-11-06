import { getAuthorizedCalendar } from './lib/googleAuth.js';
import { computeSlotsForDate } from './lib/availability.js';
import nodemailer from 'nodemailer';
import { customerConfirmationEmail } from './emailTemplates/customerConfirmation.js';
import { adminNotificationEmail } from './emailTemplates/adminNotification.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { name, surname, phone, email, birthdate, booking_date, booking_time, message } = req.body;
  const lang = req.body.lang === 'en' ? 'en' : 'it';

  if (!name || !surname || !phone || !email || !booking_date || !booking_time) {
    return res.status(400).json({ error: 'Missing form data' });
  }

  // Endpoint pubblico: limita forma e dimensione dei campi prima di scriverli su Calendar e nelle mail.
  const text = (v, max) => typeof v === 'string' && v.length <= max;
  const formatsOk =
    text(name, 80) && text(surname, 80) && text(phone, 30) && text(email, 254) &&
    EMAIL_RE.test(email) &&
    (birthdate === undefined || birthdate === '' || (text(birthdate, 10) && DATE_RE.test(birthdate))) &&
    (message === undefined || text(message, 2000)) &&
    typeof booking_date === 'string' && DATE_RE.test(booking_date) &&
    typeof booking_time === 'string' && TIME_RE.test(booking_time);
  if (!formatsOk) return res.status(400).json({ error: 'Invalid form data' });

  try {
    const calendar = await getAuthorizedCalendar();

    // Rilegge il calendario al momento dell'invio: lo slot può essere stato occupato
    // da un altro cliente o da Francesco dopo che la pagina è stata caricata.
    const dayEvents = await calendar.events.list({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      timeMin: new Date(`${booking_date}T00:00:00Z`).toISOString(),
      timeMax: new Date(`${booking_date}T23:59:59.999Z`).toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
      showDeleted: false,
    });
    const stillFree = computeSlotsForDate(booking_date, dayEvents.data.items || []);
    if (!stillFree.includes(booking_time)) {
      return res.status(409).json({
        error: 'slot_unavailable',
        message: 'Questo orario è appena stato occupato. Scegline un altro.',
      });
    }

    // Costruisce start/end come stringhe locali (senza Z) nel fuso Europe/Rome.
    // Google Calendar interpreta dateTime nel timeZone specificato quando non c'è offset esplicito.
    const [endH, endM] = booking_time.split(':').map(Number);
    const endTimeStr = `${String((endH + 1) % 24).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

    const event = {
      summary: `DA CONFERMARE: prenotazione ${name} ${surname}`,
      description: `Motivo visita: ${message}\n\nContatti:\nTelefono: ${phone}\nEmail: ${email}\nData di nascita: ${birthdate}`,
      start: { dateTime: `${booking_date}T${booking_time}:00`, timeZone: 'Europe/Rome' },
      end:   { dateTime: `${booking_date}T${endTimeStr}:00`,   timeZone: 'Europe/Rome' },
      status: 'tentative',
    };

    const createdEvent = await calendar.events.insert({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      requestBody: event,
      sendNotifications: true,
    });

    // Formatta la data in italiano (es. "martedì 15 aprile 2026")
    const [y, m, d] = booking_date.split('-').map(Number);
    const dateLabel = new Date(y, m - 1, d).toLocaleDateString('it-IT', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });

    // ── Nodemailer (Gmail SMTP): mail di ricevuta al cliente ──────────
    // emailSent viene incluso nella risposta per facilitare il debug in sviluppo.
    // Un eventuale errore email non blocca la prenotazione (già salvata su Calendar).
    let emailSent = false;
    let emailError = null;

    const gmailUser = process.env.GMAIL_USER;
    const gmailPass = process.env.GMAIL_APP_PASSWORD;
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!gmailUser || !gmailPass) {
      emailError = 'GMAIL_USER o GMAIL_APP_PASSWORD non configurate nelle variabili d\'ambiente Vercel';
      console.warn('Nodemailer skip:', emailError);
    } else {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: gmailUser, pass: gmailPass },
      });

      // Mail di ricevuta al cliente
      const customerDateLabel = new Date(y, m - 1, d).toLocaleDateString(lang === 'en' ? 'en-GB' : 'it-IT', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      });
      const { subject, html } = customerConfirmationEmail({ name, dateLabel: customerDateLabel, booking_time, lang });
      try {
        await transporter.sendMail({
          from: `"Francesco · Massoterapista" <${gmailUser}>`,
          to: email,
          subject,
          html,
        });
        emailSent = true;
      } catch (err) {
        emailError = err.message;
        console.error('Nodemailer customer email error:', err.message);
      }

      // Notifica admin (Francesco) — non blocca la risposta se fallisce
      if (adminEmail) {
        const { subject: adminSubject, html: adminHtml } = adminNotificationEmail({
          name, surname, phone, email, birthdate, dateLabel, booking_time, message,
        });
        try {
          await transporter.sendMail({
            from: `"AuraBook" <${gmailUser}>`,
            to: adminEmail,
            subject: adminSubject,
            html: adminHtml,
          });
        } catch (err) {
          console.error('Nodemailer admin email error:', err.message);
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Prenotazione effettuata!',
      eventLink: createdEvent.data.htmlLink,
      emailSent,
      ...(emailError && { emailError }),  // incluso solo se presente, utile in dev
    });
  } catch (err) {
    console.error('create-booking-event error:', err.message);
    return res.status(500).json({ error: 'Failed to create booking', details: err.message });
  }
}
