import { useCallback, useEffect, useMemo, useState } from 'react';
import { LanguageContext } from './LanguageContext';
import { LOCALES, MESSAGES } from './messages';

const STORAGE_KEY = 'lang';

const readStoredLang = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored in MESSAGES ? stored : 'it';
    } catch {
        return 'it';
    }
};

export default function LanguageProvider({ children }) {
    const [lang, setLangState] = useState(readStoredLang);

    useEffect(() => {
        document.documentElement.lang = lang;
    }, [lang]);

    const setLang = useCallback((next) => {
        if (!(next in MESSAGES)) return;
        setLangState(next);
        try {
            localStorage.setItem(STORAGE_KEY, next);
        } catch {
            // localStorage non disponibile: la lingua vale solo per questa sessione
        }
    }, []);

    const value = useMemo(() => {
        const t = (key, params) => {
            const entry = MESSAGES[lang][key] ?? MESSAGES.it[key] ?? key;
            return typeof entry === 'function' ? entry(params) : entry;
        };
        return { lang, setLang, t, locale: LOCALES[lang] };
    }, [lang, setLang]);

    return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
