import { NextResponse } from "next/server"

import { initDatabase } from "@/lib/db"
import { seedMarketplaceCatalog } from "@/lib/marketplace-seed"

export async function GET() {
  try {
    await initDatabase()
    const result = await seedMarketplaceCatalog()

    return NextResponse.json({
      success: true,
      message: "Marketplace catalog seeded successfully",
      data: result,
    })
  } catch (error) {
    console.error("Error seeding database:", error)
    return NextResponse.json({ success: false, error: "Failed to seed database" }, { status: 500 })
  }
}
