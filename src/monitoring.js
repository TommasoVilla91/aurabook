const dsn = import.meta.env.VITE_SENTRY_DSN;

const EMAIL_RE = /[^\s@]+@[^\s@]+\.[^\s@]+/g;
const PHONE_RE = /\+?\d[\d\s().-]{7,}\d/g;

const scrubText = (value) =>
    typeof value === 'string' ? value.replace(EMAIL_RE, '[email]').replace(PHONE_RE, '[phone]') : value;

const stripQuery = (url) => (typeof url === 'string' ? url.split(/[?#]/)[0] : url);

// Gli utenti compilano dati personali e sanitari: a Sentry devono arrivare solo stack trace e contesto tecnico.
export function scrubEvent(event) {
    delete event.user;
    if (event.request) {
        delete event.request.cookies;
        delete event.request.headers;
        delete event.request.data;
        delete event.request.query_string;
        event.request.url = stripQuery(event.request.url);
    }
    event.message = scrubText(event.message);
    event.exception?.values?.forEach((v) => {
        v.value = scrubText(v.value);
    });
    event.breadcrumbs = event.breadcrumbs
        ?.filter((b) => b.category !== 'console')
        .map((b) => ({
            ...b,
            message: scrubText(b.message),
            data: b.data?.url ? { ...b.data, url: stripQuery(b.data.url) } : undefined,
        }));
    return event;
}

export function initMonitoring() {
    if (!dsn) return;
    import('@sentry/react').then((Sentry) => {
        Sentry.init({
            dsn,
            environment: import.meta.env.MODE,
            sendDefaultPii: false,
            tracesSampleRate: 0,
            allowUrls: [window.location.origin],
            beforeSend: scrubEvent,
        });
    });
}

export function reportError(error) {
    if (!dsn) return;
    import('@sentry/react').then((Sentry) => Sentry.captureException(error));
}
