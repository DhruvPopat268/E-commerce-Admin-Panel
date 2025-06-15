import { NextResponse } from 'next/server'

export function middleware(request) {
  // Get the token from cookies (match your backend cookie name)
  const token = request.cookies.get('token')?.value
  
  // Check if user is trying to access dashboard routes
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    // If no token exists, redirect to login
    if (!token) {
      const loginUrl = new URL('/login', request.url)
      // Add redirect parameter to return user after login
      loginUrl.searchParams.set('redirect', request.nextUrl.pathname)
      return NextResponse.redirect(loginUrl)
    }
    
    // Allow access if token exists
    return NextResponse.next()
  }
  
  // Allow access to all other routes
  return NextResponse.next()
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    '/dashboard/:path*', // This will match all dashboard routes
  ]
}
