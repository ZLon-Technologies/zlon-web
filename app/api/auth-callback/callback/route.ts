export const dynamic = "force-static";

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

  const supabase = await createClient();
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
    const profileUrl = new URL('/create-account', request.url);
    profileUrl.searchParams.set('next', nextPath);

    return NextResponse.redirect(profileUrl);
  }

  return NextResponse.redirect(new URL(nextPath, request.url));
}
