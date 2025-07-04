# FullCalendar (Panoramica)
## Configurazione del Calendario Google:

* Il massoterapista dovrà avere un calendario Google con gli impegni che indicano gli orari occupati (o disponibili).

* Ottenere una API Key di Google Cloud Platform e abilitare l'API di Google Calendar.

* Configurare il calendario del massoterapista per essere "pubblico" o, per maggiore sicurezza, utilizzare un account di servizio o OAuth 2.0 per accedere in modo privato (più complesso per un progetto iniziale, ma più robusto).

## FullCalendar e il Plugin Google Calendar:

* Aggiungere il plugin @fullcalendar/google-calendar al tuo progetto.

* Configurare il componente FullCalendar per puntare all'ID del calendario Google del massoterapista. Questo caricherà automaticamente gli eventi.

## Gestione della Disponibilità:

* Definire degli "slot" orari disponibili per le visite (es. ogni ora dalle 9:00 alle 18:00).

* Quando FullCalendar carica gli eventi dal calendario Google, usarli per disabilitare o visualizzare come "occupati" gli slot corrispondenti.

* Quando l'utente seleziona un giorno, il modale dovrà mostrare solo gli orari che non sono in conflitto con gli eventi del calendario Google.

## Flow di Prenotazione:

* Click sul giorno: dateClick (FullCalendar) per il giorno.

* Apertura Modale: al click si apre un modale che carichi gli slot orari per quel giorno.

* Selezione Orario nel Modale: l'utente sceglie un orario disponibile.

* Reindirizzamento al Form: Passi i dati della data e dell'orario alla pagina del form (URL parameters).

* Compilazione Form: l'utente inserisce i suoi dati.

* Submit Form & Invio Email: al submit, invia una email al massoterapista (EmailJS).

## Aggiornamento Google Calendar (Opzionale ma Utile):

Una volta che la prenotazione è confermata, aggiungere un nuovo evento al calendario Google del massoterapista per bloccare l'orario. Questo richiede l'uso dell'API di Google Calendar in scrittura, complessa ma assicura che il calendario del massoterapista sia sempre aggiornato.