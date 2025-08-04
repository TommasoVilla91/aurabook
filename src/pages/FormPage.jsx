import { Link, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../../supabase/supabaseClient';
import style from './FormPage.module.css';
import dayjs from 'dayjs';
import localeData from 'dayjs/plugin/localeData'; // Importa il plugin per i dati locali
import emailjs from '@emailjs/browser'; // Importa la libreria EmailJS
import PhoneInput from 'react-phone-number-input'; // Importa il componente
import 'dayjs/locale/it'; // Importa la localizzazione italiana
import 'react-phone-number-input/style.css'; // Importa gli stili di default

const getUserInfo = () => {
    try {
        const userInfo = localStorage.getItem('userInfo');
        return userInfo ? JSON.parse(userInfo) : {};

    } catch (err) {
        console.error('Errore nel recuper dei dati dal localStorage:', err);
        return {};
    };
}

function FormPage() {

    const userInfo = getUserInfo();

    dayjs.extend(localeData); // Estendi dayjs con il plugin
    dayjs.locale('it'); // Imposta la lingua globale a italiano
    const navigate = useNavigate()

    const { date } = useParams(); // date=2025-07-18&time=11:00

    const dayAndHour = date.replace("date=", "").split("&time="); // ["2025-07-18", "11:00"]

    const selectedDate = dayAndHour[0]; // 2025-07-11
    const selectedTime = dayAndHour[1]; // 12:00

    const formattedDate = dayjs(selectedDate).format('D MMMM YYYY'); // Formatta la data in 11 Luglio 2025

    const [name, setName] = useState(userInfo.name || '');
    const [surname, setSurname] = useState(userInfo.surname || '');
    const [phone, setPhone] = useState(userInfo.phone || '');
    const [email, setEmail] = useState(userInfo.email || '');
    const [emailTouched, setEmailTouched] = useState(false);
    const birthRef = useRef(null);
    const descrRef = useRef(null);

    useEffect(() => {

        if (birthRef.current && userInfo.birthdate) {
            birthRef.current.value = userInfo.birthdate;
        };

        if (descrRef.current && userInfo.description) {
            descrRef.current.value = userInfo.description;
        };
    }, [userInfo]);

    useEffect(() => {
        const userInfoObj = {
            name,
            surname,
            phone,
            email,
            birthdate: birthRef.current ? birthRef.current.value : '',
            description: descrRef.current ? descrRef.current.value : '',
            booking_date: selectedDate,
            booking_time: selectedTime
        };

        try {
            localStorage.setItem('userInfo', JSON.stringify(userInfoObj));
        } catch (err) {
            console.error('Errore nel salvataggio dei dati nel localStorage:', err);
        }
    }, [name, surname, phone, email, selectedDate, selectedTime, birthRef.current?.value, descrRef.current?.value]);


    const symbols = "!@#$%^&*()-_=+[]{}|;:'\\,.<>?/`~";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const infoValidation = useMemo(() => {
        const isNameValid = !name.trim().split('').some(char => symbols.includes(char));
        const isSurnameValid = !surname.trim().split('').some(char => symbols.includes(char));

        let emailValidation = {
            isValid: false,
            errorMessage: ''
        };

        if (email.trim() === '') {
            emailValidation.errorMessage = 'L\'email è obbligatoria.';
        } else if (!emailRegex.test(email.trim())) { // regex per una validazione completa del formato
            emailValidation.errorMessage = 'Inserisci un formato email valido.';
        } else {
            emailValidation.isValid = true;
        }

        return {
            nameField: !isNameValid,
            surnameField: !isSurnameValid,
            emailField: emailValidation,
            areInfoValid: isNameValid && isSurnameValid && emailValidation.isValid
        }
    }, [name, surname, email]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const templateParams = {
            name: name,
            surname: surname,
            phone: phone,
            email: email,
            birthdate: birthRef.current.value,

            // Dati della prenotazione
            booking_date: formattedDate,
            booking_time: selectedTime,

            message: descrRef.current.value
        };

        const serviceId = "Mimmo91";
        const templateId = "template_provaMail";
        const publicKey = "cAoI8tLzje_6gIlLm";

        if (!infoValidation.areInfoValid || !templateParams.birthdate) {
            alert('Assicurati di aver compilato tutti i campi.');
            return;

        } else {

            try {
                // chiamata alla libreria emailjs per inviare l'email con i dati del modulo
                const res = await emailjs.send(serviceId, templateId, templateParams, publicKey);
                if (res.status === 200) {
                    console.log('Email inviata con successo!', res);
                    alert('Prenotazione effettuata con successo!');

                    const { data, error: functionError } = await supabase.functions.invoke('create-booking-event', {
                        body: {
                            name: name,
                            surname: surname,
                            phone: phone,
                            email: email,
                            birthdate: birthRef.current.value,
                            booking_date: selectedDate,
                            booking_time: selectedTime,
                            message: descrRef.current.value
                        },
                        method: 'POST',
                    });

                    if (functionError) {
                        console.error('Errore nelle invocazione della Edge Function:', functionError);
                        alert('Errore durante la creazione della prenotazione. Riprova più tardi.');
                        return;
                    };

                    if (data && data.success) {
                        alert('Prenotazione effettuata con successo! Riceverai una mail di conferma.');

                        // Resetta il modulo dopo l'invio
                        setName('');
                        setSurname('');
                        setPhone('');
                        setEmail('');
                        if (birthRef.current) {
                            birthRef.current.value = '';
                        };
                        if (descrRef.current) {
                            descrRef.current.value = '';
                        };

                        navigate("/");
                    };

                } else {
                    console.error('Risposta inaspettata dalla Edge Function:', data);
                    alert('Errore durante la prenotazione. Riprova più tardi.');
                }

            } catch (error) {
                console.error('Errore durante l\'invio della prenotazione:', error);
                alert('Si è verificato un errore durante la conferma della prenotazione. Riprova più tardi.');
            };
        };
    };


    return (
        <div className={style.formPage}>
            <section className={style.formSection}>
                <h1>Modulo di Prenotazione</h1>

                <form onSubmit={handleSubmit}>
                    <div className={style.formTop}>
                        <div className={style.anagraphicInfo}>
                            <div className={style.col}>
                                <label htmlFor="name">Nome:</label>
                                <input type="text" id="name" name="name" value={name} onChange={(e) => setName(e.target.value)} required />
                                {infoValidation.nameField && <span className={style.error}>Il nome non può contenere simboli speciali.</span>}
                            </div>

                            <div className={style.col}>
                                <label htmlFor="surname">Cognome:</label>
                                <input type="text" id="surname" name="surname" value={surname} onChange={(e) => setSurname(e.target.value)} required />
                                {infoValidation.surnameField && <span className={style.error}>Il cognome non può contenere simboli speciali.</span>}
                            </div>

                            <div className={style.col}>
                                <label htmlFor="date">Data di nascita:</label>
                                <input type="date" id="birth" name="birth" ref={birthRef} required />
                            </div>

                            <div className={style.col}>
                                <label htmlFor="phone">Telefono:</label>
                                <PhoneInput
                                    id="phone-input" // L'ID per l'input generato
                                    value={phone}
                                    onChange={setPhone} // La libreria gestisce l'aggiornamento dello stato
                                    defaultCountry="IT" // Imposta il paese predefinito (es. Italia)
                                    international={true} // Rende l'input sempre internazionale (con prefisso)
                                    countryCallingCodeEditable={false} // Impedisce la modifica del prefisso numerico diretto
                                    withCountryCallingCode // Mostra il prefisso accanto alla bandiera
                                />
                                {/* Mostra un errore se il telefono non è valido (il suo valore è null/undefined) */}
                                {phone === undefined && <p className={style.error}>Inserisci un numero di telefono valido.</p>}
                            </div>

                            <div className={style.col}>
                                <label htmlFor="email">Email:</label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    // onBlur si attiva quando l'input perde il focus
                                    onBlur={() => setEmailTouched(true)}
                                    required
                                />
                                {emailTouched && !infoValidation.emailField.isValid &&
                                    <span className={style.error}>{infoValidation.emailField.errorMessage}</span>}
                            </div>
                        </div>

                        <div className={style.bookingInfo}>
                            <section>
                                <div className={style.dateSlot}>
                                    <label>Data della visita:</label>
                                    <h3>{formattedDate}</h3>
                                </div>

                                <div className={style.timeSlot}>
                                    <div>
                                        <label>Orario scelto:</label>
                                        <h3>{selectedTime}</h3>
                                    </div>
                                    <div>
                                        <label>Durata visita:</label>
                                        <h3>1h</h3>
                                    </div>
                                </div>

                                <Link to={'/'} className={style.changeDate}>Cambia data</Link>
                            </section>
                        </div>
                    </div>

                    <div className={style.description}>
                        <label htmlFor="description">Descrivi il motivo della visita</label>
                        <textarea name="description" id="description" ref={descrRef} required></textarea>
                    </div>

                    <div className={style.submitButton}>
                        <button type="submit">Invia richiesta</button>
                        <p>N.B. sarai prontamente ricontatta/o da Francesco per confermarti l'avvennuta prenotazione</p>
                    </div>
                </form>
            </section>
        </div>
    );
};

export default FormPage;