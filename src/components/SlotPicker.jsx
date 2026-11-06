import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../i18n/useLanguage';
import style from './SlotPicker.module.css';

export default function SlotPicker({ date, slots, loading, centered = false }) {
    const { t } = useLanguage();
    const [picked, setPicked] = useState(null);

    const current = slots && picked && slots.includes(picked) ? picked : slots?.[0] ?? null;

    return (
        <div className={`${style.picker}${centered ? ` ${style.centered}` : ''}`}>
            <div className={style.pills}>
                {loading && Array.from({ length: 4 }, (_, i) => (
                    <span key={i} className={`${style.pill} ${style.pillSkel} skel`}>00:00</span>
                ))}
                {!loading && slots?.map((time, i) => (
                    <button
                        key={time}
                        type="button"
                        className={`${style.pill} pop${time === current ? ` ${style.on}` : ''}`}
                        style={{ '--i': i }}
                        aria-pressed={time === current}
                        onClick={() => setPicked(time)}
                    >
                        {time}
                    </button>
                ))}
            </div>
            {!loading && (!slots || slots.length === 0) && (
                <p className={style.empty}>{t('slots.empty')}</p>
            )}
            {current && date ? (
                <Link className={style.cta} to={`/form/date=${date}&time=${current}`}>{t('slots.cta')}</Link>
            ) : (
                <span className={`${style.cta} ${style.off}`} aria-disabled="true">{t('slots.cta')}</span>
            )}
        </div>
    );
}
