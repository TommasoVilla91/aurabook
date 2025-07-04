import { Link, useParams } from 'react-router-dom';
import style from './FormPage.module.css';
import dayjs from 'dayjs';
import 'dayjs/locale/it'; // Importa la localizzazione italiana
import localeData from 'dayjs/plugin/localeData'; // Importa il plugin per i dati locali
import { useRef, useState } from 'react';

function FormPage() {

    dayjs.extend(localeData); // Estendi dayjs con il plugin
    dayjs.locale('it'); // Imposta la lingua globale a italiano

    const { date } = useParams(); // date=2025-07-18&time=11:00

    const dayAndHour = date.replace("date=", "").split("&time="); // ["2025-07-18", "11:00"]

    const selectedDate = dayAndHour[0]; // 2025-07-11
    const selectedTime = dayAndHour[1]; // 12:00
    
    const formattedDate = dayjs(selectedDate).format('D MMMM YYYY'); // Formatta la data in 11 Luglio 2025

    const [name, setName] = useState('');
    const [surname, setSurname] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const birthRef = useRef(null);
        
    const handleSubmit = () => {

    }


    return (
        <div className={style.formPage}>
            <section className={style.formSection}>
                <h1>Modulo di Prenotazione</h1>
                <form>
                    <div className={style.formTop}>
                        <div className={style.anagraphicInfo}>
                            <div>
                                <label htmlFor="name">Nome:</label>
                                <input type="text" id="name" name="name" required />
                            </div>

                            <div>
                                <label htmlFor="name">Cognome:</label>
                                <input type="text" id="name" name="name" required />
                            </div>

                            <div>
                                <label htmlFor="name">Data di nascita:</label>
                                <input type="date" id="birth" name="birth" required />
                            </div>

                            <div>
                                <label htmlFor="phone">Telefono:</label>
                                <input type="tel" id="phone" name="phone" required />
                            </div>

                            <div>
                                <label htmlFor="email">Email:</label>
                                <input type="email" id="email" name="email" required />
                            </div>
                        </div>

                        <div className={style.bookingInfo}>
                            <section>
                                <div className={style.dateSlot}>
                                    <label htmlFor="date">Data della visita:</label>
                                    <h3>{formattedDate}</h3>
                                </div>

                                <div className={style.timeSlot}>
                                    <div>
                                        <label htmlFor="slot">Orario scelto:</label>
                                        <h3>{selectedTime}</h3>
                                    </div>
                                    <div>
                                        <label htmlFor="time">Durata visita:</label>
                                        <h3>1h</h3>
                                    </div>
                                </div>

                                <Link to={'/'} className={style.changeDate}>Cambia data</Link>
                            </section>
                        </div>
                    </div>

                    <div className={style.description}>
                        <label htmlFor="description">Descrivi il motivo della visita</label>
                        <textarea name="description" id="description" required></textarea>
                    </div>
                    
                    <div className={style.submitButton}>
                        <button type="submit">Prenota</button>
                    </div>
                </form>
            </section>
        </div>
    );
};

export default FormPage;