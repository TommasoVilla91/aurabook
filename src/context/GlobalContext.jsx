import { createContext, useCallback, useContext, useState } from "react";
import { supabase } from '../../supabase/supabaseClient';

const GlobalContext = createContext();

function GlobalProvider({ children }) {

    // funzione per recuperare dal localStorage quello che l'utente ha scritto nel form
    const getUserInfo = () => {
        try {
            const userInfo = localStorage.getItem('userInfo');
            return userInfo ? JSON.parse(userInfo) : {};

        } catch (err) {
            console.error('Errore nel recuper dei dati dal localStorage:', err);
            return {};
        };
    };

    // ===========================================
    // MODALE
    // ===========================================


    const providerValue = {
        getUserInfo,
    }

    return <GlobalContext.Provider value={providerValue}>{children}</GlobalContext.Provider>
}

function useGlobalContext() {
    return useContext(GlobalContext)
}

export { GlobalProvider, useGlobalContext }