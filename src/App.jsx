import { BrowserRouter, Route, Routes } from "react-router-dom";
import AppLayout from "./layouts/AppLayout.jsx";
import HomePage from "./pages/HomePage.jsx";
import FormPage from "./pages/FormPage.jsx";
import AdminDashboardPage from "./pages/AdminDashboardPage.jsx";
import AuthCallback from "./components/AuthCallback.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import { supabase } from "./supabase/supabaseClient.js";
import { GlobalProvider } from "./context/GlobalContext.jsx";
import { useEffect, useState } from "react";

function App() {

    // Gestione dello stato di autenticazione per proteggere le rotte
    // conterrà l'oggetto della sessione dell'utente fornito da Supabase
    // se è loggato conterrà info sullo user (user.password, user.id, ...) sennò null
    const [session, setSession] = useState(null);

    useEffect(() => {
        // recuperare la sessione utente corrente da Supabase
        // funzione della libreria client di Supabase che cerca una sessione attiva
        supabase.auth.getSession()
            // callback che viene eseguito quando getSession() restituisce un risultato
            .then(({ data: { session } }) => {
                setSession(session);
            });

        // listener che rimane attivo per tutta la vita del componente
        // si attiva ogni volta che lo stato di autenticazione di Supabase cambia

        // quando lo stato di autenticazione di un utente cambia la callback fornita viene eseguita
        // subscription è un riferimento al listener che è stato creato, ed è cruciale per la pulizia
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, session) => {
                setSession(session);
            }
        );
        // funzione di "pulizia"
        // per rimuovere il listener dello stato di autenticazione
        // assicura che il listener non rimanga attivo e continui a consumare risorse dopo che il componente non è più visibile
        return () => subscription.unsubscribe();
    }, []);

    return (
        <GlobalProvider>
            <BrowserRouter>
                <Routes>
                    <Route element={<AppLayout />}>

                        {/* Rotta per login e autenticazione Google */}
                        <Route path="/login" element={<AuthPage />} />
                        {/* Rotta in cui l'utente viene reindirizzato dopo l'autenticazione con Google (o altri provider) */}
                        <Route path="/auth/callback" element={<AuthCallback />} />

                        {/* Rotta protetta per l'admin */}
                        <Route
                            path="/admin-dashboard"
                            element={session ? <AdminDashboardPage /> : <AuthPage />}
                        />

                        {/* Rotte principali */}
                        <Route path="/" element={<HomePage />} />
                        <Route path="/form/:date" element={<FormPage />} />

                    </Route>
                </Routes>
            </BrowserRouter>
        </GlobalProvider>
    );
};

export default App;