import { createContext, useCallback, useContext, useState } from "react";

const GlobalContext = createContext();

function GlobalProvider({ children }) {
    
    const [events, setEvents] = useState([]);


    // aggiunge nuovo evento
    const addEvent = useCallback((newEvent) => {
        setEvents(prev => [...prev, newEvent])
    }, []);

    // impostare tutti gli eventi 
    const setAllEvents = useCallback((newEventsArray) => {
        setEvents(newEventsArray);
    }, []);

    const providerValue = {
        events, // L'array di eventi
        addEvent, // Funzione per aggiungere un evento
        setAllEvents // Funzione per impostare tutti gli eventi (utile per il caricamento iniziale)
    }

    return <GlobalContext.Provider value={providerValue}>{children}</GlobalContext.Provider>
}

function useGlobalContext() {
    return useContext(GlobalContext)
}

export { GlobalProvider, useGlobalContext }