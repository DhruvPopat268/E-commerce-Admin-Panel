import { NextResponse } from 'next/server'

export function middleware(request) {
  console.log('=== MIDDLEWARE DEBUG ===')
  console.log('Request URL:', request.url)
  console.log('Request headers:', Object.fromEntries(request.headers.entries()))
  
  // Get ALL cookies to see what's available
  const allCookies = request.cookies.getAll()
  console.log('All cookies available:', allCookies)
  
  // Try different ways to get the token
  const token1 = request.cookies.get('token')?.value
  const token2 = request.cookies.get('token')
  const cookieHeader = request.headers.get('cookie')
  
  console.log('Method 1 - token?.value:', token1)
  console.log('Method 2 - token object:', token2)
  console.log('Method 3 - cookie header:', cookieHeader)
  
  // Parse cookie header manually
  let manualToken = null
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').map(c => c.trim())
    const tokenCookie = cookies.find(c => c.startsWith('token='))
    if (tokenCookie) {
      manualToken = tokenCookie.split('=')[1]
    }
  }
  console.log('Method 4 - manual parsing:', manualToken)
  
  const finalToken = token1 || manualToken
  console.log('Final token to use:', finalToken)
  console.log('=== END MIDDLEWARE DEBUG ===')
 
  // Check if user is trying to access dashboard routes
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    // If no token exists, redirect to login
    if (!finalToken) {
      console.log('No token found, redirecting to login')
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', request.nextUrl.pathname)
      return NextResponse.redirect(loginUrl)
    }
   
    console.log('Token found, allowing access')
    return NextResponse.next()
  }
 
  return NextResponse.next()
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    '/dashboard/:path*', // This will match all dashboard routes
  ]
}