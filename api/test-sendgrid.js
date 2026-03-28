/**
 * test-sendgrid.js  (ora usa Nodemailer/Gmail)
 *
 * Endpoint diagnostico per verificare che l'invio email funzioni.
 * Da rimuovere dopo aver risolto il problema.
 *
 * Uso:  GET /api/test-sendgrid?to=tuaemail@gmail.com
 */
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });

  const to = req.query.to;
  if (!to) return res.status(400).json({ error: 'Parametro ?to=email mancante' });

  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;

  const diagnostics = {
    gmailUserExists: !!gmailUser,
    gmailUser: gmailUser || '(non configurato)',
    gmailPassExists: !!gmailPass,
    gmailPassLength: gmailPass?.length || 0,
  };

  if (!gmailUser || !gmailPass) {
    return res.status(500).json({ error: 'GMAIL_USER o GMAIL_APP_PASSWORD non configurate', diagnostics });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: gmailUser, pass: gmailPass },
    });

    await transporter.sendMail({
      from: `"Test" <${gmailUser}>`,
      to,
      subject: '[TEST] Verifica invio email',
      html: '<p>Questa è una mail di test per verificare che Nodemailer + Gmail funzionino.</p>',
    });

    return res.status(200).json({
      success: true,
      message: `Mail di test inviata a ${to}`,
      diagnostics,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message, diagnostics });
  }
}
