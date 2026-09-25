import 'server-only';

// Talks to Supabase Auth (GoTrue) with the public anon key only. Shared by the
// session helpers and by src/proxy.ts, so it must not depend on next/headers.

export const ACCESS_COOKIE = 'sv-access-token';
export const REFRESH_COOKIE = 'sv-refresh-token';

export type TokenPair = { accessToken: string; refreshToken: string; expiresIn: number };

export function supabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set in .env.local');
  }
  return { url, anonKey };
}

async function requestTokens(grant: 'password' | 'refresh_token', body: object): Promise<TokenPair | null> {
  const { url, anonKey } = supabaseConfig();
  const response = await fetch(`${url}/auth/v1/token?grant_type=${grant}`, {
    method: 'POST',
    headers: { apikey: anonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  if (!response.ok) return null;
  const data = (await response.json()) as { access_token: string; refresh_token: string; expires_in: number };
  return { accessToken: data.access_token, refreshToken: data.refresh_token, expiresIn: data.expires_in };
}

export function signInWithPassword(email: string, password: string) {
  return requestTokens('password', { email, password });
}

export function refreshSession(refreshToken: string) {
  return requestTokens('refresh_token', { refresh_token: refreshToken });
}

/** Reads `exp` without verifying: only used to decide when to refresh. PostgREST verifies every request. */
export function expiresWithin(accessToken: string, seconds: number): boolean {
  try {
    const payload = JSON.parse(Buffer.from(accessToken.split('.')[1], 'base64url').toString()) as { exp?: number };
    return !payload.exp || payload.exp * 1000 - Date.now() < seconds * 1000;
  } catch {
    return true;
  }
}

export function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge,
  };
}

// Refresh tokens outlive the access token; a week covers a demo session.
export const REFRESH_MAX_AGE = 60 * 60 * 24 * 7;
