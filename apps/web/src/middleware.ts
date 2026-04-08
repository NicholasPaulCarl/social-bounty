import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_ROUTES = ['/login', '/signup'];
const MARKETING_ROUTES = ['/', '/join', '/contact', '/how-it-works', '/privacy', '/terms'];
const BUSINESS_ROUTES_PREFIX = '/business';
const ADMIN_ROUTES_PREFIX = '/admin';
const MY_DISPUTES_PREFIX = '/my-disputes';

function decodeTokenPayload(token: string): { sub: string; role: string; email: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    return payload;
  } catch {
    return null;
  }
}

function getDashboardUrl(role: string): string {
  switch (role) {
    case 'BUSINESS_ADMIN':
      return '/business/dashboard';
    case 'SUPER_ADMIN':
      return '/admin/dashboard';
    default:
      return '/bounties';
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') // static files
  ) {
    return NextResponse.next();
  }

  // Read auth indicator cookie (set by client on login)
  const authCookie = request.cookies.get('sb_auth_role')?.value;
  const user = authCookie ? { role: authCookie } : null;

  // Marketing routes: always accessible, logged-in users see dashboard link in nav
  if (MARKETING_ROUTES.some((route) => pathname === route || (route !== '/' && pathname.startsWith(route + '/')))) {
    return NextResponse.next();
  }

  // Public auth routes: redirect authenticated users to dashboard
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    if (user) {
      return NextResponse.redirect(new URL(getDashboardUrl(user.role), request.url));
    }
    return NextResponse.next();
  }

  // Protected routes: redirect unauthenticated users
  if (!user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('returnTo', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Role-based access
  if (pathname.startsWith(ADMIN_ROUTES_PREFIX) && user.role !== 'SUPER_ADMIN') {
    return NextResponse.redirect(new URL(getDashboardUrl(user.role), request.url));
  }

  if (pathname.startsWith(BUSINESS_ROUTES_PREFIX) && user.role !== 'BUSINESS_ADMIN') {
    return NextResponse.redirect(new URL(getDashboardUrl(user.role), request.url));
  }

  // Dispute route protection
  if (pathname.startsWith(MY_DISPUTES_PREFIX) && user.role !== 'PARTICIPANT') {
    return NextResponse.redirect(new URL(getDashboardUrl(user.role), request.url));
  }

  // Participant-only routes (submit proof)
  if (pathname.includes('/submit') && user.role !== 'PARTICIPANT') {
    return NextResponse.redirect(new URL(getDashboardUrl(user.role), request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
