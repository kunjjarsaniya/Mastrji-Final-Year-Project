import { NextRequest, NextResponse } from 'next/server';

export const config = {
  matcher: ['/admin/:path*', '/api/:path*'],
};

// Simple session check
function getSession(request: NextRequest) {
  const cookie = request.cookies.get('session');
  if (!cookie?.value) return null;
  
  try {
    const base64Url = cookie.value.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(Buffer.from(base64, 'base64').toString('utf-8'));
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for static files and public routes
  if (pathname.startsWith('/_next/static') || 
      pathname.startsWith('/api/public') ||
      pathname.includes('.')) {
    return NextResponse.next();
  }

  // Admin route protection
  if (pathname.startsWith('/admin')) {
    const session = getSession(request);
    if (!session) {
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