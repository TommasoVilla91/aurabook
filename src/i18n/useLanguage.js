import { useContext } from 'react';
import { LanguageContext } from './LanguageContext';

export function useLanguage() {
    const ctx = useContext(LanguageContext);
    if (!ctx) throw new Error('useLanguage va usato dentro LanguageProvider');
    return ctx;
}
