import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow all API routes and static files
  if (pathname.startsWith("/api") || pathname.startsWith("/_next") || pathname.includes(".")) {
    return NextResponse.next()
  }

  // Public routes that don't require authentication
  const publicRoutes = ["/login"]
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next()
  }

  // Handle root route - redirect based on authentication
  if (pathname === "/") {
    const sessionCookie = request.cookies.get("session")?.value
    let user: { role?: string } | null = null
    if (sessionCookie) {
      try {
        user = JSON.parse(sessionCookie)
      } catch {
        user = null
      }
    }
    
    if (user) {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url))
    } else {
      return NextResponse.redirect(new URL("/login", request.url))
    }
  }

  // Session validation for protected routes
  const sessionCookie = request.cookies.get("session")?.value
  let user: { role?: string } | null = null
  if (sessionCookie) {
    try {
      user = JSON.parse(sessionCookie)
    } catch {
      user = null
    }
  }

  // Define role-based access for admin and staff routes
  const adminRoutes = ["/admin", "/admin/dashboard", "/admin/analytics", "/admin/events", "/admin/reports", "/admin/students"]
  const staffRoutes = ["/staff", "/staff/dashboard"]

  // Allow both admin and staff to access /admin routes
  if (adminRoutes.some(route => pathname.startsWith(route))) {
    if (!user || (user.role !== "admin" && user.role !== "staff")) {
      return NextResponse.redirect(new URL("/login", request.url))
    }
  }

  // Check for staff-only access (if you have staff-only routes)
  if (staffRoutes.some(route => pathname.startsWith(route))) {
    if (!user || user.role !== "staff") {
      return NextResponse.redirect(new URL("/login", request.url))
    }
  }

  // Add comprehensive security headers
  const response = NextResponse.next()
  
  // Prevent XSS attacks
  response.headers.set('X-XSS-Protection', '1; mode=block')
  
  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff')
  
  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY')
  
  // Enhanced referrer policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; object-src 'none'; frame-src 'none'; base-uri 'self'; form-action 'self'"
  )
  
  // Permissions Policy (Feature Policy)
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=(), accelerometer=(), gyroscope=(), magnetometer=()'
  )
  
  // Strict Transport Security (HTTPS only)
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  
  // Cross-Origin policies for enhanced security
  response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp')
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin')
  response.headers.set('Cross-Origin-Resource-Policy', 'same-origin')
  
  // Remove server identification
  response.headers.set('Server', '')
  
  // Performance and caching headers for static assets
  if (pathname.startsWith('/_next/static/')) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable')
  }
  
  // No cache for sensitive routes
  if (pathname.includes('/auth') || pathname.includes('/api/auth')) {
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
  }

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
