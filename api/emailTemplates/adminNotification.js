/**
 * adminNotification.js
 *
 * Template della mail di notifica che Francesco riceve ogni volta che
 * un cliente invia una nuova richiesta di appuntamento.
 */

/**
 * Genera subject e HTML per la notifica al admin.
 *
 * @param {object} params
 * @param {string} params.name
 * @param {string} params.surname
 * @param {string} params.phone
 * @param {string} params.email
 * @param {string} params.birthdate
 * @param {string} params.dateLabel    - Data formattata in italiano (es. "martedì 15 aprile 2026")
 * @param {string} params.booking_time - Orario slot (es. "10:00")
 * @param {string} params.message      - Messaggio/motivo visita
 * @returns {{ subject: string, html: string }}
 */
export function adminNotificationEmail({ name, surname, phone, email, birthdate, dateLabel, booking_time, message }) {
  const subject = `Nuova richiesta di appuntamento — ${name} ${surname}`;

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

          <!-- Header -->
          <tr>
            <td style="background-color:#3d5c3a;padding:28px 32px;">
              <p style="margin:0;font-size:13px;color:rgba(247,255,237,0.7);text-transform:uppercase;letter-spacing:0.08em;">Notifica prenotazione</p>
              <h1 style="margin:8px 0 0;font-size:20px;font-weight:600;color:#f7ffed;">Nuova richiesta ricevuta</h1>
            </td>
          </tr>

          <!-- Corpo -->
          <tr>
            <td style="padding:28px 32px;">
              <p style="margin:0 0 20px;font-size:15px;line-height:1.6;">
                Hai ricevuto una nuova richiesta di appuntamento. Ecco i dettagli:
              </p>

              <!-- Dati cliente -->
              <table width="100%" cellpadding="0" cellspacing="0"
                style="background-color:#f4fbf2;border-radius:8px;border:1px solid #d8eed5;margin:0 0 20px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 12px;font-size:11px;font-weight:700;color:#3d5c3a;
                               text-transform:uppercase;letter-spacing:0.08em;">Dati cliente</p>
                    <table cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="padding:5px 0;font-size:13px;color:#666;width:110px;">Nome</td>
                        <td style="padding:5px 0;font-size:13px;font-weight:600;color:#2d2d2d;">${name} ${surname}</td>
                      </tr>
                      <tr>
                        <td style="padding:5px 0;font-size:13px;color:#666;">Telefono</td>
                        <td style="padding:5px 0;font-size:13px;font-weight:600;color:#2d2d2d;">${phone}</td>
                      </tr>
                      <tr>
                        <td style="padding:5px 0;font-size:13px;color:#666;">Email</td>
                        <td style="padding:5px 0;font-size:13px;font-weight:600;color:#2d2d2d;">${email}</td>
                      </tr>
                      <tr>
                        <td style="padding:5px 0;font-size:13px;color:#666;">Data di nascita</td>
                        <td style="padding:5px 0;font-size:13px;font-weight:600;color:#2d2d2d;">${birthdate || '—'}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Dettagli appuntamento -->
              <table width="100%" cellpadding="0" cellspacing="0"
                style="background-color:#f4fbf2;border-radius:8px;border:1px solid #d8eed5;margin:0 0 20px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 12px;font-size:11px;font-weight:700;color:#3d5c3a;
                               text-transform:uppercase;letter-spacing:0.08em;">Appuntamento richiesto</p>
                    <table cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="padding:5px 0;font-size:13px;color:#666;width:110px;">Data</td>
                        <td style="padding:5px 0;font-size:13px;font-weight:600;color:#2d2d2d;text-transform:capitalize;">${dateLabel}</td>
                      </tr>
                      <tr>
                        <td style="padding:5px 0;font-size:13px;color:#666;">Orario</td>
                        <td style="padding:5px 0;font-size:13px;font-weight:600;color:#2d2d2d;">${booking_time}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              ${message ? `
              <!-- Messaggio -->
              <table width="100%" cellpadding="0" cellspacing="0"
                style="background-color:#f4fbf2;border-radius:8px;border:1px solid #d8eed5;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 8px;font-size:11px;font-weight:700;color:#3d5c3a;
                               text-transform:uppercase;letter-spacing:0.08em;">Motivo / Messaggio</p>
                    <p style="margin:0;font-size:13px;line-height:1.6;color:#2d2d2d;">${message}</p>
                  </td>
                </tr>
              </table>
              ` : ''}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:16px 32px 24px;border-top:1px solid #e8f3e6;">
              <p style="margin:0;font-size:12px;color:#aaa;line-height:1.5;">
                Notifica automatica — ricevuta tramite il modulo di prenotazione del sito.
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
