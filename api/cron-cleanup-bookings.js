import { getAuthorizedCalendar } from './lib/googleAuth.js';

/**
 * Vercel Cron Job — eliminazione automatica prenotazioni vecchie.
 *
 * Viene invocato da Vercel ogni giorno alle 03:00 (UTC) secondo la
 * configurazione in vercel.json. Elimina da Google Calendar tutti gli
 * eventi di prenotazione (summary inizia con "DA CONFERMARE:") la cui
 * data di visita è antecedente a 3 mesi fa.
 *
 * Protezione: Vercel invia l'header "Authorization: Bearer {CRON_SECRET}".
 * Aggiungere la variabile d'ambiente CRON_SECRET sia in locale (.env)
 * che su Vercel (Project Settings → Environment Variables).
 */
export default async function handler(req, res) {
  // Accetta solo richieste GET (Vercel Cron usa GET)
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Verifica il segreto cron per evitare invocazioni non autorizzate
  const authHeader = req.headers['authorization'] || '';
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const calendar = await getAuthorizedCalendar();
    const calendarId = process.env.GOOGLE_CALENDAR_ID;

    // Soglia: 3 mesi fa rispetto ad ora
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - 3);

    // Recupera tutti gli eventi fino alla soglia (le prenotazioni future non toccate)
    const response = await calendar.events.list({
      calendarId,
      timeMax:      cutoff.toISOString(), // solo eventi terminati prima della soglia
      singleEvents: true,
      orderBy:      'startTime',
      showDeleted:  false,
      maxResults:   500,
    });

    const items = response.data.items || [];

    // Filtra solo le prenotazioni (summary inizia con "DA CONFERMARE:")
    const toDelete = items.filter(
      (e) => e.summary && /^DA CONFERMARE:/i.test(e.summary)
    );

    if (toDelete.length === 0) {
      return res.status(200).json({ deleted: 0, message: 'Nessuna prenotazione da eliminare.' });
    }

    // Elimina in parallelo (al massimo 10 alla volta per non saturare la quota GCal API)
    const BATCH = 10;
    let deleted = 0;

    for (let i = 0; i < toDelete.length; i += BATCH) {
      const chunk = toDelete.slice(i, i + BATCH);
      await Promise.all(
        chunk.map((e) =>
          calendar.events.delete({ calendarId, eventId: e.id }).then(() => deleted++)
        )
      );
    }

    console.log(`cron-cleanup-bookings: eliminate ${deleted} prenotazioni antecedenti al ${cutoff.toLocaleDateString('it-IT')}`);
    return res.status(200).json({ deleted, cutoff: cutoff.toISOString() });

  } catch (error) {
    console.error('cron-cleanup-bookings error:', error.message);
    return res.status(500).json({ error: 'Errore del server', details: error.message });
  }
}
