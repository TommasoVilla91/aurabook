import { google } from 'googleapis';
import sgMail from '@sendgrid/mail';
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
    const credentialsString = process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS;
    if (!credentialsString) throw new Error('GOOGLE_SERVICE_ACCOUNT_CREDENTIALS not configured');

    const credentials = JSON.parse(credentialsString);
    const privateKey = credentials.private_key.replace(/\\n/g, '\n');
    const clientEmail = credentials.client_email;

    const jwtClient = new google.auth.JWT(
      clientEmail,
      null,
      privateKey,
      ['https://www.googleapis.com/auth/calendar.events']
    );

    await jwtClient.authorize();
    const calendar = google.calendar({ version: 'v3', auth: jwtClient });

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

    // ── SendGrid: mail di ricevuta al cliente ──────────────────────────
    // emailSent viene incluso nella risposta per facilitare il debug in sviluppo.
    // Un eventuale errore SendGrid non blocca la prenotazione (già salvata su Calendar).
    let emailSent = false;
    let emailError = null;

    const sendgridKey = process.env.SENDGRID_API_KEY;
    if (!sendgridKey) {
      emailError = 'SENDGRID_API_KEY non configurata nelle variabili d\'ambiente Vercel';
      console.warn('SendGrid skip:', emailError);
    } else {
      // Log diagnostico: mostra i primi 7 caratteri per verificare che inizi con "SG."
      console.log('SendGrid key prefix:', sendgridKey.substring(0, 7), '| length:', sendgridKey.length);
      sgMail.setApiKey(sendgridKey);
      // Genera subject e HTML dal template esterno (api/emailTemplates/customerConfirmation.js)
      const { subject, html } = customerConfirmationEmail({ name, dateLabel, booking_time });
      try {
        await sgMail.send({
          to: email,
          // ⚠️  Sostituire con l'email mittente verificata in SendGrid Sender Authentication
          from: 'tommasovilla91@gmail.com',
          subject,
          html,
        });
        emailSent = true;
      } catch (sgError) {
        emailError = sgError.message;
        console.error('SendGrid error:', sgError.message, sgError.response?.body);
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
