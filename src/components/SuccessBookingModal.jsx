import ReactDOM from 'react-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck, faCalendar, faClock, faLocationDot, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import style from './SuccessBookingModal.module.css';
import { useLanguage } from '../i18n/useLanguage';
import { fullDateLabel } from '../utils/dates';

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
 *   date         {string}   — data della prenotazione (YYYY-MM-DD), formattata nella lingua corrente
 *   bookingTime  {string}   — orario slot (es. "10:00")
 *   onClose      {function} — callback alla chiusura (naviga a "/")
 */
function SuccessBookingModal({ show, name, date, bookingTime, onClose }) {
    const { t, locale } = useLanguage();

    if (!show) return null;

    return ReactDOM.createPortal(
        <div className={style.backdrop} onClick={onClose}>
            <div
                className={style.modalContent}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label={t('success.aria')}
            >
                {/* Header verde con icona check */}
                <div className={style.header}>
                    <FontAwesomeIcon icon={faCircleCheck} className={style.checkIcon} />
                    <div>
                        <p className={style.headerLabel}>{t('success.label')}</p>
                        <h2 className={style.headerTitle}>{t('success.title')}</h2>
                    </div>
                </div>

                {/* Corpo */}
                <div className={style.body}>
                    <p className={style.intro}>
                        {t('success.hello')} <strong>{name}</strong>{t('success.introAfter')}
                        <strong>{t('success.introStrong')}</strong>.
                    </p>

                    {/* Riquadro riepilogo prenotazione */}
                    <div className={style.summary}>
                        <p className={style.summaryTitle}>{t('success.summary')}</p>
                        <div className={style.summaryRow}>
                            <FontAwesomeIcon icon={faCalendar} className={style.rowIcon} />
                            <span className={style.rowLabel}>{t('success.date')}</span>
                            <span className={style.rowValue}>{date ? fullDateLabel(date, locale) : ''}</span>
                        </div>
                        <div className={style.summaryRow}>
                            <FontAwesomeIcon icon={faClock} className={style.rowIcon} />
                            <span className={style.rowLabel}>{t('success.time')}</span>
                            <span className={style.rowValue}>{bookingTime}</span>
                        </div>
                        <div className={style.summaryRow}>
                            <FontAwesomeIcon icon={faClock} className={style.rowIcon} />
                            <span className={style.rowLabel}>{t('success.duration')}</span>
                            <span className={style.rowValue}>{t('success.durationValue')}</span>
                        </div>
                        <div className={style.summaryRow}>
                            <FontAwesomeIcon icon={faLocationDot} className={style.rowIcon} />
                            <span className={style.rowLabel}>{t('success.address')}</span>
                            <span className={style.rowValue}>{t('success.addressValue')}</span>
                        </div>
                    </div>

                    {/* Passi successivi */}
                    <div className={style.nextSteps}>
                        <p className={style.nextStepsTitle}>{t('success.next')}</p>
                        <div className={style.step}>
                            <FontAwesomeIcon icon={faArrowRight} className={style.stepIcon} />
                            <p>{t('success.step1Pre')}<strong>{t('success.step1Strong')}</strong>{t('success.step1Post')}</p>
                        </div>
                        <div className={style.step}>
                            <FontAwesomeIcon icon={faArrowRight} className={style.stepIcon} />
                            <p>{t('success.step2Pre')}<strong>{t('success.step2Strong')}</strong>{t('success.step2Post')}</p>
                        </div>
                        <div className={style.step}>
                            <FontAwesomeIcon icon={faArrowRight} className={style.stepIcon} />
                            <p>{t('success.step3Pre')}<strong>{t('success.step3Strong')}</strong>{t('success.step3Post')}</p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className={style.footer}>
                    <button className={style.closeBtn} onClick={onClose}>
                        {t('success.close')}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}

export default SuccessBookingModal;
