import styles from './AuthPage.module.css';
import AuthCallback from '../components/AuthCallback';
import { supabase } from "../../supabase/supabaseClient.js";
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';


function LoginPage() {

    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();


    // Funzione per accesso normale
    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);

        const { error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
            alert(error.message);
        } else {
            alert('Accesso riuscito!');
            navigate('/admin-dashboard'); // Reindirizza l'admin alla dashboard
        }
        setLoading(false);
    }

    // Funzione per l'accesso con Google
    const handleGoogleLogin = async () => {

        // operazione login in corso
        setLoading(true);

        // avviamento processo autenticazione OAuth con Google
        // funzione signInWithOAuth restitusce un oggetto con chiave error
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                // Indicare a Google dove reindirizzare l'utente dopo l'autenticazione
                // dopo il login con Google, l'utente sarà reindirizzato in una pagina momentanea che gestirà il caricamento quando questo sarà lento
                redirectTo: window.location.origin + '/auth/callback',
            },
        });
        if (error) {
            alert('Errore con Google login: ' + error.message);
            setLoading(false);
        }
        // dopo il reindirizzamento da Google, Supabase gestirà la sessione
        // non c'è un `else` perché il browser farà un redirect
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