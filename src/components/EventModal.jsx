import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../supabase/supabaseClient';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLocationDot } from '@fortawesome/free-solid-svg-icons';
import { faCalendar, faClock } from '@fortawesome/free-regular-svg-icons';
import ReactDOM from 'react-dom';
import style from './EventModal.module.css';
import dayjs from 'dayjs';
import 'dayjs/locale/it';

function EventModal({ onClose, show, selectedDate }) {

    // Stato per gli slot disponibili recuperati dalla Edge Function
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    dayjs.locale('it');

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

                {/* FASCIA VERDE */}
                <div className={style.modalTitle}>
                    <h2>Dettagli dell'appuntamento</h2>
                    <div className={style.closeButton}>
                        <button onClick={onClose}><strong>X</strong></button>
                    </div>
                </div>

                {/* INFORMAZIONI VISITA CON ICONE */}
                <div className={style.modalBody}>
                    <div className={style.modalInfo}>
                        <div className={style.date}>
                            <FontAwesomeIcon className={style.icon} icon={faCalendar} />

                            <div>
                                <h3>Data</h3>
                                <p>{dayjs(selectedDate).format('D MMMM YYYY')}</p>
                            </div>

                        </div>

                        <div className={style.duration}>
                            <FontAwesomeIcon className={style.icon} icon={faClock} />

                            <div>
                                <h3>Durata</h3>
                                <p>Sessione di 1 ora</p>
                            </div>

                        </div>

                        <div className={style.address}>
                            <FontAwesomeIcon className={style.icon} icon={faLocationDot} />

                            <div>
                                <h3>Indirizzo</h3>
                                <p>Via fratelli Bronzetti, 9</p>
                                <p>Milano, MI </p>
                            </div>

                        </div>
                    </div>

                    {/* AREA SLOT ORARI */}
                    <div className={style.modalSlots}>

                        <div className={style.slotsArea}>
                            <h3>Orari disponibili</h3>
                            {loading ? (
                                <section className={style.loadingSection}>
                                    <div className={style.skeleton}></div>
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
                        </div>
                    </div>

                </div>
            </div>
        </div>,
        document.body
    );
};

export default EventModal;