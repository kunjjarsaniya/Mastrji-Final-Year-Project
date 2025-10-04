import { NextRequest, NextResponse } from 'next/server';

export const config = {
  matcher: ['/admin/:path*', '/api/:path*'],
};

// Simple session presence check (tokens may be opaque, don't decode)
function hasSessionCookie(request: NextRequest) {
  // Try common cookie keys used by auth libraries
  const possibleCookieKeys = ['session', 'better-auth.session', 'better-auth.session_token'];
  return possibleCookieKeys.some((key) => !!request.cookies.get(key)?.value);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for static files and public routes
  if (pathname.startsWith('/_next/static') || 
      pathname.startsWith('/api/public') ||
      pathname.includes('.')) {
    return NextResponse.next();
  }

  // Avoid running middleware's security fetch for the security route itself
  // to prevent recursive middleware -> API -> middleware loops.
  if (pathname === '/api/security') {
    return NextResponse.next();
  }

  // Admin route protection
  if (pathname.startsWith('/admin')) {
    const hasSession = hasSessionCookie(request);
    if (!hasSession) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Skip security checks in development
  if (process.env.NODE_ENV === 'development') {
    return NextResponse.next();
  }

  // For API and admin routes in production, verify security
  if (pathname.startsWith('/api/') || pathname.startsWith('/admin')) {
    try {
      // Call our API route for security checks
      const securityUrl = new URL('/api/security', request.url);
      const securityCheck = await fetch(securityUrl.toString(), {
        method: 'POST',
        headers: request.headers,
        body: JSON.stringify({}),
      });
      
      const { allowed } = await securityCheck.json();
      if (!allowed) {
        return new NextResponse('Forbidden', { status: 403 });
      }
    } catch (error) {
      console.error('Security check failed:', error);
      // Fail open in case of errors
    }
  }

  return NextResponse.next();
}