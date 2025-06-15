// middleware.js - Specific debugging for live server issues
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
  
  // Skip non-dashboard routes
  if (!isDashboardRoute || PUBLIC_FILE.test(pathname)) {
    return NextResponse.next();
  }

  // EXTENSIVE DEBUGGING FOR LIVE SERVER
  console.log('🔍 === LIVE SERVER COOKIE DEBUG ===');
  console.log('URL:', req.url);
  console.log('Pathname:', pathname);
  console.log('Method:', req.method);
  
  // Check all possible ways cookies might be sent
  const cookieHeader = req.headers.get('cookie');
  const allCookies = req.cookies.getAll();
  const tokenCookie = req.cookies.get('token');
  
  console.log('Raw cookie header:', cookieHeader);
  console.log('All cookies from req.cookies:', allCookies);
  console.log('Token cookie object:', tokenCookie);
  console.log('Token value:', tokenCookie?.value);
  
  // Check if cookie exists in raw header but not in req.cookies
  if (cookieHeader && cookieHeader.includes('token=')) {
    const tokenMatch = cookieHeader.match(/token=([^;]+)/);
    if (tokenMatch) {
      console.log('🚨 Token found in raw header but not in req.cookies!');
      console.log('Raw token from header:', tokenMatch[1]);
    }
  }
  
  // Environment info
  console.log('Environment:', process.env.NODE_ENV);
  console.log('Host:', req.headers.get('host'));
  console.log('User-Agent:', req.headers.get('user-agent'));
  console.log('X-Forwarded-Proto:', req.headers.get('x-forwarded-proto'));
  console.log('X-Forwarded-Host:', req.headers.get('x-forwarded-host'));
  
  const token = tokenCookie?.value;
  
  if (!token) {
    console.log('❌ No token found - redirecting to login');
    console.log('Available cookies:', Object.keys(req.cookies));
    
    // Try to extract token manually from cookie header as fallback
    if (cookieHeader) {
      const manualTokenMatch = cookieHeader.match(/token=([^;]+)/);
      if (manualTokenMatch) {
        console.log('🔧 Found token in manual extraction:', manualTokenMatch[1].substring(0, 20) + '...');
        // Use manually extracted token
        const manualToken = manualTokenMatch[1];
        const verified = await verifyJWT(manualToken);
        if (verified) {
          console.log('✅ Manual token verification successful');
          return NextResponse.next();
        }
      }
    }
    
    const loginUrl = new URL('/login', req.url);
    return NextResponse.redirect(loginUrl);
  }

  console.log('Token length:', token.length);
  console.log('Token preview:', token.substring(0, 20) + '...');
  
  // JWT verification
  if (!process.env.JWT_SECRET) {
    console.error('❌ JWT_SECRET missing!');
    const loginUrl = new URL('/login', req.url);
    return NextResponse.redirect(loginUrl);
  }

  const verified = await verifyJWT(token);
  console.log('Token verification result:', !!verified);
  
  if (!verified) {
    console.log('❌ Token verification failed - redirecting to login');
    const loginUrl = new URL('/login', req.url);
    return NextResponse.redirect(loginUrl);
  }

  console.log('✅ Token verified - allowing access to dashboard');
  console.log('🔍 === END DEBUG ===');
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};