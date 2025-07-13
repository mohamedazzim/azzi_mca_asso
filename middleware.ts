import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow all API routes and static files
  if (pathname.startsWith("/api") || pathname.startsWith("/_next") || pathname.includes(".")) {
    return NextResponse.next()
  }

  // Public routes that don't require authentication
  const publicRoutes = ["/", "/login"]
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next()
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

  // Add security headers
  const response = NextResponse.next()
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'"
  )

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
