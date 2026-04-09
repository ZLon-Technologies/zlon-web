import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_FILE = /\.(.*)$/;

export function middleware(request: NextRequest) {
  const hostHeader = request.headers.get('x-forwarded-host') || request.headers.get('host') || '';
  const hostname = String(hostHeader).split(':')[0];
  const pathname = request.nextUrl.pathname;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/favicon') ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  const isBusinessHost = hostname === 'mybusiness.zlon.in';

  if (isBusinessHost && pathname === '/') {
    const url = request.nextUrl.clone();
    url.pathname = '/business';
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|api|static|favicon.ico).*)']
};
