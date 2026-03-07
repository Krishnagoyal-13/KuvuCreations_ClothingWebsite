import { sql } from "@vercel/postgres"

const globalForDbInit = globalThis as typeof globalThis & {
  __kuvuDbInitPromise?: Promise<void>
}

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
async function runDatabaseInit() {
  try {
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
        phone_number VARCHAR(30),
        opening_balance DECIMAL(10, 2) NOT NULL DEFAULT 0,
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
        paid_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
        payment_status VARCHAR(20) NOT NULL DEFAULT 'pending',
        tax_enabled BOOLEAN NOT NULL DEFAULT FALSE,
        customer_phone VARCHAR(30),
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT billing_payment_status_check CHECK (payment_status IN ('pending', 'paid'))
      )
    `)

    // Create billing returns table
    await query(`
      CREATE TABLE IF NOT EXISTS billing_returns (
        id SERIAL PRIMARY KEY,
        invoice_id INTEGER NOT NULL REFERENCES billing_invoices(id) ON DELETE CASCADE,
        customer_id INTEGER NOT NULL REFERENCES billing_customers(id) ON DELETE CASCADE,
        return_total DECIMAL(10, 2) NOT NULL DEFAULT 0,
        is_refunded BOOLEAN NOT NULL DEFAULT FALSE,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT billing_return_total_check CHECK (return_total >= 0)
      )
    `)

    // Create billing return items table
    await query(`
      CREATE TABLE IF NOT EXISTS billing_return_items (
        id SERIAL PRIMARY KEY,
        return_id INTEGER NOT NULL REFERENCES billing_returns(id) ON DELETE CASCADE,
        product_name VARCHAR(255) NOT NULL,
        product_type VARCHAR(100) NOT NULL DEFAULT 'Night suit',
        quantity INTEGER NOT NULL,
        unit_refund DECIMAL(10, 2) NOT NULL DEFAULT 0,
        line_refund DECIMAL(10, 2) NOT NULL DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT billing_return_item_quantity_check CHECK (quantity > 0),
        CONSTRAINT billing_return_item_unit_refund_check CHECK (unit_refund >= 0),
        CONSTRAINT billing_return_item_line_refund_check CHECK (line_refund >= 0)
      )
    `)

    // Create billing invoice items table
    await query(`
      CREATE TABLE IF NOT EXISTS billing_invoice_items (
        id SERIAL PRIMARY KEY,
        invoice_id INTEGER NOT NULL REFERENCES billing_invoices(id) ON DELETE CASCADE,
        product_name VARCHAR(255) NOT NULL,
        product_type VARCHAR(100) NOT NULL DEFAULT 'Night suit',
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

    // Create stock table to track purchased stock per product type
    await query(`
      CREATE TABLE IF NOT EXISTS billing_stock_categories (
        id SERIAL PRIMARY KEY,
        product_type VARCHAR(100) NOT NULL UNIQUE,
        purchased_qty INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT billing_stock_purchased_qty_check CHECK (purchased_qty >= 0)
      )
    `)

    // Backward-compatible schema upgrades for existing billing tables.
    await query(`
      ALTER TABLE billing_customers
      ADD COLUMN IF NOT EXISTS opening_balance DECIMAL(10, 2) NOT NULL DEFAULT 0
    `)
    await query(`
      ALTER TABLE billing_customers
      ADD COLUMN IF NOT EXISTS phone_number VARCHAR(30)
    `)

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
      ADD COLUMN IF NOT EXISTS paid_amount DECIMAL(10, 2) NOT NULL DEFAULT 0
    `)
    await query(`
      ALTER TABLE billing_invoices
      ADD COLUMN IF NOT EXISTS tax_enabled BOOLEAN NOT NULL DEFAULT FALSE
    `)
    await query(`
      ALTER TABLE billing_invoices
      ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(30)
    `)
    await query(`
      ALTER TABLE billing_returns
      ADD COLUMN IF NOT EXISTS is_refunded BOOLEAN NOT NULL DEFAULT FALSE
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
      ALTER TABLE billing_invoice_items
      ADD COLUMN IF NOT EXISTS product_type VARCHAR(100) NOT NULL DEFAULT 'Night suit'
    `)

    await query(`
      CREATE INDEX IF NOT EXISTS idx_billing_invoices_customer_id ON billing_invoices(customer_id)
    `)

    await query(`
      CREATE INDEX IF NOT EXISTS idx_billing_invoices_payment_status ON billing_invoices(payment_status)
    `)
    await query(`
      CREATE INDEX IF NOT EXISTS idx_billing_returns_invoice_id ON billing_returns(invoice_id)
    `)
    await query(`
      CREATE INDEX IF NOT EXISTS idx_billing_returns_customer_id ON billing_returns(customer_id)
    `)

    await query(`
      CREATE INDEX IF NOT EXISTS idx_billing_invoice_items_product_type ON billing_invoice_items(product_type)
    `)
    await query(`
      CREATE INDEX IF NOT EXISTS idx_billing_return_items_product_type ON billing_return_items(product_type)
    `)

    console.log("Database initialized successfully")
  } catch (error: any) {
    // Another worker may have completed CREATE TABLE first.
    if (error?.code === "23505" && error?.constraint === "pg_type_typname_nsp_index") {
      console.warn("Database init race detected; continuing with existing schema")
      return
    }
    console.error("Error initializing database", error)
    throw error
  }
}

export async function initDatabase() {
  if (!globalForDbInit.__kuvuDbInitPromise) {
    globalForDbInit.__kuvuDbInitPromise = runDatabaseInit().catch((error) => {
      globalForDbInit.__kuvuDbInitPromise = undefined
      throw error
    })
  }

  return globalForDbInit.__kuvuDbInitPromise
}

// Initialize the database on import
initDatabase().catch(console.error)
