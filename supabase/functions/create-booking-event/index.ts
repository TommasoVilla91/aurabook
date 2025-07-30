import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { google } from "npm:googleapis@105.0.0";
import sgMail from "npm:@sendgrid/mail@7.7.0"; // libreria SendGrid

// definizione degli headers CORS, permettono di accettare le richieste da frontend
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // da sostituire con l'url del frontend in produzione
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

serve(async (req) => {

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // controlla che la richiesta reale sia di tipo POST
  if (req.method !== 'POST') {
    console.error("Edge Function (create-booking-event): Metodo non consentito:", req.method);
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: corsHeaders,
    });
  }

  // analizza il corpo della richiesta
  let requestData; // oggetto che conterrà i dati della richiesta
  try {
    requestData = await req.json(); // è in formato JSON, quindi bisogna parsere il corpo
    console.log("Edge Function (create-booking-event): Dati della richiesta parsati:", requestData);

  } catch (e) {
    console.error("Edge Function (create-booking-event): Errore nel parsing del JSON della richiesta:", e);

    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: corsHeaders,
    });
  }

  // estrazione dati necessari dal corpo della richiesta
  const {
    name,
    surname,
    phone,
    email,
    birthdate,
    booking_date, // Formato YYYY-MM-DD
    booking_time, // Formato HH:mm
    message
  } = requestData;

  // validazione dei dati
  if (!name || !surname || !phone || !email || !booking_date || !booking_time) {
    console.error("Edge Function (create-booking-event): Dati del form mancanti.");
    return new Response(JSON.stringify({ error: 'Missing form data' }), {
      status: 400,
      headers: corsHeaders,
    });
  }

  try {
    // Autenticazione con Google Calendar API (riutilizzo della logica da get-available-slots)
    const credentialsString = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_CREDENTIALS');
    if (!credentialsString) {
      throw new Error('Secret GOOGLE_SERVICE_ACCOUNT_CREDENTIALS non trovato.');
    }
    const credentials = JSON.parse(credentialsString);

    if (!credentials || !credentials.private_key || !credentials.client_email) {
      throw new Error('Credenziali Google Service Account non configurate correttamente.');
    }

    const privateKeyWithCorrectNewlines = (credentials.private_key as string).replace(/\\n/g, '\n');

    // jwtClient è un client per l'autenticazione Google usanto un account di servizio 
    const jwtClient = new google.auth.JWT( // google.auth.JWT permette l'autenticazione
      credentials.client_email, // email del client
      null,
      privateKeyWithCorrectNewlines, // chiave privata del client sistemata
      ['https://www.googleapis.com/auth/calendar.events'] // stavolta con permesso di scrittura eventi!
    );

    console.log(`Edge Function (create-booking-event): booking_date ricevuto: '${booking_date}'`);
    console.log(`Edge Function (create-booking-event): booking_time ricevuto: '${booking_time}'`);

    await jwtClient.authorize();
    console.log("Edge Function (create-booking-event): JWT Client autorizzato con successo.");

    // google.calendar è un modulo che permette di interagire con l'API di Google Calendar
    const calendar = google.calendar({ version: 'v3', auth: jwtClient });

    // Prepara la data e l'ora dell'evento in UTC
    const eventStartDateTimeString = `${booking_date}T${booking_time}:00Z`;
    const eventStartDate = new Date(eventStartDateTimeString);
    const eventEndDate = new Date(eventStartDate.getTime() + (60 * 60 * 1000)); // 1 ora dopo

    const calendarId = 'tommasovilla91@gmail.com';

    // oggetto evento per Google Clendar
    const event = {
      summary: `DA CONFERMARE: protazione ${name} ${surname}`,
      description: `Motivo visita: ${message}\n\nContatti:\nTelefono: ${phone}\nEmail: ${email}\nData di nascita: ${birthdate}`,
      start: {
        dateTime: eventStartDate.toISOString(),
        timeZone: 'Europe/Rome',
      },
      end: {
        dateTime: eventEndDate.toISOString(),
        timeZone: 'Europe/Rome', // Specifica il fuso orario del calendario
      },
      // per aggiungere invitati se vuoi inviare un invito anche al paziente
      // attendees: [
      //   { email: email, displayName: `${name} ${surname}` }, // Paziente
      //   // possibilità aggiungere anche l'email del massoterapista se vuoi che riceva un invito formale
      //   // { email: 'massoterapista@example.com', self: true }, 
      // ],
      // imposta lo stato dell'evento come provvisorio in attesa di conferma
      status: 'tentative', // o 'confirmed' se subito confermato
      // promemoria
      // reminders: {
      //   useDefault: false,
      //   overrides: [
      //     { method: 'email', minutes: 24 * 60 }, // 24 ore prima
      //     { method: 'popup', minutes: 60 }, // 60 minuti prima
      //   ],
      // },
    };

    // creazione evento nel Google Calendar
    const createdEvent = await calendar.events.insert({
      calendarId: calendarId,
      requestBody: event,
      sendNotifications: true, // Invia notifiche agli invitati (se presenti)
    });

    console.log("Edge Function (create-booking-event): Evento creato nel Google Calendar:", createdEvent.data.htmlLink);

    
    // integrazione servizio di invio email SendGrid
    const sendgridApiKey = Deno.env.get('SENDGRID_API_KEY'); // prendere la chiave API SandGrid

    if (!sendgridApiKey) {
      console.error("Edge Function (create-booking-event): SENDGRID_API_KEY non trovato. Impossibile inviare email al paziente.");
      // in caso far fallire l'intera operazione
      // ora l'evento viene creato comunque
    } else {
      // setApiKey è il metodo per impostare la chiave API di SendGrid
      sgMail.setApiKey(sendgridApiKey)

      const msg = {
        to: email, // email del paziente
        from: 'tommasovilla91@gmail.com', // da cambiare con l'email di Fra verificata su SendGrid
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
      };

      try {
        await sgMail.send(msg);
        console.log(`Edge Function (create-booking-event): Email di conferma inviata a ${email} tramite SendGrid.`);

      } catch (sgError) {
        if (sgError instanceof Error) {
          console.error("Edge Function (create-booking-event): Errore invio email con SendGrid:", sgError.response?.body);

        } else {
          console.error(sgError);
        };
      };
    };

    // Risposta di successo al frontend
    return new Response(
      JSON.stringify({ success: true, message: 'Prenotazione effettuata e evento creato!', eventLink: createdEvent.data.htmlLink }),
      { status: 200, headers: corsHeaders },
    ); 
  } catch (err) {

    if (err instanceof Error) {
      console.error("Edge Function (create-booking-event): Errore durante la creazione dell'evento o l'invio email:", err.message);
      return new Response(
        JSON.stringify({ err: 'Failed to create booking', details: err.message || 'Unknown error' }),
        { status: 500, headers: corsHeaders },
      );
    } else {
      console.error(err);
    };
  };
});