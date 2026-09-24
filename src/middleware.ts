import { NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n';
import { verifySessionToken, AUTH_COOKIE_NAME } from './lib/auth';

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed',
});

// List of public API endpoints that bypass session authentication
const PUBLIC_API_PATHS = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/logout',
];

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Handle API Routes authentication & authorization
  if (pathname.startsWith('/api/')) {
    const isPublicApi = PUBLIC_API_PATHS.some((path) => pathname.startsWith(path));
    if (isPublicApi) {
      return NextResponse.next();
    }

    // Extract session token
    let token: string | null = null;
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
      token = authHeader.substring(7).trim();
    }

    if (!token) {
      const cookie = req.cookies.get(AUTH_COOKIE_NAME);
      if (cookie) {
        token = cookie.value;
      }
    }

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const session = await verifySessionToken(token);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Role authorization check for Admin API endpoints
    if (pathname.startsWith('/api/admin') && session.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Admin privilege required' },
        { status: 403 }
      );
    }

    return NextResponse.next();
  }

  // 2. Handle Page Routes protection & next-intl locale routing
  const segments = pathname.split('/').filter(Boolean);
  // Check if first segment is a supported locale (e.g. /en/admin, /es/leads)
  const isLocaleFirst = segments.length > 0 && (locales as readonly string[]).includes(segments[0]);
  const routePath = isLocaleFirst ? `/${segments.slice(1).join('/')}` : pathname;
  const currentLocale = isLocaleFirst ? segments[0] : defaultLocale;

  const isProtectedPage =
    routePath.startsWith('/leads') ||
    routePath.startsWith('/campaigns') ||
    routePath.startsWith('/voice') ||
    routePath.startsWith('/analytics') ||
    routePath.startsWith('/admin');

  if (isProtectedPage) {
    const cookie = req.cookies.get(AUTH_COOKIE_NAME);
    const token = cookie?.value;
    const session = token ? await verifySessionToken(token) : null;

    if (!session) {
      const url = req.nextUrl.clone();
      url.pathname = `/${currentLocale}`;
      return NextResponse.redirect(url);
    }

    if (routePath.startsWith('/admin') && session.role !== 'ADMIN') {
      const url = req.nextUrl.clone();
      url.pathname = `/${currentLocale}/analytics`;
      return NextResponse.redirect(url);
    }
  }

  // Execute next-intl middleware for page routing
  return intlMiddleware(req);
}

export const config = {
  matcher: ['/((?!_next|_vercel|.*\\..*).*)'],
};
