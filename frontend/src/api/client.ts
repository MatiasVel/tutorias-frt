/**
 * Cliente HTTP.
 * - El access token vive SOLO en memoria (nunca en localStorage: lo protege de XSS persistente).
 * - El refresh token viaja en una cookie httpOnly que JavaScript no puede leer.
 * - Ante un 401 se intenta renovar la sesión una vez y se reintenta la petición.
 */
const BASE = import.meta.env.VITE_API_URL ?? '/api';

let accessToken: string | null = null;
let refreshing: Promise<boolean> | null = null;
let onSessionExpired: (() => void) | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}
export function setSessionExpiredHandler(fn: () => void) {
  onSessionExpired = fn;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function refreshSession(): Promise<{ accessToken: string; user: unknown } | null> {
  const res = await fetch(`${BASE}/auth/refresh`, { method: 'POST', credentials: 'include' });
  if (!res.ok) return null;
  const data = await res.json();
  accessToken = data.accessToken;
  return data;
}

async function tryRefresh(): Promise<boolean> {
  if (!refreshing) {
    refreshing = refreshSession()
      .then((d) => !!d)
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
}

async function parseError(res: Response): Promise<ApiError> {
  let msg = 'Ocurrió un error inesperado';
  try {
    const body = await res.json();
    msg = Array.isArray(body.message) ? body.message.join('. ') : (body.message ?? msg);
  } catch {
    /* respuesta sin JSON */
  }
  if (res.status === 429) msg = 'Demasiados intentos. Esperá un minuto y probá de nuevo.';
  return new ApiError(res.status, msg);
}

export async function rawRequest(path: string, init: RequestInit = {}, retry = true): Promise<Response> {
  const headers = new Headers(init.headers);
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
  if (init.body && !(init.body instanceof FormData)) headers.set('Content-Type', 'application/json');

  const res = await fetch(`${BASE}${path}`, { ...init, headers, credentials: 'include' });

  if (res.status === 401 && retry && !path.startsWith('/auth/')) {
    if (await tryRefresh()) return rawRequest(path, init, false);
    accessToken = null;
    onSessionExpired?.();
  }
  if (!res.ok) throw await parseError(res);
  return res;
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await rawRequest(path, init);
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const json = (data: unknown) => JSON.stringify(data);
