import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {supabase} from '../supabase/supabaseClient';

function AuthCallback() { 

    const navigate = useNavigate();

    // La sottoscrizione al cambio di stato dell'autenticazione
    useEffect(() => {

         // subscription = listener fondamentale
         // supabase.auth.onAuthStateChange rileva quando la sessione è stata creata o ripristinata dopo il redirect OAuth. 
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, session) => {

                if (event === 'SIGNED_IN' && session) {
                    navigate('/admin-dashboard');
                    
                } else if (event === 'SIGNED_OUT') {
                    navigate('/login');
                }
            }
        );

        // Pulizia: rimuovi il listener quando il componente si smonta
        return () => subscription.unsubscribe();

    }, [navigate]); // navigate è una dipendenza, sebbene stabile

    return (
        <div style={{ textAlign: 'center', padding: '50px' }}>
            <p>Caricamento...</p>
        </div>
    );
}

export default AuthCallback;