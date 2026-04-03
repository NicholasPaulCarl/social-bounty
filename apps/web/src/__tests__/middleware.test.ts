/**
 * Tests for Next.js middleware route protection.
 * Since the middleware uses NextRequest/NextResponse which aren't available in node test env,
 * we test the pure logic extracted from the middleware behavior.
 */

describe('Middleware Route Protection Logic', () => {
  // Replicate the middleware logic as pure functions for testability
  const PUBLIC_ROUTES = ['/login', '/signup', '/forgot-password', '/reset-password', '/verify-email'];
  const MARKETING_ROUTES = ['/', '/join', '/contact', '/how-it-works', '/privacy', '/terms'];
  const BUSINESS_ROUTES_PREFIX = '/business';
  const ADMIN_ROUTES_PREFIX = '/admin';
  const MY_DISPUTES_PREFIX = '/my-disputes';

  function getDashboardUrl(role: string): string {
    switch (role) {
      case 'BUSINESS_ADMIN': return '/business/dashboard';
      case 'SUPER_ADMIN': return '/admin/dashboard';
      default: return '/bounties';
    }
  }

  type RouteDecision =
    | { action: 'next' }
    | { action: 'redirect'; url: string };

  function evaluateRoute(
    pathname: string,
    userRole: string | null,
  ): RouteDecision {
    // Skip static assets
    if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.includes('.')) {
      return { action: 'next' };
    }

    // Marketing routes always accessible
    if (MARKETING_ROUTES.some(r => pathname === r || (r !== '/' && pathname.startsWith(r + '/')))) {
      return { action: 'next' };
    }

    // Public auth routes
    if (PUBLIC_ROUTES.some(r => pathname.startsWith(r))) {
      if (userRole) {
        return { action: 'redirect', url: getDashboardUrl(userRole) };
      }
      return { action: 'next' };
    }

    // Protected routes: no user → login
    if (!userRole) {
      return { action: 'redirect', url: `/login?returnTo=${encodeURIComponent(pathname)}` };
    }

    // Role-based access
    if (pathname.startsWith(ADMIN_ROUTES_PREFIX) && userRole !== 'SUPER_ADMIN') {
      return { action: 'redirect', url: getDashboardUrl(userRole) };
    }
    if (pathname.startsWith(BUSINESS_ROUTES_PREFIX) && userRole !== 'BUSINESS_ADMIN') {
      return { action: 'redirect', url: getDashboardUrl(userRole) };
    }
    if (pathname.startsWith(MY_DISPUTES_PREFIX) && userRole !== 'PARTICIPANT') {
      return { action: 'redirect', url: getDashboardUrl(userRole) };
    }
    if (pathname.includes('/submit') && userRole !== 'PARTICIPANT') {
      return { action: 'redirect', url: getDashboardUrl(userRole) };
    }

    return { action: 'next' };
  }

  describe('static assets bypass', () => {
    it('should pass through /_next routes', () => {
      expect(evaluateRoute('/_next/static/chunk.js', null)).toEqual({ action: 'next' });
    });

    it('should pass through /api routes', () => {
      expect(evaluateRoute('/api/v1/auth/login', null)).toEqual({ action: 'next' });
    });

    it('should pass through files with extensions', () => {
      expect(evaluateRoute('/favicon.ico', null)).toEqual({ action: 'next' });
    });
  });

  describe('marketing routes', () => {
    it.each(MARKETING_ROUTES)('should allow unauthenticated access to %s', (route) => {
      expect(evaluateRoute(route, null)).toEqual({ action: 'next' });
    });

    it.each(MARKETING_ROUTES)('should allow authenticated access to %s', (route) => {
      expect(evaluateRoute(route, 'PARTICIPANT')).toEqual({ action: 'next' });
    });

    it('should allow sub-routes of marketing pages', () => {
      expect(evaluateRoute('/how-it-works/details', null)).toEqual({ action: 'next' });
    });
  });

  describe('public auth routes', () => {
    it('should allow unauthenticated access to /login', () => {
      expect(evaluateRoute('/login', null)).toEqual({ action: 'next' });
    });

    it('should redirect authenticated PARTICIPANT from /login to /bounties', () => {
      expect(evaluateRoute('/login', 'PARTICIPANT')).toEqual({
        action: 'redirect',
        url: '/bounties',
      });
    });

    it('should redirect authenticated BUSINESS_ADMIN from /login to /business/dashboard', () => {
      expect(evaluateRoute('/login', 'BUSINESS_ADMIN')).toEqual({
        action: 'redirect',
        url: '/business/dashboard',
      });
    });

    it('should redirect authenticated SUPER_ADMIN from /signup to /admin/dashboard', () => {
      expect(evaluateRoute('/signup', 'SUPER_ADMIN')).toEqual({
        action: 'redirect',
        url: '/admin/dashboard',
      });
    });
  });

  describe('protected routes — unauthenticated', () => {
    it('should redirect to login with returnTo for /bounties', () => {
      expect(evaluateRoute('/bounties', null)).toEqual({
        action: 'redirect',
        url: '/login?returnTo=%2Fbounties',
      });
    });

    it('should redirect to login with returnTo for /inbox', () => {
      expect(evaluateRoute('/inbox', null)).toEqual({
        action: 'redirect',
        url: '/login?returnTo=%2Finbox',
      });
    });

    it('should redirect to login with returnTo for /wallet', () => {
      expect(evaluateRoute('/wallet', null)).toEqual({
        action: 'redirect',
        url: '/login?returnTo=%2Fwallet',
      });
    });

    it('should redirect to login with returnTo for /admin/dashboard', () => {
      expect(evaluateRoute('/admin/dashboard', null)).toEqual({
        action: 'redirect',
        url: '/login?returnTo=%2Fadmin%2Fdashboard',
      });
    });
  });

  describe('PARTICIPANT role access', () => {
    const role = 'PARTICIPANT';

    it('should allow /bounties', () => {
      expect(evaluateRoute('/bounties', role)).toEqual({ action: 'next' });
    });

    it('should allow /inbox', () => {
      expect(evaluateRoute('/inbox', role)).toEqual({ action: 'next' });
    });

    it('should allow /my-submissions', () => {
      expect(evaluateRoute('/my-submissions', role)).toEqual({ action: 'next' });
    });

    it('should allow /my-disputes', () => {
      expect(evaluateRoute('/my-disputes', role)).toEqual({ action: 'next' });
    });

    it('should allow /wallet', () => {
      expect(evaluateRoute('/wallet', role)).toEqual({ action: 'next' });
    });

    it('should allow /profile', () => {
      expect(evaluateRoute('/profile', role)).toEqual({ action: 'next' });
    });

    it('should allow /hunters', () => {
      expect(evaluateRoute('/hunters', role)).toEqual({ action: 'next' });
    });

    it('should allow bounty submission routes', () => {
      expect(evaluateRoute('/bounties/abc/submit', role)).toEqual({ action: 'next' });
    });

    it('should BLOCK /admin routes', () => {
      expect(evaluateRoute('/admin/dashboard', role)).toEqual({
        action: 'redirect',
        url: '/bounties',
      });
    });

    it('should BLOCK /business routes', () => {
      expect(evaluateRoute('/business/dashboard', role)).toEqual({
        action: 'redirect',
        url: '/bounties',
      });
    });
  });

  describe('BUSINESS_ADMIN role access', () => {
    const role = 'BUSINESS_ADMIN';

    it('should allow /business/dashboard', () => {
      expect(evaluateRoute('/business/dashboard', role)).toEqual({ action: 'next' });
    });

    it('should allow /business/bounties', () => {
      expect(evaluateRoute('/business/bounties', role)).toEqual({ action: 'next' });
    });

    it('should allow /inbox', () => {
      expect(evaluateRoute('/inbox', role)).toEqual({ action: 'next' });
    });

    it('should allow /hunters', () => {
      expect(evaluateRoute('/hunters', role)).toEqual({ action: 'next' });
    });

    it('should BLOCK /admin routes', () => {
      expect(evaluateRoute('/admin/dashboard', role)).toEqual({
        action: 'redirect',
        url: '/business/dashboard',
      });
    });

    it('should BLOCK /my-disputes (participant only)', () => {
      expect(evaluateRoute('/my-disputes', role)).toEqual({
        action: 'redirect',
        url: '/business/dashboard',
      });
    });

    it('should BLOCK /submit routes (participant only)', () => {
      expect(evaluateRoute('/bounties/abc/submit', role)).toEqual({
        action: 'redirect',
        url: '/business/dashboard',
      });
    });
  });

  describe('SUPER_ADMIN role access', () => {
    const role = 'SUPER_ADMIN';

    it('should allow /admin/dashboard', () => {
      expect(evaluateRoute('/admin/dashboard', role)).toEqual({ action: 'next' });
    });

    it('should allow /admin/users', () => {
      expect(evaluateRoute('/admin/users', role)).toEqual({ action: 'next' });
    });

    it('should allow /admin/audit-logs', () => {
      expect(evaluateRoute('/admin/audit-logs', role)).toEqual({ action: 'next' });
    });

    it('should allow /inbox', () => {
      expect(evaluateRoute('/inbox', role)).toEqual({ action: 'next' });
    });

    it('should BLOCK /business routes', () => {
      expect(evaluateRoute('/business/dashboard', role)).toEqual({
        action: 'redirect',
        url: '/admin/dashboard',
      });
    });

    it('should BLOCK /my-disputes', () => {
      expect(evaluateRoute('/my-disputes', role)).toEqual({
        action: 'redirect',
        url: '/admin/dashboard',
      });
    });
  });

  describe('getDashboardUrl', () => {
    it('should return /bounties for PARTICIPANT', () => {
      expect(getDashboardUrl('PARTICIPANT')).toBe('/bounties');
    });

    it('should return /business/dashboard for BUSINESS_ADMIN', () => {
      expect(getDashboardUrl('BUSINESS_ADMIN')).toBe('/business/dashboard');
    });

    it('should return /admin/dashboard for SUPER_ADMIN', () => {
      expect(getDashboardUrl('SUPER_ADMIN')).toBe('/admin/dashboard');
    });

    it('should default to /bounties for unknown role', () => {
      expect(getDashboardUrl('UNKNOWN')).toBe('/bounties');
    });
  });
});
