// middleware.ts
import { NextRequest, NextResponse } from 'next/server'
export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;

  console.log('Middleware Path:', request.nextUrl.pathname);
  console.log('Middleware Cookies:', request.cookies); // Log all cookies
  console.log('Middleware Token:', token); // Log the specific token value

  if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
    console.log('Middleware: Redirecting to /login because token is missing.');
    return NextResponse.redirect(new URL('/login', request.url));
  }
  console.log('Middleware: Token found, proceeding to dashboard.');
  return NextResponse.next();
}
export const config = {
  matcher: ['/dashboard/:path*'],
};