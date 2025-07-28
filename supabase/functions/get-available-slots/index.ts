import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { google } from "npm:googleapis@105.0.0"; // googleapis può rimanere npm:

// =====================================================================
// 1. Regole di Disponibilità del Massoterapista
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
// 2. Funzione per generare gli slot di tempo disponibili (usando Date native)
// =====================================================================
const generateBaseTimeSlots = (date: Date): string[] => {
  // getDay() restituisce 0 per domenica, 1 per lunedì, ecc.
  const dayOfWeek = date.getDay();
  const availability = dailyAvailabilityRules[dayOfWeek];

  if (!availability) {
    return [];
  }

  const availableSlots: string[] = [];
  const [startHour, startMinute] = availability.start.split(':').map(Number);
  const [endHour, endMinute] = availability.end.split(':').map(Number);

  // Crea un oggetto Date per l'inizio corrente dello slot
  let currentTime = new Date(date); // Copia la data per evitare modifiche all'originale
  currentTime.setHours(startHour, startMinute, 0, 0); // Imposta ore e minuti, resetta secondi e millisecondi

  // Crea un oggetto Date per la fine della disponibilità
  const endTime = new Date(date); // Copia la data
  endTime.setHours(endHour, endMinute, 0, 0); // Imposta ore e minuti, resetta secondi e millisecondi

  const slotIntervalMinutes = 60; // Assumendo slot di 1 ora

  // Confronta i timestamp (millisecondi dall'epoca)
  while (currentTime.getTime() < endTime.getTime()) {
    // Formatta l'ora nel formato HH:mm
    const hours = currentTime.getHours().toString().padStart(2, '0');
    const minutes = currentTime.getMinutes().toString().padStart(2, '0');
    availableSlots.push(`${hours}:${minutes}`);

    // Avanza all'ora successiva
    currentTime.setMinutes(currentTime.getMinutes() + slotIntervalMinutes);
  }

  return availableSlots;
};

// =====================================================================
// 3. Funzione per filtrare gli slot passati (già quasi nativa)
// =====================================================================
const filterPastSlots = (slots: string[], dateString: string): string[] => {
  const now = new Date();
  // Ottieni la data di oggi nel formato YYYY-MM-DD
  const todayString = now.toISOString().split('T')[0];

  // Se la data selezionata è nel futuro, tutti gli slot sono validi
  if (dateString > todayString) {
    return slots;
  }

  // Filtra gli slot che sono già passati
  return slots.filter(slotTime => {
    const slotDateTime = new Date(`${dateString}T${slotTime}:00`);
    return slotDateTime.getTime() > now.getTime();
  });
};

// definizione degli headers CORS, permettono di accettare le richieste da frontend
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // In produzione, sostituisci con 'http://localhost:5173' o il dominio del tuo frontend
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json', // Aggiungi anche questo per le risposte JSON
};


