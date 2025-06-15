// middleware.js - Fixed for Vercel deployment
import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const PUBLIC_FILE = /\.(.*)$/;

async function verifyJWT(token) {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch (err) {
    console.error('JWT verification failed:', err.message);
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

  console.log('🔍 Middleware running for:', pathname);
  
  // VERCEL COOKIE DEBUG - Multiple ways to get cookies
  const cookieHeader = req.headers.get('cookie');
  const allCookies = req.cookies.getAll();
  const tokenFromCookies = req.cookies.get('token')?.value;
  
  console.log('Raw cookie header:', cookieHeader);
  console.log('All cookies:', allCookies);
  console.log('Token from req.cookies:', tokenFromCookies ? 'EXISTS' : 'UNDEFINED');
  
  // VERCEL FIX: Manual token extraction from cookie header
  let token = tokenFromCookies;
  
  if (!token && cookieHeader) {
    console.log('🔧 Attempting manual token extraction...');
    const tokenMatch = cookieHeader.match(/(?:^|;\s*)token=([^;]*)/);
    if (tokenMatch) {
      token = tokenMatch[1];
      console.log('✅ Token found via manual extraction');
    }
  }
  
  console.log('Final token status:', token ? 'FOUND' : 'MISSING');
  
  if (!token) {
    console.log('❌ No token found, redirecting to login');
    const loginUrl = new URL('/login', req.url);
    return NextResponse.redirect(loginUrl);
  }

  // Environment checks
  if (!process.env.JWT_SECRET) {
    console.error('❌ JWT_SECRET environment variable missing');
    const loginUrl = new URL('/login', req.url);
    return NextResponse.redirect(loginUrl);
  }

  console.log('🔐 Verifying token...');
  const verified = await verifyJWT(token);
  console.log('Token verification:', verified ? 'SUCCESS' : 'FAILED');
  
  if (!verified) {
    console.log('❌ Token verification failed, redirecting to login');
    const loginUrl = new URL('/login', req.url);
    return NextResponse.redirect(loginUrl);
  }

  console.log('✅ Access granted to dashboard');
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};