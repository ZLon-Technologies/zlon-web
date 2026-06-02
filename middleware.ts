import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_ZLON_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_ZLON_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Do not use getSession(). Use getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Check for Firebase Auth session indicator (e.g., a custom cookie)
  // Since Firebase Web SDK stores state in IndexedDB, we must rely on a client-set cookie for middleware recognition.
  const firebaseAuthCookie = request.cookies.get('firebase-auth-token')
  const hasFirebaseSession = !!firebaseAuthCookie

  const isLoggedIn = !!user || hasFirebaseSession

  // Protected routes logic
  const protectedRoutes = ['/home', '/profile', '/dashboard', '/booking', '/wallet', '/complete-profile', '/ai-stylist', '/ai-face-scanner']
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

  if (!isLoggedIn && isProtectedRoute) {
    const url = new URL('/', request.url)
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  // If user exists and trying to access login/landing page, redirect to home
  if (isLoggedIn && (pathname === '/' || pathname === '/login' || pathname === '/signup' || pathname === '/login-email')) {
    const nextPath = request.nextUrl.searchParams.get('next') || '/home'
    return NextResponse.redirect(new URL(nextPath, request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (svg, png, jpg, etc)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
