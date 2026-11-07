# AURABOOKING
### _Sistema di prenotazioni online con sincronizzazione in tempo reale su Google Calendar_

Applicazione web per la gestione degli appuntamenti, pensata per professionisti come massoterapisti, fisioterapisti e personal trainer. Offre un'esperienza di prenotazione fluida lato cliente e una gestione automatizzata della disponibilità lato professionista, con sincronizzazione istantanea su Google Calendar.

---

## Tecnologie

| Layer | Tecnologia |
|---|---|
| Frontend | React 19 + Vite 7 (SPA, CSS Modules) |
| Backend | Vercel Serverless Functions (Node.js) |
| Calendario UI | FullCalendar |
| Autenticazione admin | Firebase Authentication |
| Calendario dati | Google Calendar API (service account JWT) |
| Notifica admin | EmailJS (client-side) |
| Email conferma cliente | Nodemailer + Gmail SMTP (server-side) |
| Telefono | react-phone-number-input |
| Icone | FontAwesome |

---

## Flow di prenotazione

### 1. Selezione della disponibilità
L'utente apre il calendario (FullCalendar su desktop, picker a tendine su mobile).  
Selezionando un giorno viene invocata una Vercel Serverless Function che:
- legge gli eventi esistenti su Google Calendar tramite service account
- calcola gli slot di disponibilità per quel giorno
- filtra gli slot già occupati

Gli slot disponibili vengono mostrati in un modale.

### 2. Compilazione del form
L'utente sceglie uno slot orario e viene reindirizzato al form di prenotazione dove inserisce:
- dati anagrafici (nome, cognome, data di nascita, telefono, email)
- motivo della visita
- accettazione dei Termini del Servizio e della Privacy Policy

### 3. Invio e sincronizzazione
Al submit del form vengono eseguiti due step in sequenza:

**Step 1 — Notifica admin (EmailJS, client-side)**
Viene inviata un'email al professionista con tutti i dettagli della richiesta.

**Step 2 — Creazione evento + email cliente (Vercel API)**
La serverless function `api/create-booking-event.js`:
- crea un evento su Google Calendar nello stato _tentative_ (`DA CONFERMARE`)
- invia un'email di riepilogo al cliente tramite Nodemailer (Gmail SMTP)

### 4. Modale di successo
Dopo l'invio viene mostrato un modale con il riepilogo della prenotazione e le istruzioni sui passi successivi (il professionista contatterà il cliente per confermare).

---

## Logica di conferma

Le prenotazioni create dall'app sono in stato **tentativo** — non sono ancora confermate. Il professionista riceve la notifica via email, verifica la disponibilità sul suo calendario Google e contatta il cliente separatamente per la conferma definitiva.

---

## Area admin

Accessibile via Firebase Authentication. Il professionista può effettuare il login per gestire le proprie disponibilità e visualizzare le prenotazioni pendenti.

---

## Deploy

L'applicazione è deployata su **Vercel** con deploy automatico dal branch `main` di GitHub.  
Il proxy Vite in sviluppo locale (`vite.config.js`) inoltra le chiamate `/api` verso il deployment Vercel di produzione.

---

## Da fare prima del lancio

- **Rimuovere il `noindex`**: il sito è escluso da Google di proposito. Va tolto in due punti: il tag `<meta name="robots" content="noindex, nofollow" />` in `index.html` e l'header `X-Robots-Tag` in `vercel.json`.
- **Variabili Vercel in Production**: `ADMIN_EMAILS` (o `ADMIN_EMAIL`) con la mail di login dell'admin, senza la quale l'area riservata risponde 403; `CRON_SECRET`, senza il quale il cron risponde 401; `VITE_SENTRY_DSN` per il monitoraggio errori.
- **Chiavi**: ruotare la chiave del service account Google e la password per le app Gmail, poi eliminare quelle vecchie.
- **Firebase**: disattivare la creazione di nuovi account da Authentication, e aggiungere ai domini autorizzati quelli da cui si accede.
- **Privacy**: completare i segnaposto rimasti nei documenti legali.
