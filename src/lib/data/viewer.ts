import 'server-only';

import { getAccessToken } from '@/lib/auth/session';
import { SignedOutError, select } from './rest';

export type Viewer = { id: string; fullName: string; role: 'lead' | 'specialist'; email: string };

/** The signed-in person, or null. PostgREST verifies the token on the lookup. */
export async function getViewer(): Promise<Viewer | null> {
  const token = await getAccessToken();
  if (!token) return null;

  let claims: { sub?: string; email?: string };
  try {
    claims = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
  } catch {
    return null;
  }
  if (!claims.sub) return null;

  try {
    const [person] = await select<{ id: string; full_name: string; role: Viewer['role'] }>(
      `people?select=id,full_name,role&id=eq.${encodeURIComponent(claims.sub)}`,
    );
    return person
      ? { id: person.id, fullName: person.full_name, role: person.role, email: claims.email ?? '' }
      : null;
  } catch (error) {
    if (error instanceof SignedOutError) return null;
    throw error;
  }
}
