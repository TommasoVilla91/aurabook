import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import style from './EventModal.module.css';
import dayjs from 'dayjs';
import { Link } from 'react-router-dom';

// Mappatura delle regole degli slot di disponibilità
const dailyAvailabilityRules = {
    // Lunedì (1)
    1: { start: '15:30', end: '19:30' },
    // Martedì (2) - Mercoledì (3) - Giovedì (4) - Venerdì (5) 
    2: { start: '08:00', end: '19:30' }, // Martedì
    3: { start: '08:00', end: '12:00' }, // Mercoledì
    4: { start: '08:00', end: '12:00' }, // Giovedì
    5: { start: '08:00', end: '19:30' }, // Venerdì
    // Sabato (6)
    6: { start: '09:00', end: '12:00' },
    // Domenica (0) - non abbiamo orari
    0: null
};

const generateTimeSlots = (date) => {
    // Scopri che giorno della settimana è (0 per domenica, 1 per lunedì, ecc.)
    const dayOfWeek = date.getDay();
    // Ottiengo le regole di orario per questo specifico giorno
    const availability = dailyAvailabilityRules[dayOfWeek];

    // Se non ci sono regole, ritorno array vuoto
    if (availability === null || availability === undefined) {
        return [];
    };

    // Salvataggio orari disponibili
    const avaiableSlots = [];

    // Separo e trasformo in numeri gli orari di inizio
    const startHour = parseInt(availability.start.split(':')[0], 10);
    const startMinute = parseInt(availability.start.split(':')[1], 10); // Uso 10 per il parseInt per interpretare la stringa come un numero decimale

    // Separo e trasformo in numeri gli orari di fine
    const endHour = parseInt(availability.end.split(':')[0], 10);
    const endMinute = parseInt(availability.end.split(':')[1], 10);

    // Imposto l'anno, mese, giorno uguali a quelli della data cliccata
    // con l'ora e i minuti unguali a quelli del primo slot
    let currentTime = new Date(date);
    // impostare l'ora, i minuti, i secondi e i millisecondi di un oggetto Date
    currentTime.setHours(startHour, startMinute, 0, 0);

    // Faccio uguale ma con l'ora e i minuti uguali a quelli dell'ultimo slot
    let endTime = new Date(date);
    endTime.setHours(endHour, endMinute, 0, 0);
    
    // Ciclo tutte le ore aggiungendo gli slot all'array avaiableSlots
    while (currentTime.getTime() <= endTime.getTime()) {
        // Formattazione dell'orario in HH:MM
        // padStart serve a riempire con zeri a sinistra se le cifre sono minori di 2
        const formattedHour = currentTime.getHours().toString().padStart(2, '0');
        const formattedMinute = currentTime.getMinutes().toString().padStart(2, '0');

        // Aggiungo lo slot all'array
        avaiableSlots.push(`${formattedHour}:${formattedMinute}`);

        // Per passare al prossimo slot, aggiungo 1 ora
        currentTime.setHours(currentTime.getHours() + 1);
    };

    // Ritorno l'array con gli slot disponibili
    return avaiableSlots;
};



function EventModal({ onClose, show, selectedDate }) {

    const [timesToShow, setTimesToShow] = useState([]);

    useEffect(() => {
        // Se il modale è visibile e c'è una data selezionata
        if(show && selectedDate) {
            // Converte la stringa della data cliccata in un oggetto Date
            const date = new Date(selectedDate);
            // Genera gli slot in base alle regole di cui sopra
            const slots = generateTimeSlots(date);

            // Imposta gli slot generati nello stato
            setTimesToShow(slots);
        } else {
            // Se il modale non è visibile o non c'è una data selezionata, resetto gli slot
            setTimesToShow([]); 
        };
    }, [show, selectedDate]);

    const handleSlotClick = (slot) => {
        // alert(`Hai selezionato la data ${dayjs(selectedDate).format('DD/MM/YYYY')} allo slot ${slot}`);
        onClose();
    };


    return show && ReactDOM.createPortal (
        <div className={style.eventModal}>
            <div className={style.modalContent}>
                <h2>Scegli uno degli orari tra quelli disponibili per il giorno <strong>{dayjs(selectedDate).format('DD/MM/YYYY')}</strong></h2>

                <p>Tutte le visite hanno durata di 1 ora</p>

                { timesToShow.length > 0 ? (
                    <div className={style.timeSlots}>

                        {timesToShow.map((slot, i) => (

                            <Link
                                to={`/form/date=${dayjs(selectedDate).format('YYYY-MM-DD')}&time=${slot}`} 
                                key={i} 
                                onClick={() => handleSlotClick(slot)}
                                className={style.timeSlotButton}
                            >
                                {slot}
                            </Link>
                        ))}
                    </div>
                ) : (
                    <p>Nessun orario disponibile per questa data.</p>
                )}
                <div className={style.closeButton}>
                    <button onClick={onClose}><strong>X</strong></button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default EventModal;