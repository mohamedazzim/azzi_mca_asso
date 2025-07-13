import { type NextRequest, NextResponse } from "next/server"
import { getUsers } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 })
    }

    const usersCollection = await getUsers()
    const user = await usersCollection.findOne({ username })

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash)
    if (!isValidPassword) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Create session data
    const sessionData = {
      userId: user._id,
      username: user.username,
      role: user.role,
      fullName: user.fullName,
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
