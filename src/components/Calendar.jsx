import styles from './Calendar.module.css';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid'; // Per la vista a mese (griglia di giorni)
import interactionPlugin from '@fullcalendar/interaction'; // Fondamentale per rendere le date cliccabili


function Calendar({ show }) {

    const clientId = import.meta.env.VITE_GOOGLE_CALENDAR_CLIENT_ID;

    // Questa funzione verrà chiamata quando l'utente clicca o seleziona una data/intervallo
    const handleDateSelect = (selectInfo) => {
        // selectInfo contiene tutte le informazioni sulla selezione
        // Per esempio: selectInfo.startStr è la data di inizio selezionata (come stringa)
        // selectInfo.endStr è la data di fine selezionata (come stringa)
        // selectInfo.allDay è true se è una selezione di intera giornata

        alert('Hai selezionato la data/intervallo: ' + selectInfo.startStr + ' al ' + selectInfo.endStr);

        // Qui puoi implementare la logica per aprire un modale di prenotazione,
        // o aggiornare uno stato con la data selezionata.
        // Esempio: setSelectedBookingDate(selectInfo.startStr);

        // Se vuoi deselezionare l'intervallo dopo l'azione
        selectInfo.view.calendar.unselect();
    };

    // Questa funzione verrà chiamata quando l'utente clicca un singolo giorno (senza trascinare)
    const handleDateClick = (clickInfo) => {
        alert('Hai cliccato il giorno: ' + clickInfo.dateStr);
        // clickInfo.dateStr contiene la data cliccata
    };

    return (
        <>
            {show && (
                <div className={styles.calendar}>
                    <FullCalendar
                        plugins={[
                            dayGridPlugin,        // Abilita la vista a griglia (mese)
                            interactionPlugin     // Abilita le interazioni (selezione, click, drag/drop)
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
                    />
                </div>
            )}
        </>
    );
};

export default Calendar;