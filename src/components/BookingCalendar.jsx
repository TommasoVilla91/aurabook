import { useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import SlotPicker from './SlotPicker';
import { useAvailability } from '../hooks/useAvailability';
import { useLanguage } from '../i18n/useLanguage';
import { longLabel, monthCells, monthTitle, parseDate, toDateStr, weekdayHeaders } from '../utils/dates';
import style from './BookingCalendar.module.css';

const MONTHS_AHEAD = 5;

export default function BookingCalendar() {
    const { t, locale } = useLanguage();
    const weekdays = useMemo(() => weekdayHeaders(locale), [locale]);
    const now = new Date();
    const todayStr = toDateStr(now);
    const [view, setView] = useState({ year: now.getFullYear(), month: now.getMonth() });
    const [selected, setSelected] = useState(null);

    const cells = useMemo(() => monthCells(view.year, view.month), [view]);
    const bookable = useMemo(
        () => cells.filter((d) => d && d >= todayStr && parseDate(d).getDay() !== 0),
        [cells, todayStr]
    );
    const { loading, slots } = useAvailability(bookable);

    const firstFree = loading ? null : bookable.find((d) => slots[d]?.length > 0) ?? null;
    const active = selected && bookable.includes(selected) ? selected : firstFree;

    useEffect(() => {
        if (selected && !bookable.includes(selected)) setSelected(null);
    }, [bookable, selected]);

    const isCurrent = view.year === now.getFullYear() && view.month === now.getMonth();
    const last = new Date(now.getFullYear(), now.getMonth() + MONTHS_AHEAD, 1);
    const isLast = view.year === last.getFullYear() && view.month === last.getMonth();

    const shift = (delta) => {
        setSelected(null);
        setView(({ year, month }) => {
            const d = new Date(year, month + delta, 1);
            return { year: d.getFullYear(), month: d.getMonth() };
        });
    };

    const free = (d) => (loading ? null : slots[d]?.length ?? 0);

    return (
        <div className={style.card}>
            <div>
                <div className={style.top}>
                    <h3>{monthTitle(view.year, view.month, locale)}</h3>
                    <div className={style.nav}>
                        <button type="button" onClick={() => shift(-1)} disabled={isCurrent} aria-label={t('cal.prev')}>
                            <FontAwesomeIcon icon={faChevronLeft} />
                        </button>
                        <button type="button" onClick={() => shift(1)} disabled={isLast} aria-label={t('cal.next')}>
                            <FontAwesomeIcon icon={faChevronRight} />
                        </button>
                    </div>
                </div>

                <div className={style.weekdays} aria-hidden="true">
                    {weekdays.map((w) => <span key={w}>{w}</span>)}
                </div>

                <div className={style.grid} key={`${view.year}-${view.month}`}>
                    {cells.map((d, i) => {
                        if (!d) return <span key={`e${i}`} className={style.empty} />;
                        const n = Number(d.slice(8));
                        const sunday = parseDate(d).getDay() === 0;
                        const past = d < todayStr;
                        const count = free(d);
                        const isOpen = !past && !sunday;
                        const waiting = isOpen && count === null;
                        const disabled = !isOpen || count === 0;
                        const note = sunday ? t('day.closed') : past ? '' : waiting ? '' : count === 0 ? t('day.full') : t('day.free', { n: count });
                        const cls = [
                            style.cell,
                            d === todayStr && style.today,
                            d === active && style.sel,
                            waiting && 'skel',
                            !waiting && 'pop',
                            count > 0 && style.hasFree,
                        ].filter(Boolean).join(' ');
                        return (
                            <button
                                key={d}
                                type="button"
                                className={cls}
                                style={{ '--i': Math.min(i, 24) }}
                                disabled={disabled}
                                aria-pressed={d === active}
                                aria-label={`${longLabel(d, locale)}${note ? `, ${note}` : ''}`}
                                onClick={() => setSelected(d)}
                            >
                                <b>{n}</b>
                                <small>{note}</small>
                            </button>
                        );
                    })}
                </div>

                <div className={style.legend}>
                    <span>{t('cal.legendFree')}</span>
                    <span className={style.lSel}>{t('cal.legendSelected')}</span>
                    <span className={style.lOff}>{t('cal.legendOff')}</span>
                </div>
            </div>

            <div className={style.panel}>
                {active ? (
                    <>
                        <h3 key={active} className="pop">{longLabel(active, locale)}</h3>
                        <p>{t('day.slots', { n: free(active) })}</p>
                    </>
                ) : (
                    <>
                        <h3>{loading ? t('cal.loadingTitle') : t('cal.noneTitle')}</h3>
                        <p>{loading ? t('cal.loadingText') : t('cal.noneText')}</p>
                    </>
                )}
                <SlotPicker key={active || 'none'} date={active} slots={active ? slots[active] : null} loading={loading} centered />
            </div>
        </div>
    );
}
