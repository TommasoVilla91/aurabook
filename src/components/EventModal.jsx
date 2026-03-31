import { memo, useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
                const response = await fetch('/api/get-available-slots', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ date: formattedDate }),
                });

                if (!response.ok) {
                    console.error('Errore nella richiesta:', response.status);
                    setError('Impossibile caricare gli slot');
                    return;
                }

                const data = await response.json();

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

    // useCallback: onClose è stabile (definita in Calendar con useCallback),
    // quindi handleSlotClick non verrà ricreata a ogni render
    const handleSlotClick = useCallback(() => {
        onClose();
    }, [onClose]);


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

// React.memo: EventModal non si re-renderizza se show/selectedDate/onClose non cambiano.
// Questo evita render inutili quando il parent (Calendar) aggiorna stato interno
// (es. showMonthDropdown) che non riguarda il modale.
export default memo(EventModal);