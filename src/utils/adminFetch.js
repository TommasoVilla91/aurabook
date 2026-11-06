import { auth } from '../firebaseClient';

// Come fetch, ma aggiunge l'ID token Firebase richiesto dagli endpoint admin.
export async function adminFetch(url, init = {}) {
    const token = await auth.currentUser?.getIdToken();
    return fetch(url, {
        ...init,
        headers: { ...init.headers, ...(token && { Authorization: `Bearer ${token}` }) },
    });
}
