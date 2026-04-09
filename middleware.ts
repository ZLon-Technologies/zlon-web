import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  try {
    const url = request.nextUrl
    const hostname = request.headers.get('host') || ''

    // 1. If the user is on the business subdomain, show the /owner or /business app
    // (Make sure the folder name matches what you built, e.g., '/business' or '/owner')
    if (hostname.includes('mybusiness.zlon.in')) {
      return NextResponse.rewrite(new URL(`/owner${url.pathname}`, request.url))

    }

    // 2. If it's the normal www.zlon.in, just let them through normally
    return NextResponse.next()

  } catch (error) {
    // If anything fails, DO NOT crash the site. Just let the user through.
    console.error('Middleware Error:', error)
    return NextResponse.next()
  }
}

// 3. The "Traffic Cop" rule: Ignore images, CSS, and API files so they don't break
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)',
  ],
}