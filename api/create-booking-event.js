import { google } from 'googleapis';
import sgMail from '@sendgrid/mail';

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
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;

    if (!privateKey || !clientEmail) throw new Error('Google credentials not configured');

    const jwtClient = new google.auth.JWT(
      clientEmail,
      null,
      privateKey,
      ['https://www.googleapis.com/auth/calendar.events']
    );

    await jwtClient.authorize();
    const calendar = google.calendar({ version: 'v3', auth: jwtClient });

    const eventStart = new Date(`${booking_date}T${booking_time}:00Z`);
    const eventEnd = new Date(eventStart.getTime() + 60 * 60 * 1000);

    const event = {
      summary: `DA CONFERMARE: prenotazione ${name} ${surname}`,
      description: `Motivo visita: ${message}\n\nContatti:\nTelefono: ${phone}\nEmail: ${email}\nData di nascita: ${birthdate}`,
      start: { dateTime: eventStart.toISOString(), timeZone: 'Europe/Rome' },
      end: { dateTime: eventEnd.toISOString(), timeZone: 'Europe/Rome' },
      status: 'tentative',
    };

    const createdEvent = await calendar.events.insert({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      requestBody: event,
      sendNotifications: true,
    });

    const sendgridKey = process.env.SENDGRID_API_KEY;
    if (sendgridKey) {
      sgMail.setApiKey(sendgridKey);
      try {
        await sgMail.send({
          to: email,
          from: 'tommasovilla91@gmail.com',
          subject: 'Conferma Prenotazione Massoterapista',
          html: `
            <h1>Ciao ${name},</h1>
            <p>Grazie per aver prenotato la tua visita con Francesco.</p>
            <p>Dettagli della prenotazione:</p>
            <ul>
              <li><strong>Data:</strong> ${booking_date}</li>
              <li><strong>Ora:</strong> ${booking_time}</li>
              <li><strong>Durata:</strong> 1 ora</li>
            </ul>
            <p>Sarai ricontattato da Francesco per la conferma finale.</p>
            <p>Grazie mille ancora e a presto!</p>
          `,
        });
      } catch (sgError) {
        console.error('SendGrid error:', sgError.message);
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Prenotazione effettuata!',
      eventLink: createdEvent.data.htmlLink,
    });
  } catch (err) {
    console.error('create-booking-event error:', err.message);
    return res.status(500).json({ error: 'Failed to create booking', details: err.message });
  }
}
