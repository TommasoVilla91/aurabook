import styles from './AuthPage.module.css';
import { auth } from '../firebaseClient.js';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';


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
            alert(error.message);
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
            alert('Errore con Google login: ' + error.message);
            setLoading(false);
        }
    };


    return (
        <div className={styles.background}>
            <div className={styles.loginArea}>
                <form
                    className={styles.loginBox}
                    onSubmit={handleLogin}
                >

                    <div className={styles.user}>
                        <label htmlFor="">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className={styles.password}>
                        <label htmlFor="">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button
                        className={styles.loginBtn}
                        type='submit'
                        disabled={loading}
                    >
                        Accedi
                    </button>
                </form>

                <button
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className={styles.googleBtn}>
                    {loading ? 'Caricamento...' : 'Accedi con Google'}
                </button>

            </div>
        </div>
    );
};

export default LoginPage;
