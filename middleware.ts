import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_FILE = /\.(.*)$/;
const BUSINESS_HOST = 'mybusiness.zlon.in';

function normalizeHostname(host = '') {
  const firstHost = String(host || '').split(',')[0]?.trim() || '';
  return firstHost.split(':')[0]?.trim().toLowerCase() || '';
}

export function middleware(request: NextRequest) {
  try {
    const pathname = request.nextUrl?.pathname || '/';

    if (
      pathname.startsWith('/_next') ||
      pathname.startsWith('/api') ||
      pathname.startsWith('/static') ||
      pathname.startsWith('/favicon') ||
      PUBLIC_FILE.test(pathname)
    ) {
      return NextResponse.next();
    }

    const hostHeader = request.headers.get('x-forwarded-host') || request.headers.get('host') || '';
    const hostname = normalizeHostname(hostHeader);

    if (hostname === BUSINESS_HOST && pathname === '/') {
      return NextResponse.rewrite(new URL('/business', request.url));
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Middleware failed, allowing request through.', error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: ['/((?!_next|api|static|favicon.ico).*)']
};
