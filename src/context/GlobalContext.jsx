import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../firebaseClient";
import { onAuthStateChanged, signOut } from "firebase/auth";

const GlobalContext = createContext();

function GlobalProvider({ children }) {

    // funzione per recuperare dal localStorage quello che l'utente ha scritto nel form
    const getUserInfo = () => {
        try {
            const userInfo = localStorage.getItem('userInfo');
            return userInfo ? JSON.parse(userInfo) : {};
        } catch (err) {
            console.error('Errore nel recupero dei dati dal localStorage:', err);
            return {};
        };
    };

    // Sessione Firebase Auth — disponibile in tutta l'app (Navbar, dashboard, ecc.)
    const [session, setSession] = useState(null);
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, setSession);
        return () => unsubscribe();
    }, []);

    const logout = () => signOut(auth);

    const providerValue = {
        getUserInfo,
        session,
        logout,
    }

    return <GlobalContext.Provider value={providerValue}>{children}</GlobalContext.Provider>
}

function useGlobalContext() {
    return useContext(GlobalContext)
}

export { GlobalProvider, useGlobalContext }