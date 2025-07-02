import styles from './Calendar.module.css';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid'; // Per la vista a mese (griglia di giorni)
import interactionPlugin from '@fullcalendar/interaction'; // Fondamentale per rendere le date cliccabili
import googleCalendarPlugin from '@fullcalendar/google-calendar';
import EventModal from './EventModal';
import { useState } from 'react';

function Calendar({ show }) {

    const clientId = import.meta.env.VITE_GOOGLE_CALENDAR_CLIENT_ID;
    const calendarId = 'prova-ee5bd@group.calendar.google.com';

    const [showEventModal, setShowEventModal] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);

    // Questa funzione verrà chiamata quando l'utente clicca o seleziona una data/intervallo
    const handleDateSelect = (selectInfo) => {
        // selectInfo contiene tutte le informazioni sulla selezione
        // Per esempio: selectInfo.startStr è la data di inizio selezionata (come stringa)
        // selectInfo.endStr è la data di fine selezionata (come stringa)
        // selectInfo.allDay è true se è una selezione di intera giornata

        // alert('Hai selezionato la data: ' + selectInfo.allDay);

        // Qui puoi implementare la logica per aprire un modale di prenotazione,
        // o aggiornare uno stato con la data selezionata.
        // Esempio: setSelectedBookingDate(selectInfo.startStr);

        // Se vuoi deselezionare l'intervallo dopo l'azione
        selectInfo.view.calendar.unselect();
    };

    // funzione al click sul singolo giorno (senza trascinare)
    const handleDateClick = (clickInfo) => {
        const clickedDate = new Date(clickInfo.dateStr);
        if (clickedDate.getDay() === 0) { // getDay() restituisce 0 per Domenica, 1 per Lunedì, ecc.
            alert('La domenica non è disponibile per le prenotazioni.');
            return;
        }
        // clickInfo.dateStr contiene la data cliccata
        setShowEventModal(true);
        // Salva la data selezionata per usarla nel modale
        setSelectedDate(clickInfo.dateStr);
    };

    return (
        <>
            <div className={styles.calendarContainer}>
                {show && (
                    <div className={styles.calendar}>
                        <FullCalendar
                            plugins={[
                                dayGridPlugin,        // Abilita la vista a griglia (mese)
                                interactionPlugin,     // Abilita le interazioni (selezione, click, drag/drop)
                                googleCalendarPlugin   // Abilita il plugin per Google Calendar
                            ]}
                            initialView="dayGridMonth" // Vista iniziale del calendario (mese)
                            headerToolbar={{
                                left: 'prev,next today', // Pulsanti "precedente", "successivo", "oggi"
                                center: 'title',         // Il titolo del mese/anno
                                right: 'dayGridMonth'    // Pulsante per tornare alla vista mese
                            }}
                            locale="it" // Imposta la lingua italiana per il calendario
                            selectable={true} // **RENDE LE DATE CLICCABILI E SELEZIONABILI**
                            selectMirror={true} // Mostra un'anteprima visiva della selezione
                            dayMaxEvents={true} // Se ci sono troppi eventi in un giorno, li raggruppa sotto "+X more"

                            // Callback quando l'utente seleziona un intervallo di date
                            select={handleDateSelect}

                            // Callback quando l'utente clicca su un singolo giorno (senza selezione)
                            dateClick={handleDateClick}

                            // Opzionale: per nascondere i weekend se non vuoi prenotazioni in quei giorni
                            // weekends={false}

                            googleCalendarApiKey={clientId} // La tua API key di Google Calendar

                            // Qui definisci un oggetto che indica a FullCalendar di caricare eventi da un Google Calendar specifico
                            events={[
                                {
                                    googleCalendarId: calendarId,
                                    className: styles.event,
                                }
                            ]}
                            eventsSet={(events) => {
                                // alert('Eventi caricati:', events);
                                // Qui puoi elaborare gli eventi per determinare la disponibilità
                            }}
                        />
                    </div>
                )}
            </div>
            
            <EventModal
                show={showEventModal}
                onClose={() => setShowEventModal(false)}
                selectedDate={selectedDate}
            />
        </>
    );
};

export default Calendar;