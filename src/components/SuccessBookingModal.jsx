import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck, faCalendar, faClock, faLocationDot, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import style from './SuccessBookingModal.module.css';

/**
 * SuccessBookingModal
 *
 * Modale mostrata subito dopo l'invio con successo della richiesta di prenotazione.
 * Riassume i dettagli della prenotazione e spiega i passi successivi,
 * in modo coerente con la mail automatica che riceve il cliente.
 *
 * Props:
 *   show         {boolean}  — visibilità del modale
 *   name         {string}   — nome del cliente
 *   dateLabel    {string}   — data formattata in italiano (es. "martedì 15 aprile 2026")
 *   bookingTime  {string}   — orario slot (es. "10:00")
 *   onClose      {function} — callback alla chiusura (naviga a "/")
 */
function SuccessBookingModal({ show, name, dateLabel, bookingTime, onClose }) {
    if (!show) return null;

    return ReactDOM.createPortal(
        <div className={style.backdrop} onClick={onClose}>
            <div
                className={style.modalContent}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label="Prenotazione inviata"
            >
                {/* Header verde con icona check */}
                <div className={style.header}>
                    <FontAwesomeIcon icon={faCircleCheck} className={style.checkIcon} />
                    <div>
                        <p className={style.headerLabel}>Richiesta inviata</p>
                        <h2 className={style.headerTitle}>Abbiamo ricevuto la tua richiesta!</h2>
                    </div>
                </div>

                {/* Corpo */}
                <div className={style.body}>
                    <p className={style.intro}>
                        Ciao <strong>{name}</strong>, la tua richiesta di appuntamento è stata ricevuta.
                        Francesco la verificherà al più presto e ti contatterà per{' '}
                        <strong>confermarti la disponibilità</strong>.
                    </p>

                    {/* Riquadro riepilogo prenotazione */}
                    <div className={style.summary}>
                        <p className={style.summaryTitle}>Dettagli richiesta</p>
                        <div className={style.summaryRow}>
                            <FontAwesomeIcon icon={faCalendar} className={style.rowIcon} />
                            <span className={style.rowLabel}>Data</span>
                            <span className={style.rowValue}>{dateLabel}</span>
                        </div>
                        <div className={style.summaryRow}>
                            <FontAwesomeIcon icon={faClock} className={style.rowIcon} />
                            <span className={style.rowLabel}>Orario</span>
                            <span className={style.rowValue}>{bookingTime}</span>
                        </div>
                        <div className={style.summaryRow}>
                            <FontAwesomeIcon icon={faClock} className={style.rowIcon} />
                            <span className={style.rowLabel}>Durata</span>
                            <span className={style.rowValue}>1 ora</span>
                        </div>
                        <div className={style.summaryRow}>
                            <FontAwesomeIcon icon={faLocationDot} className={style.rowIcon} />
                            <span className={style.rowLabel}>Indirizzo</span>
                            <span className={style.rowValue}>Via fratelli Bronzetti, 9 – Milano</span>
                        </div>
                    </div>

                    {/* Passi successivi */}
                    <div className={style.nextSteps}>
                        <p className={style.nextStepsTitle}>Prossimi passi</p>
                        <div className={style.step}>
                            <FontAwesomeIcon icon={faArrowRight} className={style.stepIcon} />
                            <p>Riceverai una <strong>mail di riepilogo</strong> all'indirizzo che hai indicato.</p>
                        </div>
                        <div className={style.step}>
                            <FontAwesomeIcon icon={faArrowRight} className={style.stepIcon} />
                            <p>Francesco ti invierà una <strong>mail di conferma separata</strong> non appena avrà verificato la disponibilità.</p>
                        </div>
                        <div className={style.step}>
                            <FontAwesomeIcon icon={faArrowRight} className={style.stepIcon} />
                            <p>Se hai bisogno di modificare o annullare la richiesta, <strong>rispondi direttamente alla mail</strong>.</p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className={style.footer}>
                    <button className={style.closeBtn} onClick={onClose}>
                        Torna alla home
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}

export default SuccessBookingModal;
