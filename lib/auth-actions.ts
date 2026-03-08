"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { v4 as uuidv4 } from "uuid"
import bcrypt from "bcryptjs"
import { query } from "./db"

interface LoginData {
  email: string
  password: string
}

interface RegisterData {
  firstName: string
  lastName: string
  email: string
  password: string
}

export async function loginUser(data: LoginData) {
  try {
    // Find user by email
    const userResult = await query("SELECT * FROM users WHERE email = $1", [data.email])

    if (userResult.rows.length === 0) {
      return { success: false, error: "Invalid email or password" }
    }

    const user = userResult.rows[0]

    // Check if password matches
    const passwordMatch = await bcrypt.compare(data.password, user.password)

    if (!passwordMatch) {
      return { success: false, error: "Invalid email or password" }
    }

    // Create a session
    const sessionId = uuidv4()
    const expires = new Date()
    expires.setDate(expires.getDate() + 7) // Session expires in 7 days

    await query("INSERT INTO sessions (id, user_id, expires) VALUES ($1, $2, $3)", [sessionId, user.id, expires])

    // Set session cookie
    const cookieStore = await cookies()
    cookieStore.set("session_id", sessionId, {
      httpOnly: true,
      expires,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    })

    return { success: true, userId: user.id }
  } catch (error) {
    console.error("Login error:", error)
    return { success: false, error: "An error occurred during login" }
  }
}

export async function registerUser(data: RegisterData) {
  try {
    // Check if email already exists
    const existingUser = await query("SELECT * FROM users WHERE email = $1", [data.email])

    if (existingUser.rows.length > 0) {
      return { success: false, error: "Email already in use" }
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(data.password, 10)

    // Create new user
    const result = await query(
      "INSERT INTO users (email, password, first_name, last_name) VALUES ($1, $2, $3, $4) RETURNING id",
      [data.email, hashedPassword, data.firstName, data.lastName],
    )

    return { success: true, userId: result.rows[0].id }
  } catch (error) {
    console.error("Registration error:", error)
    return { success: false, error: "An error occurred during registration" }
  }
}

export async function logoutUser() {
  try {
    // Get session ID from cookie
    const cookieStore = await cookies()
    const sessionId = cookieStore.get("session_id")?.value

    // Delete session if it exists
    if (sessionId) {
      await query("DELETE FROM sessions WHERE id = $1", [sessionId])
    }

    // Delete session cookie
    cookieStore.delete("session_id")

    // Redirect to home page
    redirect("/")
  } catch (error) {
    console.error("Logout error:", error)
    // Still delete the cookie even if there's an error
    const cookieStore = await cookies()
    cookieStore.delete("session_id")
    redirect("/")
  }
}

export async function getCurrentUser() {
  try {
    // Get session ID from cookie
    const cookieStore = await cookies()
    const sessionId = cookieStore.get("session_id")?.value

    if (!sessionId) {
      return null
    }

    // Check if session exists and is valid
    const sessionResult = await query("SELECT * FROM sessions WHERE id = $1 AND expires > NOW()", [sessionId])

    if (sessionResult.rows.length === 0) {
      // Session not found or expired
      cookieStore.delete("session_id")
      return null
    }

    const session = sessionResult.rows[0]

    // Find user by ID
    const userResult = await query("SELECT id, email, first_name, last_name FROM users WHERE id = $1", [
      session.user_id,
    ])

    if (userResult.rows.length === 0) {
      return null
    }

    const user = userResult.rows[0]

    // Return user data
    return {
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
    }
  } catch (error) {
    console.error("Get current user error:", error)
    return null
  }
}
