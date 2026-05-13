import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
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

  // Protected routes logic
  // If no user and trying to access a protected route, redirect to login
  const protectedRoutes = ['/home', '/profile', '/dashboard', '/booking', '/wallet', '/complete-profile', '/ai-stylist', '/ai-face-scanner']
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

  if (!user && isProtectedRoute) {
    const url = new URL('/', request.url)
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  // If user exists and trying to access login/landing page, redirect to home
  if (user && (pathname === '/' || pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/home', request.url))
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
