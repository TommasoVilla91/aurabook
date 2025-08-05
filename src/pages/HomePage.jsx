import { useRef, useState } from 'react';
import Calendar from '../components/Calendar';
import styles from './HomePage.module.css';

function HomePagae() {

    const [showCalendar, setShowCalendar] = useState(false);

    return (
        <div className={styles.homePage}>
            <section className={styles.titles}>

                <h1>Benvenuto!</h1>
                <h4>Qui potrai prenotare la tua visita</h4>
                <p>Premi il pulsande e scegli il giorno in cui vorresti prenotare</p>

                <div>
                    <button
                        className={styles.bookButton}
                        onClick={() => setShowCalendar(true)} 
                    >
                        Prenota ora
                    </button>
                </div>
            </section>

            <section className={styles.calendarSection}>
                <Calendar 
                    show={showCalendar}                    
                />
            </section>
        </div>
    );
};

export default HomePagae;