/**
 * customerConfirmation.js
 *
 * Template della mail automatica che il cliente riceve dopo aver
 * inviato la richiesta di appuntamento.
 *
 * IMPORTANTE: questa mail NON è una conferma definitiva.
 * La conferma avviene successivamente tramite mail manuale di Francesco.
 *
 * ─── Cosa personalizzare ────────────────────────────────────────────
 *  STUDIO_ADDRESS  →  indirizzo fisico dello studio
 *  STUDIO_NAME     →  nome visualizzato nell'intestazione
 *  THERAPIST_NAME  →  nome del massoterapista (usato nel testo)
 *  REPLY_TO        →  email a cui il cliente può rispondere per modifiche
 * ────────────────────────────────────────────────────────────────────
 */

// ── Dati dello studio (modificare prima del go-live) ─────────────────
const STUDIO_NAME     = 'Francesco · Massoterapista';
const THERAPIST_NAME  = 'Francesco';
const STUDIO_ADDRESS  = 'Via fratelli Bronzetti, 9 – Milano';
// ─────────────────────────────────────────────────────────────────────

/**
 * Genera subject e HTML per la mail di ricevuta al cliente.
 *
 * @param {object} params
 * @param {string} params.name         - Nome del cliente
 * @param {string} params.dateLabel    - Data formattata in italiano (es. "martedì 15 aprile 2026")
 * @param {string} params.booking_time - Orario slot (es. "10:00")
 * @returns {{ subject: string, html: string }}
 */
export function customerConfirmationEmail({ name, dateLabel, booking_time }) {
  const subject = 'Abbiamo ricevuto la tua richiesta di appuntamento';

  const html = `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background-color:#f4fbf2;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#2d2d2d;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4fbf2;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:560px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header verde -->
          <tr>
            <td style="background-color:#5a7b56;padding:28px 32px;">
              <p style="margin:0;font-size:13px;color:rgba(247,255,237,0.7);text-transform:uppercase;letter-spacing:0.08em;">${STUDIO_NAME}</p>
              <h1 style="margin:8px 0 0;font-size:20px;font-weight:600;color:#f7ffed;">Richiesta ricevuta</h1>
            </td>
          </tr>

          <!-- Corpo -->
          <tr>
            <td style="padding:28px 32px;">
              <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">
                Ciao <strong>${name}</strong>,<br/>
                abbiamo ricevuto la tua richiesta di appuntamento. ${THERAPIST_NAME} la verificherà
                al più presto e ti contatterà per <strong>confermarti la disponibilità</strong>.
              </p>

              <!-- Riquadro riepilogo -->
              <table width="100%" cellpadding="0" cellspacing="0"
                style="background-color:#f4fbf2;border-radius:8px;border:1px solid #d8eed5;margin:20px 0;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 12px;font-size:11px;font-weight:700;color:#5a7b56;
                               text-transform:uppercase;letter-spacing:0.08em;">Dettagli richiesta</p>
                    <table cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="padding:5px 0;font-size:13px;color:#666;width:110px;">Data</td>
                        <td style="padding:5px 0;font-size:13px;font-weight:600;color:#2d2d2d;text-transform:capitalize;">${dateLabel}</td>
                      </tr>
                      <tr>
                        <td style="padding:5px 0;font-size:13px;color:#666;">Orario</td>
                        <td style="padding:5px 0;font-size:13px;font-weight:600;color:#2d2d2d;">${booking_time}</td>
                      </tr>
                      <tr>
                        <td style="padding:5px 0;font-size:13px;color:#666;">Durata</td>
                        <td style="padding:5px 0;font-size:13px;font-weight:600;color:#2d2d2d;">1 ora</td>
                      </tr>
                      <tr>
                        <td style="padding:5px 0;font-size:13px;color:#666;">Indirizzo</td>
                        <td style="padding:5px 0;font-size:13px;font-weight:600;color:#2d2d2d;">${STUDIO_ADDRESS}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:#555;">
                Riceverai una <strong>mail di conferma separata</strong> da parte di ${THERAPIST_NAME}
                non appena avrà verificato la disponibilità per il giorno scelto.
              </p>
              <p style="margin:0;font-size:14px;line-height:1.6;color:#555;">
                Se nel frattempo hai bisogno di modificare o annullare la richiesta,
                rispondi direttamente a questa mail.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:16px 32px 24px;border-top:1px solid #e8f3e6;">
              <p style="margin:0;font-size:12px;color:#aaa;line-height:1.5;">
                Hai ricevuto questa mail perché hai inviato una richiesta di appuntamento tramite il sito.<br/>
                Questa è una notifica automatica — <em>non conferma</em> la prenotazione.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;

  return { subject, html };
}
