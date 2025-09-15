import { useState } from 'react';
import Calendar from '../components/Calendar';
import styles from './HomePage.module.css';

function HomePagae() {

    const [showCalendar, setShowCalendar] = useState(false);

    return (
        <div className={styles.homePage}>
            <section className={styles.hero}>

                <div className={styles.titles}>
                    <h1>Francesco Massoterapista</h1>
                    <h3>La tua visita, le tue condizioni</h3>
                    <p>Scegli il momento perfetto per la tua salute. Con pochi passaggi, avrai la possibilità di chiedere un trattamento in un giorno a tua scelta</p>
                </div>

                <div>
                    <button
                        className={styles.bookButton}
                        onClick={() => setShowCalendar(true)}
                    >
                        Prenota ora
                    </button>
                </div>
                
                <div className={styles.calendarSection}>
                    <Calendar
                        show={showCalendar}
                    />
                </div>
            </section>

        </div>
    );
};

export default HomePagae;