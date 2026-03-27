const TOAST_EVENT = 'aurabook:toast';

export const toast = {
    success: (message) =>
        window.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail: { message, type: 'success' } })),
    error: (message) =>
        window.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail: { message, type: 'error' } })),
    info: (message) =>
        window.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail: { message, type: 'info' } })),
};
