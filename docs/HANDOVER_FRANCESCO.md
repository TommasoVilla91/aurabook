# Guida al passaggio di consegne – AuraBook

Questo documento raccoglie **tutto ciò che va aggiornato** prima di consegnare la webapp a Francesco
e metterla definitivamente in produzione.
Segui le sezioni nell'ordine indicato.

---

## Indice

1. [Sicurezza – regole fondamentali](#1-sicurezza--regole-fondamentali)
2. [Dati hardcoded nel codice](#2-dati-hardcoded-nel-codice)
3. [Variabili d'ambiente su Vercel](#3-variabili-dambiente-su-vercel)
4. [Google Calendar & Service Account](#4-google-calendar--service-account)
5. [Gmail App Password – email al cliente (Nodemailer)](#5-gmail-app-password--email-al-cliente-nodemailer)
6. [EmailJS – notifica admin](#6-emailjs--notifica-admin)
7. [Firebase – autenticazione admin](#7-firebase--autenticazione-admin)
8. [Privacy Policy & Termini del Servizio](#8-privacy-policy--termini-del-servizio)
9. [Checklist finale](#9-checklist-finale)

---

## 1. Sicurezza – regole fondamentali

> Queste regole evitano che credenziali finiscano nel repository e vengano segnalate
> da servizi come GitGuardian.

### MAI committare segreti

- Il file `.env` **non deve MAI essere committato** su Git. È già presente in `.gitignore`,
  ma verificalo sempre prima di un push.
- Se per errore un segreto finisce in un commit, **non basta rimuoverlo nel commit successivo**:
  resta visibile nello storico git. In quel caso bisogna ruotare (rigenerare) la credenziale.
- Usa il file `.env.example` (presente nella root del progetto) come riferimento:
  contiene solo i **nomi** delle variabili con valori placeholder, mai i valori reali.

### Dove vanno i segreti

| Ambiente | Dove inserire le credenziali |
|---|---|
| **Produzione (Vercel)** | Vercel → Project → Settings → Environment Variables |
| **Sviluppo locale** | File `.env` nella root del progetto (gitignored) |

### Verifica prima di ogni push

```bash
git diff --cached --name-only   # mostra i file che stai per committare
```

Se vedi `.env`, `*.json` con credenziali, o file con chiavi API → **non procedere**, rimuovili dallo staging con `git reset HEAD <file>`.

### Rotazione periodica

Ogni **3–6 mesi** è buona pratica ruotare:
- Gmail App Password
- Chiave JSON del Service Account Google
- Public Key di EmailJS

---

## 2. Dati hardcoded nel codice

Questi valori sono scritti direttamente nei file sorgente e vanno modificati **una volta sola**
prima del deploy definitivo.

### `api/emailTemplates/customerConfirmation.js`

File che gestisce il template della mail automatica al cliente.

| Costante | Valore attuale | Cosa inserire |
|---|---|---|
| `STUDIO_NAME` | `'Francesco · Massoterapista'` | Nome da mostrare nell'header della mail |
| `THERAPIST_NAME` | `'Francesco'` | Nome usato nel testo ("Francesco la verificherà...") |
| `STUDIO_ADDRESS` | `'Via fratelli Bronzetti, 9 – Milano'` | Indirizzo fisico dello studio |

### `api/create-booking-event.js` – riga `from:`

```js
from: `"Francesco · Massoterapista" <${gmailUser}>`,
```

Il valore di `gmailUser` viene dalla variabile d'ambiente `GMAIL_USER`.
Assicurarsi che corrisponda all'email di Francesco.

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
<title>Vite + React</title>   <!-- cambiare con il nome del sito -->
```

Sostituire con es. `Francesco Massoterapista – Prenota online`.

---

## 3. Variabili d'ambiente su Vercel

Accedere a [vercel.com](https://vercel.com) → progetto → **Settings → Environment Variables**.

Tutte le variabili seguenti devono essere presenti e corrette per l'ambiente **Production**.

### Variabili frontend (prefisso `VITE_`)
> Queste vengono incorporate nel bundle JS al momento del build.
> Una modifica richiede un **nuovo deploy** (Vercel → Deployments → Redeploy).

| Variabile | Dove trovare il valore |
|---|---|
| `VITE_FIREBASE_API_KEY` | Firebase Console → Impostazioni progetto → Le tue app → Config web |
| `VITE_FIREBASE_AUTH_DOMAIN` | idem |
| `VITE_FIREBASE_PROJECT_ID` | idem |
| `VITE_FIREBASE_STORAGE_BUCKET` | idem |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | idem |
| `VITE_FIREBASE_APP_ID` | idem |
| `VITE_EMAILJS_SERVICE_ID` | EmailJS Dashboard → Email Services → ID servizio |
| `VITE_EMAILJS_TEMPLATE_ID` | EmailJS Dashboard → Email Templates → ID template |
| `VITE_EMAILJS_PUBLIC_KEY` | EmailJS Dashboard → Account → API Keys → Public Key |

### Variabili backend (usate dalle API Vercel a runtime)

| Variabile | Dove trovare il valore |
|---|---|
| `GOOGLE_SERVICE_ACCOUNT_CREDENTIALS` | Contenuto JSON del file chiave scaricato da Google Cloud (vedi sezione 4) |
| `GOOGLE_CALENDAR_ID` | ID calendario di Francesco (vedi sezione 4) |
| `GMAIL_USER` | Email Gmail di Francesco (es. `sartifrancescomario@gmail.com`) |
| `GMAIL_APP_PASSWORD` | App Password Gmail di Francesco (vedi sezione 5) |
| `CRON_SECRET` | Stringa casuale lunga usata per proteggere il cron job di pulizia prenotazioni |

> **Nota `GOOGLE_SERVICE_ACCOUNT_CREDENTIALS`**: incollare l'intero contenuto del file `.json`
> scaricato da Google Cloud **su una sola riga** (Vercel gestisce automaticamente i caratteri speciali).
> **Non committare mai** questo file nel repository.

> **Nota `CRON_SECRET`**: generare una stringa casuale sicura, ad esempio con:
> `openssl rand -hex 32` (terminale) oppure [generate-secret.vercel.app](https://generate-secret.vercel.app/64).

---

## 4. Google Calendar & Service Account

Il Service Account è un "utente robot" creato su Google Cloud che permette all'app
di leggere e scrivere eventi sul calendario di Francesco senza che Francesco debba
mai autenticarsi manualmente.

### 4.1 Creare un nuovo Service Account

1. Vai su [console.cloud.google.com](https://console.cloud.google.com)
2. Seleziona il progetto (o creane uno nuovo)
3. **API e servizi → Libreria** → cerca **Google Calendar API** → clicca **Abilita**
4. **IAM e amministrazione → Account di servizio** → **Crea account di servizio**
   - Nome: `calendar-aurabook` (o un nome che preferisci)
   - Ruolo: nessuno richiesto (non serve un ruolo a livello progetto)
   - Clicca **Fine**
5. Nella lista degli account di servizio, clicca su quello appena creato
6. Tab **Chiavi** → **Aggiungi chiave → Crea nuova chiave → JSON** → **Crea**
7. Il browser scarica un file `.json` — **questo file contiene la chiave privata, custodiscilo con cura**

### 4.2 Configurare le variabili d'ambiente

Dal file `.json` scaricato:

| Variabile d'ambiente | Dove trovare il valore nel JSON |
|---|---|
| `GOOGLE_SERVICE_ACCOUNT_CREDENTIALS` | **Intero contenuto** del file JSON (copia-incolla tutto su Vercel, su una riga) |

> Per lo sviluppo locale nel file `.env` puoi usare in alternativa due variabili separate:
> ```
> GOOGLE_SERVICE_ACCOUNT_EMAIL=nome-account@progetto.iam.gserviceaccount.com
> GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
> ```
> La chiave privata va racchiusa tra virgolette e i ritorni a capo scritti come `\n`.

### 4.3 Francesco condivide il suo calendario

Francesco deve dare accesso al Service Account:

1. Apre **Google Calendar** → [calendar.google.com](https://calendar.google.com)
2. Nel pannello sinistro, tre puntini sul suo calendario → **"Impostazioni e condivisione"**
3. Scorre fino a **"Condividi con persone o gruppi specifici"** → **"+ Aggiungi persone e gruppi"**
4. Inserisce l'email del Service Account (la trovi nel campo `client_email` del file JSON,
   formato: `nome@progetto.iam.gserviceaccount.com`)
5. Permesso: **"Apportare modifiche agli eventi"**
6. Clicca **Invia**

### 4.4 Trovare il Calendar ID

Nella stessa pagina "Impostazioni e condivisione", sezione **"Integra calendario"**,
c'è il campo **ID calendario**.

- Di solito corrisponde all'indirizzo Gmail di Francesco (es. `sartifrancescomario@gmail.com`)
- Oppure una stringa tipo `abc123@group.calendar.google.com`

**Aggiorna su Vercel**: variabile `GOOGLE_CALENDAR_ID` con questo valore.

### 4.5 Eliminare il file JSON scaricato

Dopo aver copiato il contenuto del file JSON nelle variabili d'ambiente (Vercel + `.env` locale):

- **Elimina il file JSON dal computer** (o spostalo in un luogo sicuro offline)
- **Non metterlo MAI nella cartella del progetto** — potrebbe essere committato per errore

---

## 5. Gmail App Password – email al cliente (Nodemailer)

L'app usa **Nodemailer con Gmail SMTP** per inviare la mail di conferma al cliente
dopo la prenotazione. Per funzionare, Gmail richiede una "App Password" dedicata
(non la password normale dell'account).

### 5.1 Prerequisito: Verifica in 2 passaggi

1. Francesco va su [myaccount.google.com](https://myaccount.google.com) con il suo account Gmail
2. **Sicurezza → Verifica in 2 passaggi** → attiva se non è già attiva
   (è obbligatoria per creare App Password)

### 5.2 Creare la App Password

1. Vai su [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
2. Nome app: `AuraBook`
3. Clicca **Crea**
4. Google mostra una password di **16 caratteri** (es. `abcd efgh ijkl mnop`)
5. Copia la stringa **senza spazi** → `abcdefghijklmnop`

### 5.3 Aggiornare le variabili

| Variabile | Valore |
|---|---|
| `GMAIL_USER` | Email Gmail di Francesco (es. `sartifrancescomario@gmail.com`) |
| `GMAIL_APP_PASSWORD` | La stringa da 16 caratteri generata al punto 5.2 |

Aggiornare sia su **Vercel** che nel `.env` locale.

### 5.4 Se le email smettono di funzionare

- L'App Password può scadere se Francesco disattiva e riattiva la Verifica in 2 passaggi
- In quel caso: ripetere i passi 5.2–5.3 per generarne una nuova

---

## 6. EmailJS – notifica admin

EmailJS invia una notifica email a Francesco **dal browser del cliente** ogni volta che
qualcuno compila il modulo di prenotazione. Funziona indipendentemente dal backend.

### 6.1 Creare l'account EmailJS

1. Francesco va su [emailjs.com](https://www.emailjs.com) e crea un account gratuito
   (piano Free: 200 email/mese, sufficiente per un piccolo studio)

### 6.2 Collegare Gmail

1. Dashboard → **Email Services** → **Add New Service** → seleziona **Gmail**
2. Si autentica con il suo account Gmail
3. Assegna un nome al servizio (es. "Gmail Francesco") → **Create Service**
4. Copia il **Service ID** (es. `service_abc123`)

### 6.3 Creare il template

1. Dashboard → **Email Templates** → **Create New Template**
2. Configurare:
   - **To email**: `sartifrancescomario@gmail.com` (o l'email dove vuole ricevere le notifiche)
   - **From name**: `AuraBook`
   - **Subject**: `Nuova prenotazione — {{name}} {{surname}}`
   - **Body**: usare le seguenti variabili (con la sintassi `{{variabile}}`):

| Variabile | Contenuto |
|---|---|
| `{{name}}` | Nome del cliente |
| `{{surname}}` | Cognome |
| `{{phone}}` | Telefono |
| `{{email}}` | Email |
| `{{birthdate}}` | Data di nascita |
| `{{booking_date}}` | Data prenotazione (es. "15 aprile 2026") |
| `{{booking_time}}` | Orario (es. "11:00") |
| `{{message}}` | Motivo della visita |

3. Clicca **Save** → copia il **Template ID** (es. `template_xyz789`)

### 6.4 Trovare la Public Key

1. In alto a destra → icona profilo → **Account**
2. Tab **API Keys** → copia la **Public Key**

### 6.5 Aggiornare le variabili

| Variabile Vercel | Valore |
|---|---|
| `VITE_EMAILJS_SERVICE_ID` | Service ID dal passo 6.2 |
| `VITE_EMAILJS_TEMPLATE_ID` | Template ID dal passo 6.3 |
| `VITE_EMAILJS_PUBLIC_KEY` | Public Key dal passo 6.4 |

> Queste sono variabili `VITE_*` (frontend): dopo averle aggiornate su Vercel
> serve un **redeploy** perché vengono incorporate nel bundle JS a build time.

### 6.6 Se le notifiche smettono di arrivare

Il token OAuth2 di Gmail scade periodicamente:
**Email Services → seleziona il servizio Gmail → Reconnect Account**.

---

## 7. Firebase – autenticazione admin

Firebase gestisce il login della sezione amministratore (`/admin-dashboard`).

### 7.1 Creare l'utente admin

1. Accedere a [console.firebase.google.com](https://console.firebase.google.com)
2. Selezionare il progetto
3. **Authentication → Users → Add user**
4. Inserire l'email e la password di Francesco

### 7.2 Accesso admin

Francesco accederà con le credenziali create al punto 7.1 tramite la pagina `/login`
del sito. Da lì verrà reindirizzato a `/admin-dashboard`.

### 7.3 Metodo di accesso Google

Se Francesco vuole accedere con il suo account Google, assicurarsi che
**Authentication → Sign-in method → Google** sia abilitato e che il dominio del sito
sia nella lista dei domini autorizzati (**Authorized domains**).

---

## 8. Privacy Policy & Termini del Servizio

Il testo legale si trova in `src/components/PrivacyModal.jsx`.
Tutti i placeholder `[MAIUSCOLO]` devono essere compilati prima del go-live.

Consultare il file **`SETUP_TERMINI.md`** per la lista completa con spiegazioni dettagliate.

---

## 9. Checklist finale

Prima di condividere il link con i clienti, verificare punto per punto:

### Codice
- [ ] `STUDIO_NAME`, `THERAPIST_NAME`, `STUDIO_ADDRESS` aggiornati in `customerConfirmation.js`
- [ ] `GMAIL_USER` su Vercel impostato con l'email di Francesco
- [ ] Testi Homepage aggiornati (`HomePage.jsx`)
- [ ] Indirizzo in EventModal verificato (`EventModal.jsx`)
- [ ] Titolo pagina aggiornato (`index.html`)
- [ ] Tutti i placeholder `[MAIUSCOLO]` in `PrivacyModal.jsx` compilati

### Servizi esterni
- [ ] Gmail: Verifica in 2 passaggi attiva, App Password creata e funzionante
- [ ] EmailJS: Gmail connesso, template verificato con tutte le variabili
- [ ] Google Calendar: nuovo Service Account creato, calendario condiviso con permessi di modifica
- [ ] Variabili d'ambiente Vercel **tutte** impostate e corrette
- [ ] Utente admin creato su Firebase Authentication
- [ ] Cron job visibile su Vercel (Settings → Cron Jobs)

### Sicurezza
- [ ] File `.env` presente in `.gitignore`
- [ ] Nessun segreto nel repository (verificare con `git log -p -- .env`)
- [ ] File JSON del Service Account eliminato dal computer (o conservato offline)
- [ ] Nessuna API key hardcoded nel codice sorgente

### Test prima del go-live
- [ ] Fare una prenotazione di prova sul sito
- [ ] Verificare che arrivi la mail di conferma al cliente (Nodemailer/Gmail)
- [ ] Verificare che arrivi la notifica admin via EmailJS a Francesco
- [ ] Verificare che l'evento appaia nel Google Calendar di Francesco
- [ ] Testare il login admin su `/login`
- [ ] Controllare che la modale Privacy & Termini si apra e il testo sia corretto

---

*Documento aggiornato — riflette l'architettura attuale: Nodemailer/Gmail SMTP per le email
al cliente, EmailJS per le notifiche admin, Google Service Account per Calendar.*
