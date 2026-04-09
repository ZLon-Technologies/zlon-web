import { NextResponse } from 'next/server';

const BARE_HOST = 'zlon.in';
const CUSTOMER_HOST = 'www.zlon.in';
const BUSINESS_HOST = 'mybusiness.zlon.in';
const PUBLIC_FILE = /\.[^/]+$/;

function normalizeHost(host = '') {
  return String(host).split(':')[0];
}

function isLocalHost(host = '') {
  const hostname = normalizeHost(host);
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

export function middleware(request) {
  const host = request.headers.get('host') || '';
  const hostname = normalizeHost(host);
  const url = request.nextUrl.clone();
  const { pathname } = url;

  if (hostname === BARE_HOST) {
    url.protocol = 'https';
    url.host = CUSTOMER_HOST;
    return NextResponse.redirect(url, 308);
  }

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  if (isLocalHost(hostname)) {
    return NextResponse.next();
  }

  if (hostname === BUSINESS_HOST) {
    if (!pathname.startsWith('/business')) {
      url.pathname = '/business';
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  }

  if (pathname.startsWith('/business')) {
    url.protocol = 'https';
    url.host = BUSINESS_HOST;
    url.pathname = '/';
    return NextResponse.redirect(url, 307);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
};
