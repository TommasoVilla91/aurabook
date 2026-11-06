import { Link, useNavigate, useParams } from 'react-router-dom';
import PrivacyModal from '../components/PrivacyModal';
import SuccessBookingModal from '../components/SuccessBookingModal';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useGlobalContext } from '../context/GlobalContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import style from './FormPage.module.css';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { toast } from '../utils/toast';
import { longLabel } from '../utils/dates';
import { useLanguage } from '../i18n/useLanguage';


function FormPage() {
    const { t, locale, lang } = useLanguage();
    const { getUserInfo } = useGlobalContext();
    const { date } = useParams(); // date=2025-07-18&time=11:00

    const userInfo = getUserInfo();
    const navigate = useNavigate()

    const dayAndHour = date.replace("date=", "").split("&time="); // ["2025-07-18", "11:00"]

    const selectedDate = dayAndHour[0];
    const selectedTime = dayAndHour[1];

    const [name, setName] = useState(userInfo.name || '');
    const [surname, setSurname] = useState(userInfo.surname || '');
    const [phone, setPhone] = useState(userInfo.phone || '');
    const [email, setEmail] = useState(userInfo.email || '');
    const [emailTouched, setEmailTouched] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [sending, setSending] = useState(false);
    // Controlla la visibilità della modale Privacy & Termini
    const [showPrivacyModal, setShowPrivacyModal] = useState(false);
    // Dati del modale di successo (null = modale chiusa)
    const [successData, setSuccessData] = useState(null);
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
    }, [name, surname, phone, email, selectedDate, selectedTime]);


    const symbols = "!@#$%^&*()-_=+[]{}|;:'\\,.<>?/`~";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const infoValidation = useMemo(() => {
        const isNameValid = !name.trim().split('').some(char => symbols.includes(char));
        const isSurnameValid = !surname.trim().split('').some(char => symbols.includes(char));

        let emailValidation = {
            isValid: false,
            errorKey: ''
        };

        if (email.trim() === '') {
            emailValidation.errorKey = 'form.emailRequired';
        } else if (!emailRegex.test(email.trim())) {
            emailValidation.errorKey = 'form.emailInvalid';
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

        if (!infoValidation.areInfoValid || !birthRef.current.value) {
            toast.info(t('form.fillAll'));
            return;
        }

        setSending(true);
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
                    message: descrRef.current.value,
                    lang
                }),
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                if (response.status === 409) {
                    toast.error(t('form.slotTaken'));
                    navigate({ pathname: '/', hash: '#calendario' });
                    return;
                }
                console.error('API error:', response.status, errData);
                toast.error(t('form.apiError'));
                return;
            }

            const data = await response.json();

            if (data && data.success) {
                if (!data.emailSent) {
                    toast.info(t('form.noEmail'));
                }

                setName('');
                setSurname('');
                setPhone('');
                setEmail('');
                if (birthRef.current) birthRef.current.value = '';
                if (descrRef.current) descrRef.current.value = '';

                // Mostra il modale di riepilogo; la navigazione avviene alla chiusura
                setSuccessData({ name, date: selectedDate, bookingTime: selectedTime });
            }

        } catch (apiErr) {
            console.error('Errore API create-booking-event:', apiErr);
            toast.error(t('form.netError'));
        } finally {
            setSending(false);
        }
    };


    return (
        <>
        <main className={style.page}>
            <aside className={`${style.summary} rise`} style={{ '--i': 1 }}>
                <div>
                    <h2>{longLabel(selectedDate, locale)}, {selectedTime}</h2>
                    <p>{t('form.session')}</p>
                    <Link to={{ pathname: '/', hash: '#calendario' }} className={style.changeDate}>{t('form.change')}</Link>
                </div>
            </aside>

            <section className={style.formArea}>
                <h1 className="rise" style={{ '--i': 2 }}>{t('form.title')}</h1>
                <p className={`${style.intro} rise`} style={{ '--i': 3 }}>
                    {t('form.intro')}
                </p>

                <form onSubmit={handleSubmit} className={style.form}>
                    <div className={`${style.field} rise`} style={{ '--i': 4 }}>
                        <label htmlFor="name">{t('form.name')}</label>
                        <input type="text" id="name" name="name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="given-name" required />
                        {infoValidation.nameField && <span className={style.error}>{t('form.nameSymbols')}</span>}
                    </div>

                    <div className={`${style.field} rise`} style={{ '--i': 5 }}>
                        <label htmlFor="surname">{t('form.surname')}</label>
                        <input type="text" id="surname" name="surname" value={surname} onChange={(e) => setSurname(e.target.value)} autoComplete="family-name" required />
                        {infoValidation.surnameField && <span className={style.error}>{t('form.surnameSymbols')}</span>}
                    </div>

                    <div className={`${style.field} rise`} style={{ '--i': 6 }}>
                        <label htmlFor="birth">{t('form.birth')}</label>
                        <input type="date" id="birth" name="birth" ref={birthRef} autoComplete="bday" required />
                    </div>

                    <div className={`${style.field} ${style.phone} rise`} style={{ '--i': 7 }}>
                        <label htmlFor="phone-input">{t('form.phone')}</label>
                        <PhoneInput
                            id="phone-input"
                            value={phone}
                            onChange={setPhone}
                            defaultCountry="IT"
                            international={true}
                            countryCallingCodeEditable={false}
                            withCountryCallingCode
                        />
                        {phone === undefined && <span className={style.error}>{t('form.phoneInvalid')}</span>}
                    </div>

                    <div className={`${style.field} ${style.full} rise`} style={{ '--i': 8 }}>
                        <label htmlFor="email">{t('form.email')}</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onBlur={() => setEmailTouched(true)}
                            autoComplete="email"
                            required
                        />
                        {emailTouched && !infoValidation.emailField.isValid &&
                            <span className={style.error}>{t(infoValidation.emailField.errorKey)}</span>}
                    </div>

                    <div className={`${style.field} ${style.full} rise`} style={{ '--i': 9 }}>
                        <label htmlFor="description">{t('form.reason')}</label>
                        <textarea name="description" id="description" ref={descrRef} rows={2} required></textarea>
                    </div>

                    <div className={`${style.consent} rise`} style={{ '--i': 10 }}>
                        <input
                            type="checkbox"
                            id="term"
                            name="term"
                            checked={termsAccepted}
                            onChange={(e) => setTermsAccepted(e.target.checked)}
                        />
                        <label htmlFor="term">
                            {t('form.consentPre')}
                            <a
                                href="#"
                                onClick={(e) => { e.preventDefault(); setShowPrivacyModal(true); }}
                            >
                                {t('form.consentLink')}
                            </a>.
                        </label>
                    </div>

                    <button type="submit" className={`${style.send} rise`} style={{ '--i': 11 }} disabled={!termsAccepted || sending}>
                        {sending
                            ? <><FontAwesomeIcon icon={faSpinner} spin /> {t('form.sending')}</>
                            : t('form.send')}
                    </button>
                </form>
            </section>
        </main>

        <PrivacyModal
            show={showPrivacyModal}
            onClose={() => setShowPrivacyModal(false)}
            onAccept={() => {
                setTermsAccepted(true);
                setShowPrivacyModal(false);
            }}
        />

        <SuccessBookingModal
            show={!!successData}
            name={successData?.name}
            date={successData?.date}
            bookingTime={successData?.bookingTime}
            onClose={() => {
                setSuccessData(null);
                navigate('/');
            }}
        />
        </>
    );
};

export default FormPage;
