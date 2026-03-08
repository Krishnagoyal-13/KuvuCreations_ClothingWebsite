import { initDatabase } from "../lib/db"
import { seedMarketplaceCatalog } from "../lib/marketplace-seed"

async function seedProducts() {
  try {
    console.log("Seeding marketplace catalog...")

    await initDatabase()
    const result = await seedMarketplaceCatalog()

    console.log("Marketplace catalog seeded successfully")
    console.log(result)
  } catch (error) {
    console.error("Error seeding marketplace catalog:", error)
    process.exitCode = 1
  }
}

seedProducts().catch((error) => {
  console.error("Unexpected seeding failure:", error)
  process.exit(1)
})
