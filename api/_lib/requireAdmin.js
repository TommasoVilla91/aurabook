import { createRemoteJWKSet, jwtVerify } from 'jose';

const FIREBASE_JWKS_URL = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';

let remoteJwks;
const defaultJwks = () => {
  remoteJwks ??= createRemoteJWKSet(new URL(FIREBASE_JWKS_URL));
  return remoteJwks;
};

const readConfig = () => {
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
  const emails = (process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return { projectId, emails };
};

/**
 * Verifica un ID token Firebase e che l'account sia nella lista degli admin.
 * Una firma valida non basta: se la registrazione è abilitata su Firebase, chiunque può
 * creare un account e ottenere un token valido.
 *
 * @returns {Promise<{ ok: true, email: string } | { ok: false, status: number, error: string }>}
 */
export async function verifyAdminToken(token, { jwks = defaultJwks(), config = readConfig() } = {}) {
  const { projectId, emails } = config;
  if (!projectId || emails.length === 0) {
    return { ok: false, status: 500, error: 'Admin auth not configured' };
  }
  if (!token) return { ok: false, status: 401, error: 'Unauthorized' };

  try {
    const { payload } = await jwtVerify(token, jwks, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
      algorithms: ['RS256'],
    });
    const email = typeof payload.email === 'string' ? payload.email.toLowerCase() : '';
    if (!payload.sub || !email || !emails.includes(email)) {
      return { ok: false, status: 403, error: 'Forbidden' };
    }
    return { ok: true, email };
  } catch {
    return { ok: false, status: 401, error: 'Unauthorized' };
  }
}

/** Guardia per gli endpoint admin: risponde 401/403 e ritorna false se la richiesta non è autorizzata. */
export async function requireAdmin(req, res) {
  if (req.method === 'OPTIONS') return true;
  const header = req.headers?.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const result = await verifyAdminToken(token);
  if (!result.ok) {
    res.status(result.status).json({ error: result.error });
    return false;
  }
  return true;
}
