import { useEffect, useState } from 'react';

const fetchSlots = async (dates) => {
    const failed = Object.fromEntries(dates.map((d) => [d, null]));
    try {
        const res = await fetch('/api/get-month-availability', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ dates }),
        });
        if (!res.ok) return failed;
        const data = await res.json();
        if (!data || typeof data.slots !== 'object') return failed;
        return Object.fromEntries(dates.map((d) => [d, Array.isArray(data.slots[d]) ? data.slots[d] : null]));
    } catch {
        return failed;
    }
};

export function useAvailability(dates) {
    const [state, setState] = useState({ dates: null, slots: {} });

    useEffect(() => {
        if (!dates.length) {
            setState({ dates, slots: {} });
            return undefined;
        }
        let cancelled = false;
        fetchSlots(dates).then((slots) => {
            if (!cancelled) setState({ dates, slots });
        });
        return () => { cancelled = true; };
    }, [dates]);

    return { loading: state.dates !== dates, slots: state.slots };
}
