# 💆‍♂️ AURABOOKING
### _Un sistema di prenotazioni che gestisce la disponibilità in tempo reale sincronizzandosi con Google Calendar._

Questo progetto è un'applicazione web per la gestione degli appuntamenti, pensata per professionisti come massoterapisti, fisioterapisti, personal trainer o simili. L'obiettivo è offrire un'esperienza di prenotazione fluida per i clienti e una gestione automatizzata della disponibilità per il professionista.

Il sistema si integra in tempo reale con _Google Calendar_, assicurando che ogni prenotazione sia registrata immediatamente e che gli orari già occupati non siano disponibili.

## ⚙️ Tecnologie Utilizzate
* **Backend**: _Deno Edge Functions su Supabase_ (per una logica serverless rapida e integrata).

* **Frontend**: _React.js_.

* **Servizi Esterni**:

    * **_Google Calendar API_**: Per la lettura e l'impostazione degli eventi.

    * **_EmailJS_**: Per l'invio di notifiche via email all'admin.

    * **_SendGrid_**: Per l'invio di email di conferma agli utenti.

* **_UI Components_**: _FullCalendar_ (per l'interfaccia di selezione della data) e _PhoneInput_ (per una gestione completa del numero di telefono inserito nel form).

## 📲 Flow di Prenotazione:

1. ### 📅 **Selezione e Visualizzazione della Disponibilità**

    L'utente seleziona un giorno dal calendario _FullCalendar_. Una _Edge Function_ di _Supabase_ viene invocata per:

      * **Determinare gli slot di disponibilità** basati su regole predefinite.

      * **Leggere gli eventi dal calendario Google** per quel giorno specifico.

      * **Filtrare gli slot disponibili**, rimuovendo quelli già occupati.

      * Gli slot disponibili vengono mostrati in un **modale**.

2. ### 📄 **Compilazione e Invio**

   L'utente sceglie un orario, viene reindirizzato a un modulo di prenotazione e inserisce i propri dati personali.

3. ### 💾 **Conferma e Sincronizzazione**

    Al submit del modulo, un'altra _Edge Function_ di _Supabase_ gestisce il processo di conferma:

      * **Sincronizzazione Google Calendar**: Viene creato un nuovo evento nel calendario Google per bloccare lo slot prenotato.

      * **Notifica all'Admin**: Tramite _EmailJS_, viene inviata un'email al professionista con tutti i dettagli della prenotazione.

      * **Conferma all'Utente**: Con _SendGrid_, viene inviata una email di conferma all'utente con il riepilogo dell'appuntamento.

