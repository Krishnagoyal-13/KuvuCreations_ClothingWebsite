import { sql } from "@vercel/postgres"

// Helper function to execute SQL queries
export async function query(text: string, params: any[] = []) {
  try {
    // Use the Vercel Postgres client which is optimized for serverless environments
    const result = await sql.query(text, params)
    return result
  } catch (error) {
    console.error("Error executing query", { text, error })
    throw error
  }
}

// Initialize database tables
export async function initDatabase() {
  const lockId = 80741231

  try {
    // Prevent concurrent CREATE TABLE races across multiple server workers.
    await query("SELECT pg_advisory_lock($1)", [lockId])

    // Create users table
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        first_name VARCHAR(255) NOT NULL,
        last_name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create sessions table
    await query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id VARCHAR(255) PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        expires TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create products table
    await query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        image VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create cart table
    await query(`
      CREATE TABLE IF NOT EXISTS carts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        session_id VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT cart_owner CHECK (
          (user_id IS NOT NULL AND session_id IS NULL) OR
          (user_id IS NULL AND session_id IS NOT NULL)
        )
      )
    `)

    // Create cart items table
    await query(`
      CREATE TABLE IF NOT EXISTS cart_items (
        id SERIAL PRIMARY KEY,
        cart_id INTEGER REFERENCES carts(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        quantity INTEGER NOT NULL,
        size VARCHAR(10),
        color VARCHAR(50),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create orders table
    await query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        status VARCHAR(50) NOT NULL,
        total DECIMAL(10, 2) NOT NULL,
        shipping_address TEXT,
        billing_address TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create order items table
    await query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
        quantity INTEGER NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        size VARCHAR(10),
        color VARCHAR(50),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create billing customers table
    await query(`
      CREATE TABLE IF NOT EXISTS billing_customers (
        id SERIAL PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL UNIQUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Create billing invoices table
    await query(`
      CREATE TABLE IF NOT EXISTS billing_invoices (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER NOT NULL REFERENCES billing_customers(id) ON DELETE CASCADE,
        subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
        discount_total DECIMAL(10, 2) NOT NULL DEFAULT 0,
        tax_total DECIMAL(10, 2) NOT NULL DEFAULT 0,
        total DECIMAL(10, 2) NOT NULL DEFAULT 0,
        payment_status VARCHAR(20) NOT NULL DEFAULT 'pending',
        tax_enabled BOOLEAN NOT NULL DEFAULT FALSE,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT billing_payment_status_check CHECK (payment_status IN ('pending', 'paid'))
      )
    `)

    // Create billing invoice items table
    await query(`
      CREATE TABLE IF NOT EXISTS billing_invoice_items (
        id SERIAL PRIMARY KEY,
        invoice_id INTEGER NOT NULL REFERENCES billing_invoices(id) ON DELETE CASCADE,
        product_name VARCHAR(255) NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price DECIMAL(10, 2) NOT NULL,
        base_total DECIMAL(10, 2) NOT NULL DEFAULT 0,
        discount_value DECIMAL(10, 2) NOT NULL DEFAULT 0,
        tax_percent DECIMAL(5, 2) NOT NULL DEFAULT 0,
        tax_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
        line_total DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT billing_item_quantity_check CHECK (quantity > 0),
        CONSTRAINT billing_item_unit_price_check CHECK (unit_price >= 0),
        CONSTRAINT billing_item_discount_check CHECK (discount_value >= 0),
        CONSTRAINT billing_item_tax_percent_check CHECK (tax_percent >= 0),
        CONSTRAINT billing_item_tax_amount_check CHECK (tax_amount >= 0),
        CONSTRAINT billing_item_line_total_check CHECK (line_total >= 0)
      )
    `)

    // Backward-compatible schema upgrades for existing billing tables.
    await query(`
      ALTER TABLE billing_invoices
      ADD COLUMN IF NOT EXISTS discount_total DECIMAL(10, 2) NOT NULL DEFAULT 0
    `)
    await query(`
      ALTER TABLE billing_invoices
      ADD COLUMN IF NOT EXISTS tax_total DECIMAL(10, 2) NOT NULL DEFAULT 0
    `)
    await query(`
      ALTER TABLE billing_invoices
      ADD COLUMN IF NOT EXISTS tax_enabled BOOLEAN NOT NULL DEFAULT FALSE
    `)

    await query(`
      ALTER TABLE billing_invoice_items
      ADD COLUMN IF NOT EXISTS base_total DECIMAL(10, 2) NOT NULL DEFAULT 0
    `)
    await query(`
      ALTER TABLE billing_invoice_items
      ADD COLUMN IF NOT EXISTS discount_value DECIMAL(10, 2) NOT NULL DEFAULT 0
    `)
    await query(`
      ALTER TABLE billing_invoice_items
      ADD COLUMN IF NOT EXISTS tax_percent DECIMAL(5, 2) NOT NULL DEFAULT 0
    `)
    await query(`
      ALTER TABLE billing_invoice_items
      ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(10, 2) NOT NULL DEFAULT 0
    `)

    await query(`
      CREATE INDEX IF NOT EXISTS idx_billing_invoices_customer_id ON billing_invoices(customer_id)
    `)

    await query(`
      CREATE INDEX IF NOT EXISTS idx_billing_invoices_payment_status ON billing_invoices(payment_status)
    `)

    console.log("Database initialized successfully")
  } catch (error) {
    console.error("Error initializing database", error)
    throw error
  } finally {
    try {
      await query("SELECT pg_advisory_unlock($1)", [lockId])
    } catch (unlockError) {
      console.error("Error releasing database init lock", unlockError)
    }
  }
}

// Initialize the database on import
initDatabase().catch(console.error)
