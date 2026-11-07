import { google } from 'googleapis';

/**
 * Crea un client Google Calendar autenticato.
 *
 * Supporta due modalità:
 *  - Produzione (Vercel): GOOGLE_SERVICE_ACCOUNT_CREDENTIALS = JSON completo del service account
 *  - Sviluppo locale:     GOOGLE_SERVICE_ACCOUNT_EMAIL + GOOGLE_PRIVATE_KEY come variabili separate
 */
export function getCalendarClient(scopes = ['https://www.googleapis.com/auth/calendar.events']) {
  let clientEmail, privateKey;

  if (process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS) {
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS);
    clientEmail = credentials.client_email;
    privateKey  = credentials.private_key.replace(/\\n/g, '\n');
  } else if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
    clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    privateKey  = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');
  } else {
    throw new Error(
      'Google credentials not configured. ' +
      'Set GOOGLE_SERVICE_ACCOUNT_CREDENTIALS (production) ' +
      'or GOOGLE_SERVICE_ACCOUNT_EMAIL + GOOGLE_PRIVATE_KEY (local dev).'
    );
  }

  const jwtClient = new google.auth.JWT(clientEmail, null, privateKey, scopes);
  return { jwtClient, calendar: null }; // calendario creato dopo authorize()
}

export async function getAuthorizedCalendar(scopes = ['https://www.googleapis.com/auth/calendar.events']) {
  const { jwtClient } = getCalendarClient(scopes);
  await jwtClient.authorize();
  return google.calendar({ version: 'v3', auth: jwtClient });
}
