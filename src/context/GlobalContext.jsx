import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { auth } from "../firebaseClient";
import { onAuthStateChanged, signOut } from "firebase/auth";

const GlobalContext = createContext();

function GlobalProvider({ children }) {

    // useCallback: la funzione è stabile tra i render — i consumer non si re-renderizzano
    // solo perché GlobalProvider si ri-monta (es. cambio di session)
    const getUserInfo = useCallback(() => {
        try {
            const userInfo = localStorage.getItem('userInfo');
            return userInfo ? JSON.parse(userInfo) : {};
        } catch (err) {
            console.error('Errore nel recupero dei dati dal localStorage:', err);
            return {};
        }
    }, []);

    // Sessione Firebase Auth — disponibile in tutta l'app (Navbar, dashboard, ecc.)
    const [session, setSession] = useState(null);
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, setSession);
        return () => unsubscribe();
    }, []);

    // useCallback: logout non dipende da nulla, è stabile per tutta la vita del provider
    const logout = useCallback(() => signOut(auth), []);

    // useMemo: evita di ricreare l'oggetto value a ogni render del provider quando
    // getUserInfo e logout non cambiano (cambierà solo quando session cambia)
    const providerValue = useMemo(() => ({
        getUserInfo,
        session,
        logout,
    }), [getUserInfo, session, logout]);

    return <GlobalContext.Provider value={providerValue}>{children}</GlobalContext.Provider>;
}

function useGlobalContext() {
    return useContext(GlobalContext);
}

export { GlobalProvider, useGlobalContext };
