import { type NextRequest, NextResponse } from "next/server"
import { getUsers } from "@/lib/local-db"
import bcrypt from "bcryptjs"
import { withRateLimit, rateLimiter, RATE_LIMIT_CONFIGS } from "@/lib/rate-limiter"

// Handle non-POST requests with proper JSON response
export async function GET() {
  return NextResponse.json({ error: "Method not allowed. Use POST." }, { status: 405 })
}

export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = await withRateLimit(request, 'login', RATE_LIMIT_CONFIGS.login);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 })
    }

    const usersStorage = await getUsers()
    const user = await usersStorage.findUser(username)

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password)
    
    if (!isValidPassword) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Record successful authentication (resets rate limit counter)
    await rateLimiter.recordSuccessfulAuth(request.headers.get('x-forwarded-for') || 'unknown', 'login');

    // Create session data
    const sessionData = {
      userId: user.username, // Use username as userId for local storage
      username: user.username,
      role: user.role,
      fullName: user.fullName || user.username,
    }

    const response = NextResponse.json({
      success: true,
      user: sessionData,
    })

    // Set session cookie
    response.cookies.set("session", JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return response
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}