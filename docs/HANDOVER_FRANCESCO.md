# Guida al passaggio di consegne – AuraBook

Questo documento raccoglie **tutto ciò che va aggiornato** prima di consegnare la webapp a Francesco
e metterla definitivamente in produzione.
Segui le sezioni nell'ordine indicato.

---

## Indice

1. [Dati hardcoded nel codice](#1-dati-hardcoded-nel-codice)
2. [Variabili d'ambiente su Vercel](#2-variabili-dambiente-su-vercel)
3. [SendGrid – email al cliente](#3-sendgrid--email-al-cliente)
4. [EmailJS – notifica admin](#4-emailjs--notifica-admin)
5. [Google Calendar & Service Account](#5-google-calendar--service-account)
6. [Firebase – autenticazione admin](#6-firebase--autenticazione-admin)
7. [Privacy Policy & Termini del Servizio](#7-privacy-policy--termini-del-servizio)
8. [Checklist finale](#8-checklist-finale)

---

## 1. Dati hardcoded nel codice

Questi valori sono scritti direttamente nei file sorgente e vanno modificati **una volta sola**
prima del deploy definitivo.

### `api/emailTemplates/customerConfirmation.js`

File che gestisce il template della mail automatica al cliente.

| Costante | Valore attuale | Cosa inserire |
|---|---|---|
| `STUDIO_NAME` | `'Francesco · Massoterapista'` | Nome da mostrare nell'header della mail |
| `THERAPIST_NAME` | `'Francesco'` | Nome usato nel testo ("Francesco la verificherà…") |
| `STUDIO_ADDRESS` | `'Via fratelli Bronzetti, 9 – Milano'` | Indirizzo fisico dello studio |

### `api/create-booking-event.js` – riga `from:`

```js
from: 'tommasovilla91@gmail.com',   // ← sostituire con l'email di Francesco
```

Questa è l'email **mittente** della mail al cliente.
Deve essere **verificata in SendGrid** (vedi sezione 3).

### `src/pages/HomePage.jsx`

```jsx
<h1>Francesco Massoterapista</h1>
<h3>La tua visita, le tue condizioni</h3>
<p>Scegli il momento perfetto per la tua salute...</p>
```

Aggiorna nome, slogan e testo descrittivo se Francesco vuole testi personalizzati.

### `src/components/EventModal.jsx` – indirizzo in modale

```jsx
<p>Via fratelli Bronzetti, 9</p>
<p>Milano, MI</p>
```

Verificare che l'indirizzo sia corretto o aggiornarlo.

### `src/pages/FormPage.jsx` – nota sotto il form

```jsx
<p>N.B. sarai prontamente ricontatta/o da Francesco per confermarti l'avvennuta prenotazione</p>
```

Personalizzare il testo se necessario (es. tempi di risposta).

### `index.html` – titolo della pagina

```html
<title>Vite + React</title>   <!-- ← cambiare con il nome del sito -->
```

Sostituire con es. `Francesco Massoterapista – Prenota online`.

---

## 2. Variabili d'ambiente su Vercel

Accedere a [vercel.com](https://vercel.com) → progetto **aurabook** → **Settings → Environment Variables**.

Tutte le variabili seguenti devono essere presenti e corrette per l'ambiente **Production**.

### Variabili frontend (prefisso `VITE_`)
> Queste vengono incorporate nel bundle al momento del build — una modifica richiede un nuovo deploy.

| Variabile | Dove trovare il valore |
|---|---|
| `VITE_FIREBASE_API_KEY` | Firebase Console → Impostazioni progetto → Le tue app → Config web |
| `VITE_FIREBASE_AUTH_DOMAIN` | idem |
| `VITE_FIREBASE_PROJECT_ID` | idem |
| `VITE_FIREBASE_STORAGE_BUCKET` | idem |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | idem |
| `VITE_FIREBASE_APP_ID` | idem |
| `VITE_GOOGLE_CALENDAR_CLIENT_ID` | Google Cloud Console → API & Services → Credentials → API Key |
| `VITE_CALENDAR_ID` | Google Calendar → Impostazioni calendario → ID calendario (formato `xxx@group.calendar.google.com`) |
| `VITE_EMAILJS_SERVICE_ID` | EmailJS Dashboard → Email Services → ID servizio |
| `VITE_EMAILJS_TEMPLATE_ID` | EmailJS Dashboard → Email Templates → ID template |
| `VITE_EMAILJS_PUBLIC_KEY` | EmailJS Dashboard → Account → API Keys → Public Key |

### Variabili backend (usate dalle API Vercel a runtime)

| Variabile | Dove trovare il valore |
|---|---|
| `GOOGLE_SERVICE_ACCOUNT_CREDENTIALS` | Contenuto JSON completo del file scaricato da Google Cloud → IAM → Service Accounts → Chiavi |
| `GOOGLE_CALENDAR_ID` | Stesso valore di `VITE_CALENDAR_ID` sopra |
| `SENDGRID_API_KEY` | SendGrid → Settings → API Keys |

> **Nota `GOOGLE_SERVICE_ACCOUNT_CREDENTIALS`**: incollare l'intero contenuto del file `.json`
> scaricato da Google Cloud **su una sola riga** (Vercel gestisce automaticamente i caratteri speciali).

---

## 3. SendGrid – email al cliente

### 3.1 Verificare il mittente (obbligatorio)

La mail al cliente viene inviata dall'indirizzo specificato nel campo `from:` di
`api/create-booking-event.js`. SendGrid **non consente l'invio** da indirizzi non verificati.

Passaggi:
1. Accedere a [app.sendgrid.com](https://app.sendgrid.com)
2. **Settings → Sender Authentication → Single Sender Verification**
3. Cliccare **Create New Sender** e inserire l'email professionale di Francesco
4. Completare la verifica cliccando il link nella mail ricevuta
5. Aggiornare il campo `from:` in `api/create-booking-event.js` con la stessa email

### 3.2 Personalizzare il template mail

Il template si trova in `api/emailTemplates/customerConfirmation.js`.
Le costanti da aggiornare sono nella sezione 1 di questa guida.

### 3.3 Riconnettere l'account (se scaduto)

Se SendGrid smette di inviare mail, verificare che l'API Key sia ancora valida:
**Settings → API Keys** — se scaduta, crearne una nuova e aggiornare la variabile
`SENDGRID_API_KEY` su Vercel.

---

## 4. EmailJS – notifica admin

EmailJS invia la notifica a Francesco ogni volta che un cliente invia una richiesta.

### 4.1 Credenziali

Verificare che le tre variabili d'ambiente siano corrette (vedi sezione 2):
`VITE_EMAILJS_SERVICE_ID`, `VITE_EMAILJS_TEMPLATE_ID`, `VITE_EMAILJS_PUBLIC_KEY`.

### 4.2 Template EmailJS

Il template deve contenere le seguenti variabili (con la sintassi `{{variabile}}`):

| Variabile | Contenuto |
|---|---|
| `{{name}}` | Nome del cliente |
| `{{surname}}` | Cognome |
| `{{phone}}` | Telefono |
| `{{email}}` | Email |
| `{{birthdate}}` | Data di nascita |
| `{{booking_date}}` | Data prenotazione |
| `{{booking_time}}` | Orario |
| `{{message}}` | Motivo della visita |

Accedere a [emailjs.com](https://www.emailjs.com) → **Email Templates** → selezionare il template
e verificare che tutte le variabili siano presenti.

### 4.3 Riconnettere Gmail (se scade)

Il token OAuth2 di Gmail scade periodicamente:
**Email Services → seleziona il servizio Gmail → Reconnect Account**.

---

## 5. Google Calendar & Service Account

### 5.1 Service Account

Il Service Account permette all'API Vercel di creare eventi nel calendario di Francesco.

- Il file JSON delle credenziali deve essere caricato nella variabile `GOOGLE_SERVICE_ACCOUNT_CREDENTIALS` su Vercel.
- L'email del Service Account (formato `xxx@xxx.iam.gserviceaccount.com`) deve avere i permessi
  **"Apporta modifiche agli eventi"** sul calendario di Francesco:
  Google Calendar → Impostazioni → **Condividi con persone specifiche** → aggiungere l'email del Service Account.

### 5.2 Calendario

Assicurarsi che `GOOGLE_CALENDAR_ID` e `VITE_CALENDAR_ID` puntino allo stesso calendario
su cui Francesco vuole ricevere le prenotazioni.

### 5.3 API Key frontend

`VITE_GOOGLE_CALENDAR_CLIENT_ID` è l'API Key usata dal frontend per leggere gli eventi
(mostrare i giorni occupati). Verificare che sia abilitata per l'API **Google Calendar** in
Google Cloud Console → **APIs & Services → Credentials**.

---

## 6. Firebase – autenticazione admin

Firebase gestisce il login della sezione amministratore (`/admin-dashboard`).

### 6.1 Creare l'utente admin

1. Accedere a [console.firebase.google.com](https://console.firebase.google.com)
2. Selezionare il progetto
3. **Authentication → Users → Add user**
4. Inserire l'email e la password di Francesco

### 6.2 Accesso admin

Francesco accederà con le credenziali create al punto 6.1 tramite la pagina `/login`
del sito. Da lì verrà reindirizzato a `/admin-dashboard`.

### 6.3 Metodo di accesso Google

Se Francesco vuole accedere con il suo account Google, assicurarsi che
**Authentication → Sign-in method → Google** sia abilitato e che il dominio del sito
sia nella lista dei domini autorizzati (**Authorized domains**).

---

## 7. Privacy Policy & Termini del Servizio

Il testo legale si trova in `src/components/PrivacyModal.jsx`.
Tutti i placeholder `[MAIUSCOLO]` devono essere compilati prima del go-live.

Consultare il file **`SETUP_TERMINI.md`** per la lista completa con spiegazioni dettagliate.

---

## 8. Checklist finale

Prima di condividere il link con i clienti, verificare punto per punto:

### Codice
- [ ] `STUDIO_NAME`, `THERAPIST_NAME`, `STUDIO_ADDRESS` aggiornati in `customerConfirmation.js`
- [ ] `from:` in `create-booking-event.js` aggiornato con email professionale
- [ ] Testi Homepage aggiornati (`HomePage.jsx`)
- [ ] Indirizzo in EventModal verificato (`EventModal.jsx`)
- [ ] Titolo pagina aggiornato (`index.html`)
- [ ] Tutti i placeholder `[MAIUSCOLO]` in `PrivacyModal.jsx` compilati

### Servizi esterni
- [ ] Mittente SendGrid verificato (Single Sender Verification completata)
- [ ] EmailJS: Gmail riconnesso, template verificato
- [ ] Google Calendar: Service Account ha i permessi sul calendario di Francesco
- [ ] Variabili d'ambiente Vercel tutte impostate e corrette
- [ ] Utente admin creato su Firebase Authentication

### Test prima del go-live
- [ ] Fare una prenotazione di prova su [aurabook-five.vercel.app](https://aurabook-five.vercel.app)
- [ ] Verificare che arrivi la mail al cliente (con i dati corretti)
- [ ] Verificare che arrivi la notifica admin via EmailJS
- [ ] Verificare che l'evento appaia nel Google Calendar di Francesco
- [ ] Testare il login admin su `/login`
- [ ] Controllare che la modale Privacy & Termini si apra e il testo sia corretto

---

*Documento generato automaticamente — aggiornare in caso di modifiche all'architettura.*
