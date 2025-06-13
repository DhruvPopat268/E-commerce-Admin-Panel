// middleware.js
import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const PUBLIC_FILE = /\.(.*)$/;

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

async function verifyJWT(token) {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch (err) {
    return null;
  }
}

export async function middleware(req) {
  const { pathname } = req.nextUrl;
  const isDashboardRoute = pathname.startsWith('/dashboard');

  // Allow static files or non-dashboard pages
  if (!isDashboardRoute || PUBLIC_FILE.test(pathname)) {
    return NextResponse.next();
  }

  const token = req.cookies.get('token')?.value;

  if (!token) {
    const loginUrl = new URL('/login', req.url);
    return NextResponse.redirect(loginUrl);
  }

  const verified = await verifyJWT(token);

  if (!verified) {
    const loginUrl = new URL('/login', req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'], // Protect all /dashboard routes
};
