import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../supabase/supabaseClient';
import ReactDOM from 'react-dom';
import style from './EventModal.module.css';
import dayjs from 'dayjs';

function EventModal({ onClose, show, selectedDate }) {

    // Stato per gli slot disponibili recuperati dalla Edge Function
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);


    useEffect(() => {
        const fetchSlots = async () => {

            // reset degli stati
            setLoading(true);
            setError(null);
            setSlots([]);

            if (!selectedDate) {
                setLoading(false);
                return;
            };

            const formattedDate = dayjs(selectedDate).format('YYYY-MM-DD');

            try {
                // chiamata alla Edge Function
                const { data, error: functionError } = await supabase.functions.invoke(`get-available-slots`, {
                    body: { date: formattedDate }, // data come corpo della richiesta
                    method: 'POST',
                });

                // se capita un errore durante l'invocazione della funzione
                if (functionError) {
                    console.error('Errore nelle invocazione della Edge Function:', functionError);
                    setError('Impossibile caricare gli slot');
                    return;
                }

                // se le funzione restituisce un oggetto 
                if (data && Array.isArray(data.slots)) {
                    setSlots(data.slots);
                    console.log('Slot disponibili ricevuti:', data.slots);
                } else {
                    console.error('Formato dati ricevuti non valido:', data);
                    setError('Formato dati inaspettato');
                }

            } catch (err) {
                console.error('Errore durante il fetch degli slot:', err);
                setError('Errore imprevisto');
            } finally {
                setLoading(false);
            }
        };

        // eseguire la funzione solo se il modale è visibile e c'è una data selezionata
        if (show && selectedDate) {
            fetchSlots();
        }

        // invocare la Edge Function quando il modale si apre (o la data cambia)
    }, [show, selectedDate]);

    const handleSlotClick = (slot) => {
        // alert(`Hai selezionato la data ${dayjs(selectedDate).format('DD/MM/YYYY')} allo slot ${slot}`);
        onClose();
    };


    return show && ReactDOM.createPortal(
        <div className={style.eventModal}>
            <div className={style.modalContent}>

                <h2>Scegli uno degli orari tra quelli disponibili per il giorno <strong>{dayjs(selectedDate).format('DD/MM/YYYY')}</strong></h2>
                <p>Tutte le visite hanno durata di 1 ora</p>

                {loading ? (
                    // <p className={style.loadingMessage}>Caricamento orari disponibili...</p>
                    <section className={style.loadingSection}>
                        <div className={style.skeleton}></div>
                        <div className={style.skeleton}></div>
                        <div className={style.skeleton}></div>
                        <div className={style.skeleton}></div>
                        <div className={style.skeleton}></div>                    
                    </section>

                ) : error ? (
                    <p className={style.errorMessage}><strong>Errore:</strong> {error}</p>

                ) : slots.length > 0 ? (
                    <div className={style.timeSlots}>

                        <div className={style.slotButtons}>
                            {slots.map((slot, i) => (

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