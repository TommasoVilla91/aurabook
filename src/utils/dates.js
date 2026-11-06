const pad = (n) => String(n).padStart(2, '0');

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export const toDateStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const parseDate = (s) => {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d);
};

export const longLabel = (s, locale = 'it-IT') =>
    cap(parseDate(s).toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' }));

export const fullDateLabel = (s, locale = 'it-IT') =>
    parseDate(s).toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

export const weekdayShort = (s, locale = 'it-IT') =>
    parseDate(s).toLocaleDateString(locale, { weekday: 'short' }).replace('.', '');

export const weekdayHeaders = (locale = 'it-IT') =>
    Array.from({ length: 7 }, (_, i) => weekdayShort(toDateStr(new Date(2024, 0, 1 + i)), locale));

export const monthTitle = (year, month, locale = 'it-IT') =>
    cap(new Date(year, month, 1).toLocaleDateString(locale, { month: 'long', year: 'numeric' }));

export const nextOpenDays = (count) => {
    const days = [];
    const cursor = new Date();
    cursor.setHours(0, 0, 0, 0);
    while (days.length < count) {
        if (cursor.getDay() !== 0) days.push(toDateStr(cursor));
        cursor.setDate(cursor.getDate() + 1);
    }
    return days;
};

export const monthCells = (year, month) => {
    const offset = (new Date(year, month, 1).getDay() + 6) % 7;
    const total = new Date(year, month + 1, 0).getDate();
    const cells = Array.from({ length: offset }, () => null);
    for (let day = 1; day <= total; day++) cells.push(toDateStr(new Date(year, month, day)));
    return cells;
};
