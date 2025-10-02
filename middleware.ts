import { NextRequest, NextResponse } from 'next/server';

export const config = {
  // Only run middleware on specific routes that need it
  matcher: [
    '/admin/:path*',
    '/api/:path*',
  ],
};

// Only import security module when needed
async function checkSecurity(request: NextRequest) {
  if (process.env.NODE_ENV === 'production' && 
      (request.nextUrl.pathname.startsWith('/api/') || 
       request.nextUrl.pathname.startsWith('/admin'))) {
    const { protectWithArcJet } = await import('./lib/security');
    return protectWithArcJet(request);
  }
  return { isDenied: () => false };
}

export async function middleware(request: NextRequest) {
  // Skip middleware for static files and public routes
  if (request.nextUrl.pathname.startsWith('/_next/static') ||
      request.nextUrl.pathname.startsWith('/api/public') ||
      request.nextUrl.pathname.includes('.')) {
    return NextResponse.next();
  }

  // Apply authentication for admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const { getSession } = await import('./lib/auth-utils');
    const session = getSession(request);
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Check security rules
  const securityCheck = await checkSecurity(request);
  if (securityCheck.isDenied()) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  return NextResponse.next();
}