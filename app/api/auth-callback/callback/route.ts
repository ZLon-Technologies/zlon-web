export const dynamic = "force-dynamic";

import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

function getSafeRedirectPath(pathname: string | null, fallback: string) {
  if (!pathname || !pathname.startsWith('/') || pathname.startsWith('//')) {
    return fallback;
  }

  return pathname;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const nextPath = getSafeRedirectPath(requestUrl.searchParams.get('next'), '/home');

  if (!code) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Create a response object first so we can attach cookies to it
  const response = NextResponse.redirect(new URL(nextPath, request.url));

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const loginUrl = new URL('/', request.url);
    loginUrl.searchParams.set('next', nextPath);
    return NextResponse.redirect(loginUrl);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const hasCompletedProfile = Boolean(
    user?.user_metadata?.full_name || user?.user_metadata?.name || user?.user_metadata?.first_name
  );

  if (!hasCompletedProfile) {
    const profileUrl = new URL('/complete-profile', request.url);
    profileUrl.searchParams.set('next', nextPath);
    
    // We need to carry over the cookies to the new redirect
    const profileResponse = NextResponse.redirect(profileUrl);
    response.cookies.getAll().forEach((cookie) => {
      profileResponse.cookies.set(cookie.name, cookie.value);
    });
    
    return profileResponse;
  }

  return response;
}
