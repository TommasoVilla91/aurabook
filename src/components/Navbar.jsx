import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLock } from "@fortawesome/free-solid-svg-icons";
import styles from "./Navbar.module.css";
import { useGlobalContext } from "../context/GlobalContext";
import { useLanguage } from "../i18n/useLanguage";

const LANGS = [
    { code: 'it', label: 'ITA', name: 'Italiano' },
    { code: 'en', label: 'ENG', name: 'English' },
];

// L'area riservata è solo in italiano: lì lo switch non ha effetto
const STAFF_PATHS = ['/login', '/admin-dashboard', '/auth/callback'];

function Navbar() {
    const { session, logout } = useGlobalContext();
    const { lang, setLang, t } = useLanguage();
    const { pathname } = useLocation();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    const showLangSwitch = !STAFF_PATHS.includes(pathname);

    return (
        <header className={styles.navbar}>
            <div className={styles.inner}>
                <Link to="/" className={styles.brand}>
                    <i className={styles.logo} />
                    <span>Francesco<span className={styles.brandRest}> Massoterapista</span></span>
                </Link>
                <nav className={styles.nav} aria-label={t('nav.main')}>
                    <NavLink to="/" end className={styles.link}>{t('nav.home')}</NavLink>
                    <Link to={{ pathname: '/', hash: '#calendario' }} className={`${styles.solid}${session ? ` ${styles.hideSm}` : ''}`}>{t('nav.book')}</Link>
                    <span className={styles.sep} aria-hidden="true" />
                    {showLangSwitch && (
                        <div className={styles.lang} role="group" aria-label={t('nav.language')}>
                            {LANGS.map(({ code, label, name }, i) => (
                                <span key={code} className={styles.langItem}>
                                    {i > 0 && <span className={styles.langDash} aria-hidden="true">-</span>}
                                    <button
                                        type="button"
                                        lang={code}
                                        className={`${styles.langBtn}${lang === code ? ` ${styles.langOn}` : ''}`}
                                        aria-pressed={lang === code}
                                        aria-label={name}
                                        onClick={() => setLang(code)}
                                    >
                                        {label}
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}
                    {session ? (
                        <>
                            <NavLink to="/admin-dashboard" className={styles.reserved}>{t('nav.dashboard')}</NavLink>
                            <button type="button" className={styles.logoutBtn} onClick={handleLogout}>{t('nav.logout')}</button>
                        </>
                    ) : (
                        <NavLink to="/login" className={styles.reserved} aria-label={t('nav.reserved')}>
                            <FontAwesomeIcon icon={faLock} />
                            <span>{t('nav.reserved')}</span>
                        </NavLink>
                    )}
                </nav>
            </div>
        </header>
    );
};

export default Navbar;
