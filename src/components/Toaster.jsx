import { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleCheck, faCircleXmark, faCircleInfo, faXmark } from '@fortawesome/free-solid-svg-icons';
import styles from './Toaster.module.css';

const ICONS = {
    success: faCircleCheck,
    error:   faCircleXmark,
    info:    faCircleInfo,
};

let _id = 0;

function Toaster() {
    const [toasts, setToasts] = useState([]);

    useEffect(() => {
        const handler = (e) => {
            const id = ++_id;
            setToasts(prev => [...prev, { id, ...e.detail }]);
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id));
            }, 4200);
        };
        window.addEventListener('aurabook:toast', handler);
        return () => window.removeEventListener('aurabook:toast', handler);
    }, []);

    const dismiss = (id) => setToasts(prev => prev.filter(t => t.id !== id));

    return ReactDOM.createPortal(
        <div className={styles.container}>
            {toasts.map(t => (
                <div key={t.id} className={`${styles.toast} ${styles[t.type]}`}>
                    <FontAwesomeIcon icon={ICONS[t.type]} className={styles.icon} />
                    <span className={styles.message}>{t.message}</span>
                    <button className={styles.close} onClick={() => dismiss(t.id)}>
                        <FontAwesomeIcon icon={faXmark} />
                    </button>
                </div>
            ))}
        </div>,
        document.body
    );
}

export default Toaster;
