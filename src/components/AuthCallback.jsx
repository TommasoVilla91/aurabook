import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../src/firebaseClient.js';
import { onAuthStateChanged } from 'firebase/auth';

function AuthCallback() {

    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                navigate('/admin-dashboard');
            } else {
                navigate('/login');
            }
        });
        return () => unsubscribe();
    }, [navigate]);

    return (
        <div style={{ textAlign: 'center', padding: '50px' }}>
            <p>Caricamento...</p>
        </div>
    );
}

export default AuthCallback;
