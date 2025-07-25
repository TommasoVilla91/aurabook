# Fase 1: Preparazione e Configurazione di Google Cloud (Lato Massoterapista)
Dare al backend (la Supabase Edge Function) i permessi per leggere il calendario del massoterapista.

#### **Crea un Progetto su Google Cloud Platform (GCP):**

* console.cloud.google.com.

* Crea un nuovo progetto (es. "Massoterapista Calendar Sync").

#### **Abilita l'API di Google Calendar:**

* Nel progetto GCP, su **"API e servizi" > "Libreria"**.

* Abilitare **"Google Calendar API"**.

#### **Crea Credenziali di Servizio (Service Account):**

* Questa è la chiave con cui la tua Edge Function accederà al calendario.

* Vai su **"API e servizi" > "Credenziali"**.

* Clicca su **"Crea credenziali" > "Account di servizio"**.

* Dai un nome all'account di servizio (es. calendar-reader).

* **Assegna un ruolo che permetta di leggere i calendari** (es. Visualizzatore di Google Calendar o un ruolo personalizzato con permessi minimi di lettura).

* **Genera una nuova chiave JSON:** Questo file JSON conterrà le credenziali (private key) che la tua Edge Function userà per autenticarsi. **Scaricalo e trattalo come un segreto assoluto! Non caricarlo mai su Git.**

#### **Condividi il Calendario del Massoterapista con l'Account di Servizio:**

* Il massoterapista deve **condividere il suo calendario con l'indirizzo email dell'account di servizio** (lo trovi nel file JSON o nella sezione "Account di servizio" di GCP).

* **Deve dare almeno i permessi di lettura** ("Visualizza solo disponibilità (nascondi i dettagli)"). Questo è cruciale: **l'account di servizio deve poter vedere gli eventi per capire quando lo slot è occupato.**

# Fase 2: Implementazione della Supabase Edge Function (Il Backend)
Questa funzione sarà il tuo "ponte" tra il frontend e il Google Calendar.

#### **Configura le Variabili d'Ambiente su Supabase:**

* Le credenziali del Service Account JSON (scaricate al punto 3 della Fase 1) sono un segreto. Non metterle direttamente nel codice.

* Su Supabase, vai in **"Project Settings" > "Edge Functions" > "Secrets".**

* **Aggiungi un nuovo secret**, ad esempio GOOGLE_SERVICE_ACCOUNT_CREDENTIALS, e incolla l'intero contenuto del file JSON scaricato.

#### **Scrivi la Edge Function (TypeScript/JavaScript):**

* **Crea una nuova Edge Function Supabase** (es. get-available-slots).

**Dentro la funzione:**

1. **Importa le librerie necessarie**: Avrai bisogno di un client Google API per Node.js (es. googleapis).

2. **Carica le credenziali**: Recupera il secret GOOGLE_SERVICE_ACCOUNT_CREDENTIALS dalla variabile d'ambiente.

3. **Autenticazione**: Utilizza le credenziali dell'account di servizio per autenticarti con l'API di Google.

4. **Recupera gli eventi dal Google Calendar:**

- * Usa l'API di Google Calendar per fare una query sugli eventi.

- * Specifica l'ID del calendario del massoterapista (di solito è l'indirizzo email del calendario).

- * Definisci un intervallo di tempo (es. oggi + i prossimi 7 giorni).

- * Richiedi solo gli eventi che influenzano la disponibilità (es. singleEvents: true, timeMin, timeMax).

5. **Elabora gli eventi**: Riceverai una lista di eventi. Per ogni evento, estrai l'orario di inizio e fine.

6. **Logica di filtraggio:** Questa è la parte chiave. La tua Edge Function deve:

- * Generare tutti i potenziali slot orari disponibili per il giorno richiesto (es. ogni 30 minuti dalle 9:00 alle 18:00).

- * Confrontare questi slot con gli orari degli eventi occupati recuperati dal Google Calendar.

- * Rimuovere gli slot occupati (o contrassegnarli come non disponibili).

7. **Restituisci gli slot disponibili**: La funzione dovrebbe restituire al frontend un array di slot orari disponibili per la data richiesta.

#### Fase 3: Integrazione Frontend (La tua Web App React)
Questa parte si occupa di chiamare la Edge Function e aggiornare la UI.

1. **Chiamata alla Edge Function:**

- * Quando l'utente seleziona una data nel tuo FullCalendar, attiva una chiamata alla tua Supabase Edge Function (es. get-available-slots), passando la data selezionata come parametro.

- * Usa il client Supabase SDK per invocare la funzione: supabase.functions.invoke('get-available-slots', { body: { date: selectedDate } }).

2. **Gestione della Risposta:**

* * Una volta ricevuta la risposta dalla Edge Function (che conterrà gli slot disponibili), aggiorna lo stato del tuo componente React.

3. **Aggiornamento del Modale degli Slot Orari:**

* * Utilizza i dati degli slot disponibili per popolare dinamicamente le opzioni nel modale di prenotazione. Solo gli slot realmente disponibili (quelli non bloccati da Google Calendar) dovrebbero essere mostrati all'utente.

* * Ad esempio, potresti avere un array di oggetti { time: 'HH:MM', available: true/false } e solo visualizzare quelli con available: true.

4. **Gestione del Feedback Utente:**

* * Mostra un loader mentre la funzione sta recuperando i dati.

* * Gestisci eventuali errori (es. se la funzione non riesce a recuperare i dati dal calendario).

#### Fase 4: Miglioramenti e Considerazioni (Per il Futuro)
1. **Caching degli Eventi:**

* * Fare una chiamata a Google Calendar per ogni richiesta di slot potrebbe essere lento. Considera di caching gli eventi del calendario in un database Supabase. Aggiorna la cache periodicamente (es. ogni ora o ogni volta che un evento viene modificato tramite webhook di Google Calendar, se diventi più avanzato).

2. **Gestione Fusi Orari:**

* * I fusi orari possono essere un incubo! Assicurati che tutti gli orari (nel tuo calendario, nel database e nella tua app) siano gestiti in UTC e convertiti correttamente per l'utente finale.

3. **Permessi Minimi:**

* * Rivedi i permessi dell'account di servizio su Google Cloud. Assicurati che abbia solo il minimo indispensabile per leggere i calendari, non per modificarli.

4. **Gestione degli Errori:**

* * Implementa una robusta gestione degli errori sia nella Edge Function che nel frontend.

5. **Test:**

* * Testa a fondo la funzionalità con diversi scenari: slot occupati, slot disponibili, giorni senza appuntamenti, ecc.



# FullCalendar 

* Configurare il componente FullCalendar per puntare all'ID del calendario Google del massoterapista. 

## Flow di Prenotazione:

* Click sul giorno: dateClick (FullCalendar) per il giorno.

* Apertura Modale: al click si apre un modale che carichi gli slot orari per quel giorno.

* Selezione Orario nel Modale: l'utente sceglie un orario disponibile.

* Reindirizzamento al Form: Passi i dati della data e dell'orario alla pagina del form (URL parameters).

* Compilazione Form: l'utente inserisce i suoi dati.

* Submit Form & Invio Email: al submit, invia una email al massoterapista (EmailJS).