// =====================================================================
// 4. Logica Principale della Edge Function
// =====================================================================
serve(async (req) => {
  console.log("Edge Function: Richiesta ricevuta.");
  console.log(`Edge Function: Metodo HTTP: ${req.method}`);

  // === INIZIO: GESTIONE RICHIESTE OPTIONS (PREFLIGHT CORS) ===
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders,
    });
  }
  // === FINE: GESTIONE RICHIESTE OPTIONS ===


  // Controlla che la richiesta reale sia di tipo POST
  if (req.method !== 'POST') {
    console.error("Edge Function: Metodo non consentito:", req.method);
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: corsHeaders,
    });
  }

  let requestData;
  try {
    requestData = await req.json();
    console.log("Edge Function: Dati della richiesta parsati:", requestData);
  } catch (e) {
    console.error("Edge Function: Errore nel parsing del JSON della richiesta:", e);
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: corsHeaders,
    });
  }

  const { date: dateString } = requestData; // dateString è nel formato 'YYYY-MM-DD'

  if (!dateString) {
    console.error("Edge Function: Parametro 'date' mancante nella richiesta.");
    return new Response(JSON.stringify({ error: 'Missing date parameter' }), {
      status: 400,
      headers: corsHeaders,
    });
  }

  // Crea un oggetto Date nativo dalla stringa della data selezionata
  // Importante: per evitare problemi di fuso orario, crea la data in UTC o specifica il fuso orario
  // Per semplicità e coerenza con l'input YYYY-MM-DD, creiamo una data locale a mezzanotte
  const selectedDate = new Date(`${dateString}T00:00:00`);

  let availableSlots = generateBaseTimeSlots(selectedDate);
  console.log("Edge Function: Slot base generati:", availableSlots);

  availableSlots = filterPastSlots(availableSlots, dateString);
  console.log("Edge Function: Slot dopo filtro 'passato':", availableSlots);

  // =====================================================================
  // 5. Autenticazione con Google Calendar e Recupero Eventi
  // =====================================================================
  try {
    const credentialsString = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_CREDENTIALS');
    if (!credentialsString) {
      throw new Error('Secret GOOGLE_SERVICE_ACCOUNT_CREDENTIALS non trovato.');
    }

    // --- INIZIO: LOG DI DEBUG CHIAVE PRIVATA (DA RIMUOVERE IN PRODUZIONE) ---
    console.log("Edge Function: Secret stringa recuperata (parziale):", credentialsString.substring(0, 50) + "..." + credentialsString.substring(credentialsString.length - 50));
    // --- FINE: LOG DI DEBUG ---

    const credentials = JSON.parse(credentialsString);

    // --- INIZIO: LOG DI DEBUG CHIAVE PRIVATA (DA RIMUOVERE IN PRODUZIONE) ---
    console.log("Edge Function: Credenziali parsate (oggetto):", credentials);
    console.log("Edge Function: private_key presente?", !!credentials.private_key);
    console.log("Edge Function: client_email presente?", !!credentials.client_email);
    console.log("Edge Function: private_key RAW (primi 100 char):", String(credentials.private_key).substring(0, 100));
    console.log("Edge Function: private_key RAW (ultimi 100 char):", String(credentials.private_key).substring(String(credentials.private_key).length - 100));
    // --- FINE: LOG DI DEBUG ---

    if (!credentials || !credentials.private_key || !credentials.client_email) {
      throw new Error('Credenziali Google Service Account non configurate correttamente (campi mancanti).');
    }

    // Questo .replace() dovrebbe funzionare correttamente se il problema era lì
    const privateKeyWithCorrectNewlines = (credentials.private_key as string).replace(/\\n/g, '\n');

    // --- INIZIO: LOG DI DEBUG CHIAVE PRIVATA (DA RIMUOVERE IN PRODUZIONE) ---
    console.log("Edge Function: private_key AFTER REPLACE (primi 100 char):", privateKeyWithCorrectNewlines.substring(0, 100));
    console.log("Edge Function: private_key AFTER REPLACE (ultimi 100 char):", privateKeyWithCorrectNewlines.substring(privateKeyWithCorrectNewlines.length - 100));
    // --- FINE: LOG DI DEBUG ---


    const jwtClient = new google.auth.JWT(
      credentials.client_email,
      null,
      privateKeyWithCorrectNewlines, // Usa la chiave con i caratteri di nuova riga corretti
      ['https://www.googleapis.com/auth/calendar.events.readonly'] // Permesso di sola lettura degli eventi
    );

    await jwtClient.authorize(); // Questa riga è quella che generava l'errore "No key or keyFile set"
    console.log("Edge Function: JWT Client autorizzato con successo."); // Se vedi questo, il problema è risolto

    const calendar = google.calendar({ version: 'v3', auth: jwtClient });

    // Definisci l'intervallo di tempo per la query (l'intera giornata selezionata)
    // Usa Date native e toISOString() per il formato richiesto da Google Calendar
    const startOfDay = new Date(dateString);
    startOfDay.setHours(0, 0, 0, 0); // Inizio del giorno selezionato
    const timeMin = startOfDay.toISOString();

    const endOfDay = new Date(dateString);
    endOfDay.setHours(23, 59, 59, 999); // Fine del giorno selezionato
    const timeMax = endOfDay.toISOString();

    // Sostituisci 'YOUR_MASSOTERAPISTA_CALENDAR_ID' con l'ID del calendario del massoterapista.
    // Solitamente è l'indirizzo email del calendario.
    const calendarId = 'tommasovilla91@gmail.com'; // <-- DA MODIFICARE!

    console.log(`Edge Function: Richiesta eventi Google Calendar per ${dateString} (da ${timeMin} a ${timeMax})`);

    const calendarResponse = await calendar.events.list({
      calendarId: calendarId,
      timeMin: timeMin,
      timeMax: timeMax,
      singleEvents: true, // Espande gli eventi ricorrenti
      orderBy: 'startTime',
      showDeleted: false, // Non mostrare eventi cancellati
    });

    const events = calendarResponse.data.items || [];
    console.log("Edge Function: Eventi Google Calendar trovati:", events.map(e => ({ summary: e.summary, start: e.start?.dateTime || e.start?.date, end: e.end?.dateTime || e.end?.date })));

    // =====================================================================
    // 6. Filtrare gli slot in base agli impegni del Google Calendar
    // =====================================================================
    const finalAvailableSlots: string[] = availableSlots.filter(slotTime => {
      // Crea oggetti Date per l'inizio e la fine dello slot
      const slotStart = new Date(`${dateString}T${slotTime}:00`);
      const slotEnd = new Date(slotStart.getTime() + (60 * 60 * 1000)); // Aggiungi 60 minuti (in millisecondi)

      const isOverlapping = events.some(event => {
        // Gli eventi dal calendario sono già oggetti Date o stringhe ISO, quindi li convertiamo
        const eventStartDate = new Date(event.start?.dateTime || event.start?.date || '');
        const eventEndDate = new Date(event.end?.dateTime || event.end?.date || '');

        // Controllo sovrapposizione usando getTime()
        return (eventStartDate.getTime() < slotEnd.getTime() && eventEndDate.getTime() > slotStart.getTime());
      });

      return !isOverlapping; // Mantieni lo slot solo se NON si sovrappone
    });

    console.log("Edge Function: Slot finali disponibili dopo filtro Google Calendar:", finalAvailableSlots);

    // =====================================================================
    // 7. Restituire l'array finale degli slot disponibili
    // =====================================================================
    return new Response(
      JSON.stringify({ slots: finalAvailableSlots }),
      { headers: corsHeaders },
    );

  } catch (error: any) { // Aggiunto ': any' per tipizzare l'errore
    console.error("Edge Function: Errore durante l'elaborazione del calendario:", error.message || error);
    return new Response(
      JSON.stringify({ error: 'Failed to retrieve available slots', details: error.message || 'Unknown error' }),
      { status: 500, headers: corsHeaders },
    );
  }
});