const fs = require("fs")
const path = require("path")
const { sql } = require("@vercel/postgres")

function loadPostgresUrlFromEnvLocal() {
  if (process.env.POSTGRES_URL) {
    return process.env.POSTGRES_URL
  }

  const envPath = path.join(process.cwd(), ".env.local")
  if (!fs.existsSync(envPath)) {
    return null
  }

  const envText = fs.readFileSync(envPath, "utf8")
  const line = envText
    .split(/\r?\n/)
    .map((value) => value.trim())
    .find((value) => value.startsWith("POSTGRES_URL="))

  if (!line) {
    return null
  }

  return line.slice("POSTGRES_URL=".length)
}

async function main() {
  const postgresUrl = loadPostgresUrlFromEnvLocal()
  if (!postgresUrl) {
    throw new Error("POSTGRES_URL was not found in environment or .env.local")
  }

  process.env.POSTGRES_URL = postgresUrl

  await sql.query("ALTER TABLE billing_customers ADD COLUMN IF NOT EXISTS phone_number VARCHAR(30)")
  await sql.query("ALTER TABLE billing_invoices ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(30)")
  await sql.query(
    "ALTER TABLE billing_invoice_items ADD COLUMN IF NOT EXISTS product_type VARCHAR(100) NOT NULL DEFAULT 'Night suit'",
  )
  await sql.query(`
    CREATE TABLE IF NOT EXISTS billing_stock_categories (
      id SERIAL PRIMARY KEY,
      product_type VARCHAR(100) NOT NULL UNIQUE,
      purchased_qty INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT billing_stock_purchased_qty_check CHECK (purchased_qty >= 0)
    )
  `)

  await sql.query("TRUNCATE TABLE billing_invoice_items, billing_invoices, billing_customers, billing_stock_categories RESTART IDENTITY CASCADE")
  await sql.query("ALTER SEQUENCE billing_invoices_id_seq RESTART WITH 600")

  console.log("Billing data cleared and invoice sequence reset to start at 600.")
}

main().catch((error) => {
  console.error("Failed to reset billing data:", error)
  process.exit(1)
})
