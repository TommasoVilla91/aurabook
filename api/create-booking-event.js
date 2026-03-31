import { getAuthorizedCalendar } from './lib/googleAuth.js';
import nodemailer from 'nodemailer';
import { customerConfirmationEmail } from './emailTemplates/customerConfirmation.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { name, surname, phone, email, birthdate, booking_date, booking_time, message } = req.body;

  if (!name || !surname || !phone || !email || !booking_date || !booking_time) {
    return res.status(400).json({ error: 'Missing form data' });
  }

  try {
    const calendar = await getAuthorizedCalendar();

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
    if (!gmailUser || !gmailPass) {
      emailError = 'GMAIL_USER o GMAIL_APP_PASSWORD non configurate nelle variabili d\'ambiente Vercel';
      console.warn('Nodemailer skip:', emailError);
    } else {
      // Genera subject e HTML dal template esterno (api/emailTemplates/customerConfirmation.js)
      const { subject, html } = customerConfirmationEmail({ name, dateLabel, booking_time });
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: { user: gmailUser, pass: gmailPass },
        });
        await transporter.sendMail({
          from: `"Francesco · Massoterapista" <${gmailUser}>`,
          to: email,
          subject,
          html,
        });
        emailSent = true;
      } catch (err) {
        emailError = err.message;
        console.error('Nodemailer error:', err.message);
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
