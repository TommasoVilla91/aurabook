import styles from './AuthPage.module.css';
import { auth } from '../firebaseClient.js';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { toast } from '../utils/toast';


function LoginPage() {

    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
            navigate('/admin-dashboard');
        } catch (error) {
            toast.error('Accesso non riuscito: ' + error.message);
        }
        setLoading(false);
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
            navigate('/admin-dashboard');
        } catch (error) {
            toast.error('Errore con Google login: ' + error.message);
            setLoading(false);
        }
    };

    return (
        <main className={styles.page}>
            <section className={`${styles.card} rise`} style={{ '--i': 1 }}>
                <div className={`${styles.arch} rise`} style={{ '--i': 2 }} aria-hidden="true" />
                <h1 className="rise" style={{ '--i': 3 }}>Area riservata</h1>
                <p className="rise" style={{ '--i': 4 }}>Accedi per gestire prenotazioni, orari e ferie.</p>

                <form className={`${styles.form} rise`} style={{ '--i': 5 }} onSubmit={handleLogin}>
                    <div className={styles.field}>
                        <label htmlFor="login-email">Email</label>
                        <input
                            id="login-email"
                            type="email"
                            autoComplete="username"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className={styles.field}>
                        <label htmlFor="login-password">Password</label>
                        <input
                            id="login-password"
                            type="password"
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button className={styles.loginBtn} type="submit" disabled={loading}>
                        {loading ? <><FontAwesomeIcon icon={faSpinner} spin /> Accesso in corso</> : 'Accedi'}
                    </button>
                </form>

                <span className={styles.or} aria-hidden="true">oppure</span>

                <button
                    className={styles.googleBtn}
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={loading}
                >
                    Accedi con Google
                </button>
            </section>
        </main>
    );
};

export default LoginPage;
