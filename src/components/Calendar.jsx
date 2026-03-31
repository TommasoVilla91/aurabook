import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from '../utils/toast';
import styles from './Calendar.module.css';
import EventModal from './EventModal';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import googleCalendarPlugin from '@fullcalendar/google-calendar';
import itLocale from '@fullcalendar/core/locales/it';

const MONTHS = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
];

function Calendar({ show }) {

    const clientId  = import.meta.env.VITE_GOOGLE_CALENDAR_CLIENT_ID;
    const calendarId = import.meta.env.VITE_CALENDAR_ID;

    const [showEventModal, setShowEventModal]       = useState(false);
    const [selectedDate, setSelectedDate]           = useState(null);
    const [showMonthDropdown, setShowMonthDropdown] = useState(false);
    const [isMobile, setIsMobile]                   = useState(() => window.innerWidth <= 768);

    // Mobile picker state
    const [mobileMonthIndex, setMobileMonthIndex] = useState(new Date().getMonth());
    const [mobileYear, setMobileYear]             = useState(new Date().getFullYear());
    const [mobileDay, setMobileDay]               = useState('');

    const calendarRef = useRef(null);

    useEffect(() => {
        const onResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    // ── FullCalendar handlers ────────────────────────────────────────────────

    const handleDateSelect = useCallback((selectInfo) => {
        selectInfo.view.calendar.unselect();
    }, []);

    const handleDateClick = useCallback((clickInfo) => {
        const clickedDate = new Date(clickInfo.dateStr);
        clickedDate.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (clickedDate.getDay() === 0) {
            toast.info('Questo giorno non è disponibile per le prenotazioni.');
            return;
        }
        if (clickedDate.getTime() < today.getTime()) {
            toast.info('Non puoi prenotare una data passata.');
            return;
        }
        setSelectedDate(clickInfo.date);
        setShowEventModal(true);
    }, []);

    const handleMonthButtonClick = useCallback(() => {
        setShowMonthDropdown(prev => !prev);
    }, []);

    const handleMonthSelect = useCallback((month) => {
        if (calendarRef.current) {
            const calendarApi = calendarRef.current.getApi();
            const currentYear = calendarApi.getDate().getFullYear();
            calendarApi.gotoDate(new Date(currentYear, month, 1));
        }
        setShowMonthDropdown(false);
    }, []);

    // ── Mobile picker helpers ────────────────────────────────────────────────

    // useMemo: i mesi disponibili cambiano solo all'inizio di ogni nuovo mese.
    // Stabile per tutta la sessione dell'utente nella stessa giornata.
    const monthOptions = useMemo(() => {
        const options = [];
        const now = new Date();
        for (let i = 0; i < 6; i++) {
            const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
            options.push({
                label: `${MONTHS[d.getMonth()]} ${d.getFullYear()}`,
                month: d.getMonth(),
                year:  d.getFullYear(),
            });
        }
        return options;
    }, []);

    // useMemo: ricalcola i giorni validi solo quando cambia mese o anno nel picker
    const validDays = useMemo(() => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const daysInMonth = new Date(mobileYear, mobileMonthIndex + 1, 0).getDate();
        const days = [];
        for (let d = 1; d <= daysInMonth; d++) {
            const date = new Date(mobileYear, mobileMonthIndex, d);
            date.setHours(0, 0, 0, 0);
            if (date.getDay() !== 0 && date >= now) {
                days.push(d);
            }
        }
        return days;
    }, [mobileMonthIndex, mobileYear]);

    const handleMobileMonthChange = useCallback((e) => {
        const [m, y] = e.target.value.split('-').map(Number);
        setMobileMonthIndex(m);
        setMobileYear(y);
        setMobileDay('');
    }, []);

    const handleMobileConfirm = useCallback(() => {
        if (!mobileDay) return;
        const date = new Date(mobileYear, mobileMonthIndex, parseInt(mobileDay));
        setSelectedDate(date);
        setShowEventModal(true);
    }, [mobileDay, mobileMonthIndex, mobileYear]);

    // useCallback: stabile — evita che EventModal (React.memo) si re-renderizzi
    // quando Calendar aggiorna stato interno non correlato (es. showMonthDropdown)
    const handleCloseEventModal = useCallback(() => setShowEventModal(false), []);

    return (
        <>
            {show && (
                <div className={styles.calendar}>

                    {isMobile ? (
                        <div className={styles.mobilePicker}>
                            <p className={styles.mobileTitle}>Seleziona una data</p>

                            <div className={styles.mobileField}>
                                <label className={styles.mobileLabel}>Mese</label>
                                <select
                                    className={styles.mobileSelect}
                                    value={`${mobileMonthIndex}-${mobileYear}`}
                                    onChange={handleMobileMonthChange}
                                >
                                    {monthOptions.map((opt, i) => (
                                        <option key={i} value={`${opt.month}-${opt.year}`}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className={styles.mobileField}>
                                <label className={styles.mobileLabel}>Giorno</label>
                                <select
                                    className={styles.mobileSelect}
                                    value={mobileDay}
                                    onChange={(e) => setMobileDay(e.target.value)}
                                >
                                    <option value="">— Seleziona —</option>
                                    {validDays.map((d) => (
                                        <option key={d} value={d}>{d}</option>
                                    ))}
                                </select>
                            </div>

                            <button
                                className={styles.mobileConfirmBtn}
                                onClick={handleMobileConfirm}
                                disabled={!mobileDay}
                            >
                                Vedi orari disponibili
                            </button>
                        </div>
                    ) : (
                        <>
                            <FullCalendar
                                contentHeight="60vh"
                                ref={calendarRef}
                                plugins={[dayGridPlugin, interactionPlugin, googleCalendarPlugin]}
                                headerToolbar={{
                                    left: 'prev,next today',
                                    center: 'title',
                                    right: 'monthDropdown'
                                }}
                                initialView="dayGridMonth"
                                customButtons={{
                                    monthDropdown: {
                                        text: 'Mese',
                                        click: handleMonthButtonClick
                                    }
                                }}
                                locale={itLocale}
                                selectable={true}
                                selectMirror={true}
                                dayMaxEvents={true}
                                select={handleDateSelect}
                                dateClick={handleDateClick}
                                googleCalendarApiKey={clientId}
                                events={[
                                    {
                                        googleCalendarId: calendarId,
                                        className: styles.event,
                                    },
                                ]}
                                eventsSet={() => {}}
                            />

                            {showMonthDropdown && (
                                <div className={styles.monthDropdown}>
                                    {MONTHS.map((month, i) => (
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
                        </>
                    )}
                </div>
            )}

            <EventModal
                show={showEventModal}
                onClose={handleCloseEventModal}
                selectedDate={selectedDate}
            />
        </>
    );
}

export default Calendar;
