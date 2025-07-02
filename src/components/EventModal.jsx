import React, { useEffect, useMemo, useState } from 'react';
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
    // Domenica (0)
    0: null
};

// Funzione per generare gli slot di tempo disponibili in base alla data selezionata
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

    const generatedSlots = useMemo(() => {

        if(!show || !selectedDate) {
            setTimesToShow([]);
            return;
        };
        // Genero gli slot di tempo disponibili per la data selezionata
        const slotArray = generateTimeSlots(new Date(selectedDate));

        // Filtro slot in base alla data selezionata
        const filterdSlots = slotArray.filter(slot => {
            
            // prendo il numero dell'ora e dei minuti dello slot
            const slotHour = parseInt(slot.split(':')[0], 10);
            const slotMinute = parseInt(slot.split(':')[1], 10);           

            // prendo l'ora e i minuti di oggi
            const now = new Date();
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();

            // data selezionata da comparare
            const dateToCompare = new Date(selectedDate);
            dateToCompare.setHours(0, 0, 0, 0);

            // data di oggi da comparare
            const nowToCompare = new Date();
            nowToCompare.setHours(0, 0, 0, 0);            

            // Se la data selezionata è uguale a quella di oggi (stringata YYYY-MM-DD)
            if (dateToCompare.getTime() === nowToCompare.getTime()) {
                // ritorno solo gli slot che sono dopo l'orario attuale
                return slotHour > currentHour || (slotHour === currentHour && slotMinute >= currentMinute);
            } 
            return true; // Altrimenti, ritorno tutti gli slot
        });
        // Imposto gli slot generati
        return filterdSlots;

    }, [show, selectedDate]);

    const handleSlotClick = (slot) => {
        // alert(`Hai selezionato la data ${dayjs(selectedDate).format('DD/MM/YYYY')} allo slot ${slot}`);
        onClose();
    };


    return show && ReactDOM.createPortal (
        <div className={style.eventModal}>
            <div className={style.modalContent}>

                {generatedSlots.length > 0 ? (
                    <div className={style.timeSlots}>

                        <h2>Scegli uno degli orari tra quelli disponibili per il giorno <strong>{dayjs(selectedDate).format('DD/MM/YYYY')}</strong></h2>
                        <p>Tutte le visite hanno durata di 1 ora</p>

                        {generatedSlots.map((slot, i) => (

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
                    <p className={style.noSlotMessage}><strong>Nessun orario disponibile per questa data.</strong></p>
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