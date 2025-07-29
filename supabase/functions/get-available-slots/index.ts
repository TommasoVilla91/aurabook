import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { google } from "npm:googleapis@105.0.0"; // googleapis può rimanere npm:

// =====================================================================
// Regole di Disponibilità del Massoterapista
// =====================================================================
const dailyAvailabilityRules = {
  // Lunedì (1)
  1: { start: '15:30', end: '19:30' },
  // Martedì (2) - Mercoledì (3) - Giovedì (4) - Venerdì (5)
  2: { start: '08:00', end: '19:30' }, // Martedì
  3: { start: '08:00', end: '12:00' }, // Mercoledì
  4: { start: '08:00', end: '12:00' }, // Giovedì
  5: { start: '08:00', end: '19:30' }, // Venerdì
  // Sabato (6)
  6: { start: '09:00', end: '12:00' },
  // Domenica (0)
  0: null // Nessuna disponibilità
};

// =====================================================================
// Funzione per ottenere l'offset UTC dell'Italia data una stringa di una data
// =====================================================================

const getItalianUTCOffsetHours = (dateString: string): number => {
  // oggetto Date per un momento specifico (es. mezzogiorno) in UTC
  // permette di determinare l'offset corretto per quella data, tenendo conto dell'ora legale
  const testDate = new Date(`${dateString}T12:00:00Z`);

  const italianTimezone = 'Europe/Rome';

  // Intl.DateTimeFormatOptions serve a determinare la zona del fuso d'interesse
  const options: Intl.DateTimeFormatOptions = {
    timeZone: italianTimezone, // imposta il fuso italiano
    timeZoneName: 'shortOffset', // nome del fuso orario con l'offset "GMT+1", "GMT+2"
  };

  const formatter = new Intl.DateTimeFormat('en-US', options); // formattazione data internazionale

  // formatToParts restituisce un array di parti della data formattata (anno, mese, giorno, ora, fuso orario, ecc.)
  const parts = formatter.formatToParts(testDate); // [..., { type: 'timeZoneName', value: 'GMT+2' }, ...]

  // trovare la parte relativa al nome del fuso orario
  const offsetPart = parts.find(p => p.type === 'timeZoneName'); // output = [{ type: 'timeZoneName', value: 'GMT+2' }]

  if (offsetPart) {
    // match serve per estrarre il numero dopo "GMT"
    const offsetMatch = offsetPart.value.match(/GMT([+-]\d+)/); // output = ['GMT', '+1'] 
    if (offsetMatch && offsetMatch[1]) {
      return parseInt(offsetMatch[1], 10); // Restituisce 1 o 2
    }
  }
  return 0;
};

// =====================================================================
// Funzione per generare gli slot di tempo disponibili
// =====================================================================

const generateBaseTimeSlots = (date: Date): string[] => {
  // getDay() restituisce 0 per domenica, 1 per lunedì, ecc.
  const dayOfWeek = new Date(`${date}T00:00:00Z`).getUTCDay(); // getUTCDay perché la data è in UTC
  const availability = dailyAvailabilityRules[dayOfWeek];

  if (!availability) {
    return [];
  }

  // offset dinamico dell'Italia per la data selezionata
  const italianOffsetHours = getItalianUTCOffsetHours(date); // output = o 2 o 1

  const availableSlots: string[] = [];
  const [startHour, startMinute] = availability.start.split(':').map(Number); // .map converte in numero
  const [endHour, endMinute] = availability.end.split(':').map(Number);

  const [year, month, day] = date.split('-').map(Number); // output = [2025, 10, 15]

  // Converti gli orari locali italiani in orari UTC equivalenti
  let startHourUTC = startHour - italianOffsetHours; // 11 - 2 || 11 - 1
  let endHourUTC = endHour - italianOffsetHours;

  // Crea oggetti Date in UTC per l'inizio e la fine corrente dello slot
  let currentTime = new Date(Date.UTC(year, month - 1, day, startHourUTC, startMinute, 0)); // output = 2025-10-15T11:30:00.000Z
  const endTime = new Date(Date.UTC(year, month - 1, day, endHourUTC, endMinute, 0));

  const slotIntervalMinutes = 60; // slot di 1 ora

  // Confronta i timestamp (millisecondi dall'epoca) e formatta l'ora nel formato HH:mm
  while (currentTime.getTime() < endTime.getTime()) {
    const hours = currentTime.getUTCHours().toString().padStart(2, '0'); // output = '11'
    const minutes = currentTime.getUTCMinutes().toString().padStart(2, '0'); // output = '30'

    // Aggiunge la stringa dello slot
    availableSlots.push(`${hours}:${minutes}`);

    // prende il tempo attuale, imposta i minuti prendendo i minuti attuali e aggiungendo 60 minuti
    // in modo da creare lo slot successivo
    currentTime.setUTCMinutes(currentTime.getUTCMinutes() + slotIntervalMinutes);
  }

  return availableSlots; // output = ['08:00', '09:00', ...]
};


