import { NextResponse, type NextRequest } from 'next/server';

import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  REFRESH_MAX_AGE,
  cookieOptions,
  expiresWithin,
  refreshSession,
} from '@/lib/auth/tokens';

// Server Components cannot write cookies, so the access token is renewed here,
// before rendering. The refreshed token is also passed on to this request.
export async function proxy(request: NextRequest) {
  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
  if (!refreshToken || (accessToken && !expiresWithin(accessToken, 60))) {
    return NextResponse.next();
  }

  const tokens = await refreshSession(refreshToken);
  if (!tokens) {
    request.cookies.delete(ACCESS_COOKIE);
    request.cookies.delete(REFRESH_COOKIE);
    const response = NextResponse.next({ request });
    response.cookies.delete(ACCESS_COOKIE);
    response.cookies.delete(REFRESH_COOKIE);
    return response;
  }

  request.cookies.set(ACCESS_COOKIE, tokens.accessToken);
  request.cookies.set(REFRESH_COOKIE, tokens.refreshToken);
  const response = NextResponse.next({ request });
  response.cookies.set(ACCESS_COOKIE, tokens.accessToken, cookieOptions(tokens.expiresIn));
  response.cookies.set(REFRESH_COOKIE, tokens.refreshToken, cookieOptions(REFRESH_MAX_AGE));
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
