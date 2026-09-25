import 'server-only';

import { getAccessToken } from '@/lib/auth/session';
import { supabaseConfig } from '@/lib/auth/tokens';

export class SignedOutError extends Error {
  constructor() {
    super('No valid session');
  }
}

/**
 * Reads from PostgREST as the signed-in user. The anon key identifies the
 * project; the user's JWT is what RLS evaluates. The service role is never
 * used here.
 */
export async function select<T>(path: string): Promise<T[]> {
  const token = await getAccessToken();
  if (!token) throw new SignedOutError();

  const { url, anonKey } = supabaseConfig();
  const response = await fetch(`${url}/rest/v1/${path}`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (response.status === 401) throw new SignedOutError();
  if (!response.ok) {
    throw new Error(`Data request failed (${response.status}): ${await response.text()}`);
  }
  return (await response.json()) as T[];
}

export type RpcResult<T> = { ok: true; data: T } | { ok: false; status: number; code: string; message: string };

/**
 * Calls a Postgres function as the signed-in user. Errors are returned, not
 * thrown, so callers can turn database codes into interface copy.
 */
export async function rpc<T>(fn: string, args: object): Promise<RpcResult<T>> {
  const token = await getAccessToken();
  if (!token) throw new SignedOutError();

  const { url, anonKey } = supabaseConfig();
  const response = await fetch(`${url}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: { apikey: anonKey, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
    cache: 'no-store',
  });
  if (response.status === 401) throw new SignedOutError();
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    return { ok: false, status: response.status, code: body?.code ?? '', message: body?.message ?? '' };
  }
  return { ok: true, data: body as T };
}
