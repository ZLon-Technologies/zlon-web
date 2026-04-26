import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseConfig } from './config';

const AUTH_PATHS = new Set(['/', '/login', '/login-email', '/register', '/signup', '/verify-otp']);
const PROTECTED_PATH_PREFIXES = [
  '/booking',
  '/create-account',
  '/dashboard',
  '/home',
  '/profile',
  '/salon',
  '/wallet',
];

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

function withSupabaseCookies(source: NextResponse, target: NextResponse) {
  source.headers.getSetCookie().forEach((value) => {
    target.headers.append('set-cookie', value);
  });

  return target;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const { url, publishableKey } = getSupabaseConfig();
  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        supabaseResponse = NextResponse.next({
          request,
        });

        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set({
            name,
            value,
            ...options,
          });
        });
      },
    },
  });

  const { data, error } = await supabase.auth.getClaims();
  const isAuthenticated = !error && Boolean(data?.claims?.sub);
  const pathname = request.nextUrl.pathname;

  if (!isAuthenticated && isProtectedPath(pathname)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/';
    loginUrl.search = '';
    loginUrl.searchParams.set('next', `${request.nextUrl.pathname}${request.nextUrl.search}`);

    return withSupabaseCookies(supabaseResponse, NextResponse.redirect(loginUrl));
  }

  if (isAuthenticated && AUTH_PATHS.has(pathname)) {
    const redirectPath = getSafeRedirectPath(request.nextUrl.searchParams.get('next'), '/home');
    return withSupabaseCookies(
      supabaseResponse,
      NextResponse.redirect(new URL(redirectPath, request.url))
    );
  }

  return supabaseResponse;
}
