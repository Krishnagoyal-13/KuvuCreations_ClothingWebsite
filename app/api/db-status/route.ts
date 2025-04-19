import { NextResponse } from "next/server"
import { query } from "@/lib/db"

export async function GET() {
  try {
    // Simple query to check database connection
    const result = await query("SELECT NOW()")

    return NextResponse.json({
      success: true,
      message: "Database connection successful",
      timestamp: result.rows[0].now,
    })
  } catch (error) {
    console.error("Database connection error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Database connection failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
