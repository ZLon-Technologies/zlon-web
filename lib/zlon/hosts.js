export const BARE_CUSTOMER_HOST = 'zlon.in';
export const CUSTOMER_HOST = 'www.zlon.in';
export const BUSINESS_HOST = 'mybusiness.zlon.in';

export function isLocalHost(hostname = '') {
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

export function currentHostname() {
  if (typeof window === 'undefined') {
    return '';
  }

  return window.location.hostname;
}

export function customerUrl(pathname = '/') {
  if (typeof window !== 'undefined' && isLocalHost(window.location.hostname)) {
    return new URL(pathname === '/' ? '/' : pathname, window.location.origin).toString();
  }

  return `https://${CUSTOMER_HOST}${pathname}`;
}

export function businessUrl() {
  if (typeof window !== 'undefined' && isLocalHost(window.location.hostname)) {
    return new URL('/business', window.location.origin).toString();
  }

  return `https://${BUSINESS_HOST}`;
}
