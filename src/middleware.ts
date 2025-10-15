import { NextRequest, NextResponse } from 'next/server';

// Simple page RBAC map using role names resolved via Better Auth heuristics on the server
// Middleware remains minimal: it only checks for presence of session cookie; page-level
// role gating is implemented in server components/layouts for precision.
// If desired, uncomment and tighten here.
const PAGE_ROLE_MAP: Array<{ pattern: RegExp; roles: string[] }> = [
  // { pattern: /^\/organizations(\/.*)?$/, roles: ['platform_admin', 'manager'] },
  // { pattern: /^\/campaigns(\/.*)?$/, roles: ['platform_admin', 'manager', 'educator'] },
  // { pattern: /^\/projects(\/.*)?$/, roles: ['platform_admin', 'manager', 'educator'] },
];

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  console.log(`🔒 Middleware: ${pathname}`);

  // Skip middleware for static files and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    console.log(`✅ Skipping middleware for static file or api route: ${pathname}`);
    return NextResponse.next();
  }

  // Public routes that don't require auth
  const publicRoutes = ['/login', '/register'];
  
  // Learner-specific public routes (landing, register, login)
  const learnerPublicRoutes = [
    '/learner',
    '/learner/register', 
    '/learner/login',
  ];
  
  // Check if it's a public route or learner public route
  const isPublicRoute = publicRoutes.some(route => pathname === route) || pathname === '/';
  const isLearnerPublicRoute = learnerPublicRoutes.some(route => pathname === route);

  if (isPublicRoute || isLearnerPublicRoute) {
    console.log(`✅ Skipping middleware for public route: ${pathname}`);
    return NextResponse.next();
  }

  // For protected routes, check if user has a session token
  // Better-auth is setting 'better-auth.session_token' based on the logs
  const sessionToken = request.cookies.get('better-auth.session_token')?.value ||
                      request.cookies.get('better-auth.session')?.value ||
                      request.cookies.get('session')?.value ||
                      request.headers.get('authorization')?.replace('Bearer ', '');

  console.log(`Auth check for ${pathname}:`, {
    hasSession: !!sessionToken,
    sessionTokenFound: sessionToken ? 'found' : 'not found',
    cookieCount: request.cookies.getAll().length,
    cookies: request.cookies.getAll().map(c => `${c.name}=${c.value.substring(0, 10)}...`)
  });

  if (!sessionToken) {
    // Redirect learner routes to learner login, everything else to admin login
    const isLearnerRoute = pathname.startsWith('/learner/');
    const loginUrl = isLearnerRoute ? '/learner/login' : '/login';
    console.log(`❌ Redirecting ${pathname} to ${loginUrl} - no session`);
    return NextResponse.redirect(new URL(loginUrl, request.url));
  }

  // Optional: enforce coarse role gating by reading a hint from a header if upstream set it.
  // We avoid DB lookups here to keep edge fast. Fine-grained checks belong in server handlers.
  for (const rule of PAGE_ROLE_MAP) {
    if (rule.pattern.test(pathname)) {
      const roleHeader = request.headers.get('x-role') || '';
      if (!rule.roles.includes(roleHeader)) {
        return NextResponse.redirect(new URL('/login', request.url));
      }
    }
  }

  console.log(`✅ Allowing access to ${pathname}`);
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all pages except static assets and api routes
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
