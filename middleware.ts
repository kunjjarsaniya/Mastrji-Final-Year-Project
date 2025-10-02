import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';

export const config = {
  // Only run middleware on specific routes that need it
  matcher: [
    '/admin/:path*',
    '/api/:path*',
    // Add other routes that need protection
  ],
};

export async function middleware(request: NextRequest) {
  // Skip middleware for static files and API routes that don't need auth
  if (request.nextUrl.pathname.startsWith('/_next/static') ||
    request.nextUrl.pathname.startsWith('/api/public') ||
    request.nextUrl.pathname.includes('.')) {
    return NextResponse.next();
  }

  // Apply authentication for admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const sessionCookie = getSessionCookie(request);
    if (!sessionCookie) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Add ArcJet protection only to specific routes if needed
  if (process.env.NODE_ENV === 'production' &&
    (request.nextUrl.pathname.startsWith('/api/') ||
      request.nextUrl.pathname.startsWith('/admin'))) {
    const { detectBot } = await import('@arcjet/next');
    const arcjet = (await import('@arcjet/next')).default;

    const aj = arcjet({
      key: process.env.ARCJET_KEY!,
      rules: [
        detectBot({
          mode: 'LIVE',
          // Block all bots except the following
          allow: [
            'CATEGORY:SEARCH_ENGINE', // Google, Bing, etc
            'CATEGORY:MONITOR', // Uptime monitoring services
            'STRIPE_WEBHOOK' // Allow Stripe webhooks
          ]
        })
      ]
    });

    const decision = await aj.protect(request);

    // Bots not in the allow list will be blocked
    if (decision.isDenied()) {
      return new NextResponse('Forbidden', { status: 403 });
    }
  }

  return NextResponse.next();
}