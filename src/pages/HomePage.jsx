import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLocationDot } from '@fortawesome/free-solid-svg-icons';
import BookingCalendar from '../components/BookingCalendar';
import Reveal from '../components/Reveal';
import SlotPicker from '../components/SlotPicker';
import { useAvailability } from '../hooks/useAvailability';
import { useLanguage } from '../i18n/useLanguage';
import { nextOpenDays, parseDate, weekdayShort } from '../utils/dates';
import style from './HomePage.module.css';

function HomePage() {
    const { t, locale } = useLanguage();
    const { hash } = useLocation();
    const days = useMemo(() => nextOpenDays(6), []);
    const { loading, slots } = useAvailability(days);
    const [picked, setPicked] = useState(null);

    const firstFree = loading ? null : days.find((d) => slots[d]?.length > 0) ?? null;
    const day = picked && days.includes(picked) ? picked : firstFree;

    useEffect(() => {
        if (!hash) return;
        document.getElementById(hash.slice(1))?.scrollIntoView();
    }, [hash]);

    return (
        <div className={style.page}>
            <main className={style.hero}>
                <div className={style.copy}>
                    <h1 className="rise" style={{ '--i': 1 }}>{t('home.title')}</h1>
                    <p className={`${style.lede} rise`} style={{ '--i': 2 }}>
                        {t('home.lede')}
                    </p>

                    <section className={`${style.widget} rise`} style={{ '--i': 3 }} aria-label={t('home.nextDays')}>
                        <div className={style.widgetHead}>
                            <span>{t('home.nextDays')}</span>
                            <a href="#calendario">{t('home.seeCalendar')}</a>
                        </div>
                        <div className={style.strip}>
                            {days.map((d, i) => {
                                const count = loading ? null : slots[d]?.length ?? 0;
                                const waiting = count === null;
                                return (
                                    <button
                                        key={d}
                                        type="button"
                                        className={`${style.stripBtn}${d === day ? ` ${style.on}` : ''}${waiting ? ' skel' : ' pop'}`}
                                        style={{ '--i': i }}
                                        disabled={count === 0}
                                        aria-pressed={d === day}
                                        onClick={() => setPicked(d)}
                                    >
                                        <small>{weekdayShort(d, locale)}</small>
                                        <b>{parseDate(d).getDate()}</b>
                                        <em>{waiting ? t('day.freeLoading') : count === 0 ? t('day.full') : t('day.free', { n: count })}</em>
                                    </button>
                                );
                            })}
                        </div>
                        <SlotPicker key={day || 'none'} date={day} slots={day ? slots[day] : null} loading={loading} />
                    </section>
                </div>

                <div className={`${style.archWrap} rise`} style={{ '--i': 2 }}>
                    <div className={style.arch} role="img" aria-label={t('home.archAlt')} />
                    <div className={style.where}>
                        <i><FontAwesomeIcon icon={faLocationDot} /></i>
                        <div><b>{t('home.address')}</b>{t('home.openDays')}</div>
                    </div>
                </div>
            </main>

            <Reveal as="section" className={style.block} id="calendario" aria-labelledby="t-cal">
                <div className={style.blockHead}>
                    <h2 id="t-cal">{t('home.calendarTitle')}</h2>
                    <p>{t('home.calendarSub')}</p>
                </div>
                <BookingCalendar />
            </Reveal>

            <footer className={style.footer}>
                <div>
                    <b>Francesco Massoterapista</b>
                    <span>{t('home.address')}</span>
                </div>
            </footer>
        </div>
    );
}

export default HomePage;
