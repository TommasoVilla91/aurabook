import { useState } from 'react';
import Calendar from '../components/Calendar';
import styles from './HomePage.module.css';

function HomePagae() {

    const [showCalendar, setShowCalendar] = useState(false);
    const [showTitles, setShowTitles] = useState(true);

    return (
        <div className={styles.homePage}>
            <section className={styles.hero}>

                {showTitles && (
                    <>
                        <div className={styles.titles}>
                            <h1>Francesco Massoterapista</h1>
                            <h3>La tua visita, le tue condizioni</h3>
                            <p>Scegli il momento perfetto per la tua salute. Con pochi passaggi, avrai la possibilità di chiedere un trattamento in un giorno a tua scelta</p>
                        </div>
                        <div>
                            <button
                                className={styles.bookButton}
                                onClick={() => {
                                    setShowCalendar(true);
                                    setShowTitles(false);
                                }}
                            >
                                Prenota ora
                            </button>
                        </div>
                    </>
                )}


                <Calendar
                    show={showCalendar}
                />
            </section>

        </div>
    );
};

export default HomePagae;