// =====================================================================
// Funzione per filtrare gli slot passati e ottenere solo quelli futuri
// =====================================================================

const filterPastSlots = (slots: string[], dateString: string): string[] => {
  const now = new Date(); // è gia in UTC

  // Ottieni la data di oggi nel formato YYYY-MM-DD
  const todayString = now.toISOString().split('T')[0];

  // Se la data selezionata è nel futuro, tutti gli slot sono validi
  if (dateString > todayString) {
    return slots;
  }

  // Filtra gli slot che sono già passati
  return slots.filter(slotTime => {
    const slotDateTime = new Date(`${dateString}T${slotTime}:00Z`);
    // confronta l'ora attuale con l'ora degli slot e ritorna solo gli slot futuri
    return slotDateTime.getTime() > now.getTime();
  });
};


// =====================================================================
// Logica Principale della Edge Function
// =====================================================================

// definizione degli headers CORS, permettono di accettare le richieste da frontend
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // In produzione, sostituisci con 'http://localhost:5173' o il dominio del tuo frontend
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json', // Aggiungi anche questo per le risposte JSON
};

serve(async (req) => {
  console.log("Edge Function: Richiesta ricevuta.");
  console.log(`Edge Function: Metodo HTTP: ${req.method}`);

  if (req.method === 'OPTIONS') {
    // new Response è un oggetto JS che permette di creare una risposta HTTP 
    return new Response('ok', {
      headers: corsHeaders,
    });
  }

  // Controlla che la richiesta reale sia di tipo POST
  if (req.method !== 'POST') {
    console.error("Edge Function: Metodo non consentito:", req.method);

    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: corsHeaders,
    });
  }

  // analizza il corpo della richiesta
  let requestData; // oggetto che conterrà la data selezionata dal frontend
  try {
    requestData = await req.json(); // è in formato JSON, quindi bisogna parsere il corpo
    console.log("Edge Function: Dati della richiesta parsati:", requestData);

  } catch (e) {
    console.error("Edge Function: Errore nel parsing del JSON della richiesta:", e);

    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: corsHeaders,
    });
  }

  // dateString è nel formato 'YYYY-MM-DD'
  const { date: dateString } = requestData; // output = 2025-10-15

  if (!dateString) {
    console.error("Edge Function: Parametro 'date' mancante nella richiesta.");

    return new Response(JSON.stringify({ error: 'Missing date parameter' }), {
      status: 400,
      headers: corsHeaders,
    });
  }

  let availableSlots = generateBaseTimeSlots(dateString); // genera slot in UTC
  console.log("Edge Function: Slot base generati:", availableSlots);

  availableSlots = filterPastSlots(availableSlots, dateString); // filtra slot passati
  console.log("Edge Function: Slot dopo filtro 'passato':", availableSlots);

  // =====================================================================
  // Autenticazione con Google Calendar e Recupero Eventi
  // =====================================================================

  // Controlla se le credenziali di Google sono configuarte bene
  try {
    const credentialsString = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_CREDENTIALS');
    if (!credentialsString) {
      throw new Error('Secret GOOGLE_SERVICE_ACCOUNT_CREDENTIALS non trovato.');
    }

    // Parsare le credenziali
    const credentials = JSON.parse(credentialsString);
    // e controllare che i campi necessare siano presenti
    if (!credentials || !credentials.private_key || !credentials.client_email) {
      throw new Error('Credenziali Google Service Account non configurate correttamente (campi mancanti).');
    }
    // sistemare i caratteri della chiave privata 
    const privateKeyWithCorrectNewlines = (credentials.private_key as string).replace(/\\n/g, '\n');

    // jwtClient è un client per l'autenticazione Google usanto un account di servizio 
    const jwtClient = new google.auth.JWT( // google.auth.JWT permette l'autenticazione
      credentials.client_email, // email del client
      null,
      privateKeyWithCorrectNewlines, // chiave privata del client sistemata
      ['https://www.googleapis.com/auth/calendar.events.readonly'] // permesso di sola lettura degli eventi
    );

    await jwtClient.authorize(); // Autentica il client JWT
    console.log("Edge Function: JWT Client autorizzato con successo.");

    // google.calendar è un modulo che permette di interagire con l'API di Google Calendar
    const calendar = google.calendar({ version: 'v3', auth: jwtClient });

    // Definizione intervallo di tempo per la query (l'intera giornata selezionata)    
    const startOfDay = new Date(`${dateString}T00:00:00Z`);
    const timeMin = startOfDay.toISOString(); // toISOString() per il formato richiesto da Google Calendar

    const endOfDay = new Date(`${dateString}T23:59:59.999Z`);
    const timeMax = endOfDay.toISOString();

    const calendarId = 'tommasovilla91@gmail.com';

    // calendar.events.list è il metodo per recuperare gli eventi dal calendario
    const calendarResponse = await calendar.events.list({
      calendarId: calendarId,
      timeMin: timeMin,
      timeMax: timeMax,
      singleEvents: true, // Espande gli eventi ricorrenti
      orderBy: 'startTime',
      showDeleted: false, // Non mostrare eventi cancellati
    });

    // calendarResponse.data.items contiene tutti gli eventi trovati
    const events = calendarResponse.data.items || [];
    console.log("Edge Function: Eventi Google Calendar trovati:", events.map(e => ({ summary: e.summary, start: e.start?.dateTime || e.start?.date, end: e.end?.dateTime || e.end?.date })));



    // =====================================================================
    // Filtrare gli slot in base agli impegni del Google Calendar ed ottenere gli slot finali disponibili
    // =====================================================================

    const finalAvailableSlots: string[] = availableSlots.filter(slotTime => {

      // Crea oggetti Date per l'inizio e la fine dello slot
      const slotStart = new Date(`${dateString}T${slotTime}:00Z`);
      const slotEnd = new Date(slotStart.getTime() + (60 * 60 * 1000)); // Aggiungi 60 minuti (in millisecondi)

      // ciclo eventi e controllo se questo slot si sovrappone a qualsiasi altro evento del calendario
      const isOverlapping = events.some(event => {
        // gli eventi di Google Calendar possono avere un orario di inizio/fine completo oppure solo una data per gli eventi "tutto il giorno"
        // se l'evento ha un orario di inizio/fine, lo trasformo con Date
        // altrimenti lo trasformo in un oggetto Date che rappresenta l'inizio/fine di quel giorno
        const eventStartDate = event.start?.dateTime ? new Date(event.start.dateTime) : new Date(`${event.start?.date}T00:00:00Z`); // output = 2025-10-15T08:00:00.000Z
        const eventEndDate = event.end?.dateTime ? new Date(event.end.dateTime) : new Date(`${event.end?.date}T00:00:00Z`);

        // Controllo se lo slot si sovrappone ad un evento esistente nel Goggle Calendar 
        return (eventStartDate.getTime() < slotEnd.getTime() && eventEndDate.getTime() > slotStart.getTime());
      });

      return !isOverlapping; // Mantieni lo slot solo se NON si sovrappone
    });

    console.log("Edge Function: Slot finali disponibili dopo filtro Google Calendar:", finalAvailableSlots);



    // =====================================================================
    // Convertire gli slot finali da UTC a orari locali italiani per il frontend
    // =====================================================================

    // ottengo offset dinamico itlaiano (2 o 1)
    const italianOffsetHours = getItalianUTCOffsetHours(dateString);

    // ciclo array slot disponibili e ritorno array di stringhe con orari HH:mm
    const finalAvailableSlotsItalianTime: string[] = finalAvailableSlots.map(utcSlotTime => {
      const [hourUTC, minuteUTC] = utcSlotTime.split(':').map(Number);

      // Convertire l'ora UTC in ora locale italiana
      const hourLocal = hourUTC + italianOffsetHours;

      // Formattare l'ora e i minuti per la visualizzazione
      const formattedHour = hourLocal.toString().padStart(2, '0');
      const formattedMinute = minuteUTC.toString().padStart(2, '0');

      return `${formattedHour}:${formattedMinute}`; // output = '13:30' 
    });



    // =====================================================================
    // Restituire l'array finale degli slot disponibili
    // =====================================================================

    return new Response(
      JSON.stringify({ slots: finalAvailableSlotsItalianTime }),
      { headers: corsHeaders },
    );

  } catch (error) {

    if (error instanceof Error) {
      console.error("Edge Function: Errore durante l'elaborazione del calendario:", error.message || error);
      return new Response(
        JSON.stringify({ error: 'Failed to retrieve available slots', details: error.message || 'Unknown error' }),
        { status: 500, headers: corsHeaders },
      );

    } else  {
      console.error(error);
    };
  };
});

// supabase functions deploy get-available-slots