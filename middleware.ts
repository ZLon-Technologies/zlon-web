import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const BUSINESS_HOST = 'mybusiness.zlon.in';

function normalizeHostname(host = '') {
  const firstHost = String(host || '').split(',')[0]?.trim() || '';
  return firstHost.split(':')[0]?.trim().toLowerCase() || '';
}

export function middleware(request: NextRequest) {
  try {
    const pathname = request.nextUrl?.pathname || '/';
    const hostHeader = request.headers.get('x-forwarded-host') || request.headers.get('host') || '';
    const hostname = normalizeHostname(hostHeader);

    if (hostname === BUSINESS_HOST && pathname === '/') {
      return NextResponse.rewrite(new URL('/owner', request.url));
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Middleware Error:', error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)']
};
