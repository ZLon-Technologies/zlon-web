import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseConfig } from './config';

const AUTH_PATHS = new Set(['/', '/login', '/login-email', '/register', '/signup', '/verify-otp', '/forgot-password']);
const PROTECTED_PATH_PREFIXES = [
  '/booking',
  '/bookings',
  '/dashboard',
  '/home',
  '/profile',
  '/salon',
  '/wallet',
];
const AUTH_RESPONSE_HEADERS = ['cache-control', 'expires', 'pragma'] as const;

function getSafeRedirectPath(pathname: string | null, fallback: string) {
  if (!pathname || !pathname.startsWith('/') || pathname.startsWith('//')) {
    return fallback;
  }

  return pathname;
}

function isProtectedPath(pathname: string) {
  return PROTECTED_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

function withSupabaseState(source: NextResponse, target: NextResponse) {
  source.cookies.getAll().forEach((cookie) => {
    const { name, value, ...options } = cookie;
    target.cookies.set(name, value, options);
  });

  AUTH_RESPONSE_HEADERS.forEach((headerName) => {
    const headerValue = source.headers.get(headerName);

    if (headerValue) {
      target.headers.set(headerName, headerValue);
    }
  });

  return target;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  try {
    const { url, publishableKey } = getSupabaseConfig();
    const supabase = createServerClient(url, publishableKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers = {}) {
          try {
            cookiesToSet.forEach(({ name, value }) => {
              request.cookies.set(name, value);
            });

            supabaseResponse = NextResponse.next({
              request,
            });

            cookiesToSet.forEach(({ name, value, options }) => {
              supabaseResponse.cookies.set(name, value, options);
            });

            Object.entries(headers).forEach(([key, value]) => {
              supabaseResponse.headers.set(key, value);
            });
          } catch (error) {
            console.error('Failed to update Supabase auth cookies in proxy.', error);
          }
        },
      },
    });

    const { data, error } = await supabase.auth.getUser();
    const isAuthenticated = !error && Boolean(data?.user);
    const pathname = request.nextUrl.pathname;

    if (!isAuthenticated && isProtectedPath(pathname)) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/';
      loginUrl.search = '';
      loginUrl.searchParams.set('next', `${request.nextUrl.pathname}${request.nextUrl.search}`);

      return withSupabaseState(supabaseResponse, NextResponse.redirect(loginUrl));
    }

    if (isAuthenticated && AUTH_PATHS.has(pathname)) {
      const redirectPath = getSafeRedirectPath(request.nextUrl.searchParams.get('next'), '/home');
      return withSupabaseState(
        supabaseResponse,
        NextResponse.redirect(new URL(redirectPath, request.url))
      );
    }

    return supabaseResponse;
  } catch (error) {
    console.error('Supabase proxy failed; continuing without auth redirect handling.', error);
    return supabaseResponse;
  }
}
