import { Link, useNavigate, useParams } from 'react-router-dom';
import PrivacyModal from '../components/PrivacyModal';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useGlobalContext } from '../context/GlobalContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHourglassStart } from '@fortawesome/free-solid-svg-icons';
import { faCalendar, faClock } from '@fortawesome/free-regular-svg-icons';
import style from './FormPage.module.css';
import dayjs from 'dayjs';
import localeData from 'dayjs/plugin/localeData'; // Importa il plugin per i dati locali
import emailjs from '@emailjs/browser'; // Importa la libreria EmailJS
import PhoneInput from 'react-phone-number-input'; // Importa il componente
import 'dayjs/locale/it'; // Importa la localizzazione italiana
import 'react-phone-number-input/style.css'; // Importa gli stili di default
import { toast } from '../utils/toast';


function FormPage() {
    const { getUserInfo } = useGlobalContext();
    const { date } = useParams(); // date=2025-07-18&time=11:00

    const userInfo = getUserInfo();
    const navigate = useNavigate()

    dayjs.extend(localeData); // Estendi dayjs con il plugin
    dayjs.locale('it'); // Imposta la lingua globale a italiano

    const dayAndHour = date.replace("date=", "").split("&time="); // ["2025-07-18", "11:00"]

    const selectedDate = dayAndHour[0]; // 2025-07-11
    const selectedTime = dayAndHour[1]; // 12:00

    const formattedDate = dayjs(selectedDate).format('D MMMM YYYY'); // Formatta la data in 11 Luglio 2025

    const [name, setName] = useState(userInfo.name || '');
    const [surname, setSurname] = useState(userInfo.surname || '');
    const [phone, setPhone] = useState(userInfo.phone || '');
    const [email, setEmail] = useState(userInfo.email || '');
    const [emailTouched, setEmailTouched] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);
    // Controlla la visibilità della modale Privacy & Termini
    const [showPrivacyModal, setShowPrivacyModal] = useState(false);
    const birthRef = useRef(null);
    const descrRef = useRef(null);

    // se esistono già i valori nel localStorage, li recupera e li imposta
    useEffect(() => {
        if (birthRef.current && userInfo.birthdate) {
            birthRef.current.value = userInfo.birthdate;
        };

        if (descrRef.current && userInfo.description) {
            descrRef.current.value = userInfo.description;
        };
    }, [userInfo]);

    // salvataggio dati del form nel localStorage
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

        const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
        const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
        const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

        if (!infoValidation.areInfoValid || !templateParams.birthdate) {
            toast.info('Assicurati di aver compilato tutti i campi.');
            return;
        }

        // ── Step 1: notifica admin via EmailJS ──────────────────────────
        try {
            const res = await emailjs.send(serviceId, templateId, templateParams, publicKey);
            if (res.status !== 200) {
                // EmailJS ha risposto ma con uno status inatteso
                console.error('EmailJS status inatteso:', res.status, res);
                toast.error('Errore durante l\'invio della notifica. Riprova più tardi.');
                return;
            }
            console.log('EmailJS: notifica admin inviata', res);
        } catch (emailErr) {
            console.error('EmailJS error:', emailErr);
            toast.error('Errore durante l\'invio della notifica. Controlla la connessione e riprova.');
            return;
        }

        // ── Step 2: crea evento Google Calendar + email cliente ─────────
        try {
            const response = await fetch('/api/create-booking-event', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: name,
                    surname: surname,
                    phone: phone,
                    email: email,
                    birthdate: birthRef.current.value,
                    booking_date: selectedDate,
                    booking_time: selectedTime,
                    message: descrRef.current.value
                }),
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                console.error('API error:', response.status, errData);
                toast.error('Errore durante la creazione della prenotazione. Riprova più tardi.');
                return;
            }

            const data = await response.json();

            if (data && data.success) {
                toast.success('Prenotazione effettuata con successo! Riceverai una mail di conferma.');

                // Resetta il modulo dopo l'invio
                setName('');
                setSurname('');
                setPhone('');
                setEmail('');
                if (birthRef.current) birthRef.current.value = '';
                if (descrRef.current) descrRef.current.value = '';

                navigate('/');
            }

        } catch (apiErr) {
            console.error('Errore API create-booking-event:', apiErr);
            toast.error('Errore di rete durante la prenotazione. Riprova più tardi.');
        }
    };


    return (
        <>
        <div className={style.formPage}>
            <section className={style.formContainer}>

                <div className={style.imageForm}>

                    <h1>La tua visita</h1>

                    <div className={style.bookingInfo}>
                        <div>
                            <FontAwesomeIcon className={style.icon} icon={faCalendar} /> 
                            <h3>{formattedDate}</h3>
                        </div>
                        <div>
                            <FontAwesomeIcon className={style.icon} icon={faClock} />
                            <h3>{selectedTime}</h3>
                        </div>
                        <div>
                            <FontAwesomeIcon className={style.icon} icon={faHourglassStart} />
                            <h3>1h</h3>
                        </div>

                        <Link to={'/'} className={style.changeDate}>Cambia data</Link>

                    </div>
                </div>

                <div className={style.formArea}>

                    <h1>Completa la tua prenotazione</h1>

                    <form onSubmit={handleSubmit}>
                        <div className={style.formTop}>

                            {/* inputs area */}

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
                        </div>

                        {/* description area */}

                        <div className={style.description}>
                            <label htmlFor="description">Descrivi il motivo della visita</label>
                            <textarea name="description" id="description" ref={descrRef} required></textarea>
                        </div>

                        {/* submit button area */}

                        <div className={style.submitButton}>
                            <p>N.B. sarai prontamente ricontatta/o da Francesco per confermarti l'avvennuta prenotazione</p>
                            <div className={style.termConditions}>
                                {/* Checkbox controllato dallo stato termsAccepted */}
                                <input
                                    type="checkbox"
                                    id="term"
                                    name="term"
                                    value="term"
                                    checked={termsAccepted}
                                    onChange={(e) => setTermsAccepted(e.target.checked)}
                                />
                                {/* Cliccando il link si apre la modale Privacy & Termini */}
                                <label htmlFor="term">
                                    Accetto i{' '}
                                    <a
                                        href="#"
                                        className={style.privacyLink}
                                        onClick={(e) => { e.preventDefault(); setShowPrivacyModal(true); }}
                                    >
                                        Termini del Servizio e la Privacy Policy
                                    </a>
                                </label>
                            </div>
                            <button
                                type="submit"
                                disabled={!termsAccepted}
                            >
                                Invia richiesta
                            </button>
                        </div>
                    </form>
                </div>
            </section >
        </div >

        {/* Modale Privacy & Termini del Servizio
            onAccept: imposta termsAccepted=true e chiude la modale */}
        <PrivacyModal
            show={showPrivacyModal}
            onClose={() => setShowPrivacyModal(false)}
            onAccept={() => {
                setTermsAccepted(true);
                setShowPrivacyModal(false);
            }}
        />
        </>
    );
};

export default FormPage;