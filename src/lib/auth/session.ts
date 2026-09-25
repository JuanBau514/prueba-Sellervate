import 'server-only';

import { cookies } from 'next/headers';

import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  REFRESH_MAX_AGE,
  cookieOptions,
  signInWithPassword,
} from './tokens';

export async function getAccessToken(): Promise<string | null> {
  return (await cookies()).get(ACCESS_COOKIE)?.value ?? null;
}

/**
 * Simulated login, real session: the server signs in with the shared demo
 * password, so Postgres sees the chosen user's auth.uid(). Only callable from
 * Server Actions or Route Handlers, where cookies can be written.
 */
export async function signInAs(email: string): Promise<boolean> {
  const password = process.env.DEMO_PASSWORD;
  if (!password) throw new Error('DEMO_PASSWORD must be set in .env.local');

  const tokens = await signInWithPassword(email, password);
  if (!tokens) return false;

  const store = await cookies();
  store.set(ACCESS_COOKIE, tokens.accessToken, cookieOptions(tokens.expiresIn));
  store.set(REFRESH_COOKIE, tokens.refreshToken, cookieOptions(REFRESH_MAX_AGE));
  return true;
}

export async function clearSession() {
  const store = await cookies();
  store.delete(ACCESS_COOKIE);
  store.delete(REFRESH_COOKIE);
}
