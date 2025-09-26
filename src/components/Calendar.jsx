import { useEffect, useRef, useState } from 'react';
import styles from './Calendar.module.css';
import EventModal from './EventModal';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid'; // Per la vista a mese (griglia di giorni)
import interactionPlugin from '@fullcalendar/interaction'; // Fondamentale per rendere le date cliccabili
import googleCalendarPlugin from '@fullcalendar/google-calendar';
import itLocale from '@fullcalendar/core/locales/it';

function Calendar({ show }) {

    const clientId = import.meta.env.VITE_GOOGLE_CALENDAR_CLIENT_ID;
    const calendarId = import.meta.env.VITE_CALENDAR_ID;

    const [showEventModal, setShowEventModal] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const [showMonthDropdown, setShowMonthDropdown] = useState(false); // stato menu a tendina per i mesi
    const [calendarHeight, setCalendarHeight] = useState('60vh'); // Stato per altezza dinamica del calendario
    const calendarRef = useRef(null);

    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            let newHeight = '60vh';
            
            
            if (width <= 480) {
                // Al di sotto di 480px (Mobile)
                newHeight = '20vh'; // Ho cambiato 3vh con 90vh (o 30vh) per rendere il calendario visibile
            } else if (width <= 700) {
                // Tra 481px e 768px
                newHeight = '30vh'; // Modificato per un'altezza più equilibrata
            } else if (width <= 768) {
                // Tra 481px e 768px
                newHeight = '50vh'; // Modificato per un'altezza più equilibrata
            } else {
                // Sopra 1024px (Desktop)
                newHeight = '60vh';
            }

            setCalendarHeight(newHeight);
        };

        window.addEventListener('resize', handleResize);
        handleResize(); // Imposta l'altezza iniziale al caricamento

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    // Questa funzione verrà chiamata quando l'utente clicca o seleziona una data/intervallo
    const handleDateSelect = (selectInfo) => {
        // selectInfo contiene tutte le informazioni sulla selezione
        // Per esempio: selectInfo.startStr è la data di inizio selezionata (come stringa)
        // selectInfo.endStr è la data di fine selezionata (come stringa)
        // selectInfo.allDay è true se è una selezione di intera giornata

        // Se vuoi deselezionare l'intervallo dopo l'azione
        selectInfo.view.calendar.unselect();
    };

    // funzione al click sul singolo giorno
    const handleDateClick = (clickInfo) => {
        // prendo la data cliccata formato YYYY-MM-DD (stringa)
        const clickedDate = new Date(clickInfo.dateStr);
        clickedDate.setHours(0, 0, 0, 0); // Imposto l'orario a mezzanotte per confrontare solo le date

        // prendo la data di oggi nello stesso orario della data cliccata
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (clickedDate.getDay() === 0) { // getDay() restituisce 0 per Domenica, 1 per Lunedì, ecc.
            alert('Questo giorno non è disponibile per le prenotazioni.');
            return;
        };
        // Controllo se la data cliccata è passata
        if (clickedDate.getTime() < today.getTime()) { // getTime() restituisce il timestamp in millisecondi
            alert('Non puoi prenotare una data passata.');
            return;
        }
        // clickInfo.dateStr contiene la data cliccata
        setShowEventModal(true);
        // Salva la data selezionata per usarla nel modale
        setSelectedDate(clickInfo.date);
    };

    // Funzione per il click sul pulsante personalizzato "Mese"
    const handleMonthButtonClick = () => {
        setShowMonthDropdown(prev => !prev); // Togglie la visibilità del dropdown
    };

    // Funzione per gestire la selezione di un mese dal dropdown
    const handleMonthSelect = (month) => {
        // I mesi vanno da 0 (Gennaio) a 11 (Dicembre)
        if (calendarRef.current) {
            const calendarApi = calendarRef.current.getApi(); // Ottieni l'istanza del calendario
            const currentDate = calendarApi.getDate(); // Ottieni la data corrente del calendario
            const currentYear = currentDate.getFullYear(); // Ottieni l'anno corrente

            // Creazione di una nuova data con l'anno corrente e il mese selezionato
            calendarApi.gotoDate(new Date(currentYear, month, 1)) // Vai al primo giorno del mese selezionato
        }
        setShowMonthDropdown(false); // Chiude il dropdown dopo la selezione
    };

    const months = [
        'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
        'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
    ];

    return (
        <>
            {show && (
                <div className={styles.calendar}>

                    <FullCalendar
                        contentHeight={calendarHeight}
                        ref={calendarRef}
                        plugins={[
                            dayGridPlugin,         // Abilita la vista a griglia (mese)
                            interactionPlugin,     // Abilita le interazioni (selezione, click, drag/drop)
                            googleCalendarPlugin   // Abilita il plugin per Google Calendar
                        ]}
                        headerToolbar={{
                            left: 'prev,next today', // Pulsanti "precedente", "successivo", "oggi"
                            center: 'title', // Il titolo del mese/anno
                            right: 'monthDropdown'
                        }}
                        initialView="dayGridMonth" // Vista iniziale adattata per mobile
                        // Definizione dei pulsanti personalizzati
                        customButtons={{
                            monthDropdown: {
                                text: 'Mese',
                                click: handleMonthButtonClick // Funzione per il click sul pulsante "Mese"
                            }
                        }}

                        locale={itLocale} // Imposta la lingua italiana per il calendario
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
                            // sorgente del Google Calendar
                            {
                                googleCalendarId: calendarId,
                                className: styles.event,
                            },
                        ]}
                        eventsSet={(events) => {
                            // alert('Eventi caricati:', events);
                            // Qui puoi elaborare gli eventi per determinare la disponibilità
                        }}
                    />

                    {showMonthDropdown && (
                        <div className={styles.monthDropdown}>
                            {months.map((month, i) => (
                                <div
                                    key={i}
                                    onClick={() => handleMonthSelect(i)}
                                    className={styles.monthOption}
                                >
                                    <p>{month}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <EventModal
                show={showEventModal}
                onClose={() => setShowEventModal(false)}
                selectedDate={selectedDate}
            />
        </>
    );
};

export default Calendar;