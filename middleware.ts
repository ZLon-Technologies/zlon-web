import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check for Firebase Auth session indicator (e.g., a custom cookie)
  // Since Firebase Web SDK stores state in IndexedDB, we must rely on a client-set cookie for middleware recognition.
  const firebaseAuthCookie = request.cookies.get('firebase-auth-token')
  const isLoggedIn = !!firebaseAuthCookie

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

  return NextResponse.next()
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