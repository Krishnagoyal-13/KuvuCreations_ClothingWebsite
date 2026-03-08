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

    // Create brands table for third-party marketplace catalog ownership
    await query(`
      CREATE TABLE IF NOT EXISTS brands (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        logo_url TEXT,
        website_url TEXT,
        status VARCHAR(50) NOT NULL DEFAULT 'active',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT brands_status_check CHECK (status IN ('active', 'inactive'))
      )
    `)

    // Track the upstream source for external marketplace offers
    await query(`
      CREATE TABLE IF NOT EXISTS external_sources (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL UNIQUE,
        kind VARCHAR(50) NOT NULL DEFAULT 'brand_site',
        base_url TEXT,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT external_sources_kind_check CHECK (kind IN ('brand_site', 'affiliate_feed', 'manual_import', 'api'))
      )
    `)

    // Extend products for marketplace ownership without breaking legacy queries
    await query(`
      ALTER TABLE products
      ADD COLUMN IF NOT EXISTS brand_id INTEGER REFERENCES brands(id) ON DELETE SET NULL
    `)
    await query(`
      ALTER TABLE products
      ADD COLUMN IF NOT EXISTS slug VARCHAR(255)
    `)
    await query(`
      ALTER TABLE products
      ADD COLUMN IF NOT EXISTS status VARCHAR(50) NOT NULL DEFAULT 'active'
    `)

    // Each product can have multiple sellable offers across external sources
    await query(`
      CREATE TABLE IF NOT EXISTS product_offers (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        source_id INTEGER REFERENCES external_sources(id) ON DELETE SET NULL,
        external_offer_id VARCHAR(255),
        merchant_name VARCHAR(255),
        offer_url TEXT,
        checkout_method VARCHAR(20) NOT NULL DEFAULT 'external',
        price DECIMAL(10, 2) NOT NULL,
        compare_at_price DECIMAL(10, 2),
        currency VARCHAR(10) NOT NULL DEFAULT 'INR',
        availability VARCHAR(50) NOT NULL DEFAULT 'in_stock',
        sku VARCHAR(100),
        inventory_quantity INTEGER,
        image TEXT,
        is_primary BOOLEAN NOT NULL DEFAULT FALSE,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        last_synced_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT product_offers_checkout_method_check CHECK (checkout_method IN ('external', 'internal')),
        CONSTRAINT product_offers_availability_check CHECK (
          availability IN ('in_stock', 'out_of_stock', 'preorder', 'unknown')
        ),
        CONSTRAINT product_offers_external_link_check CHECK (
          (checkout_method = 'external' AND offer_url IS NOT NULL) OR
          checkout_method = 'internal'
        )
      )
    `)

    // Product tags remain normalized for lightweight filtering
    await query(`
      CREATE TABLE IF NOT EXISTS product_tags (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        tag VARCHAR(100) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (product_id, tag)
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

    // Keep cart and order rows ready for future internal checkout by storing a selected offer
    await query(`
      ALTER TABLE cart_items
      ADD COLUMN IF NOT EXISTS product_offer_id INTEGER REFERENCES product_offers(id) ON DELETE SET NULL
    `)
    await query(`
      ALTER TABLE order_items
      ADD COLUMN IF NOT EXISTS product_offer_id INTEGER REFERENCES product_offers(id) ON DELETE SET NULL
    `)
    await query(`
      ALTER TABLE order_items
      ADD COLUMN IF NOT EXISTS currency VARCHAR(10) NOT NULL DEFAULT 'INR'
    `)
    await query(`
      ALTER TABLE order_items
      ADD COLUMN IF NOT EXISTS product_name VARCHAR(255)
    `)
    await query(`
      ALTER TABLE order_items
      ADD COLUMN IF NOT EXISTS product_image VARCHAR(255)
    `)
    await query(`
      ALTER TABLE order_items
      ADD COLUMN IF NOT EXISTS brand_name VARCHAR(255)
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

    await query(`
      CREATE INDEX IF NOT EXISTS idx_products_brand_id ON products(brand_id)
    `)
    await query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_products_slug ON products(slug) WHERE slug IS NOT NULL
    `)
    await query(`
      CREATE INDEX IF NOT EXISTS idx_products_status ON products(status)
    `)
    await query(`
      CREATE INDEX IF NOT EXISTS idx_product_offers_product_id ON product_offers(product_id)
    `)
    await query(`
      CREATE INDEX IF NOT EXISTS idx_product_offers_source_id ON product_offers(source_id)
    `)
    await query(`
      CREATE INDEX IF NOT EXISTS idx_product_offers_checkout_method ON product_offers(checkout_method)
    `)
    await query(`
      CREATE INDEX IF NOT EXISTS idx_product_offers_is_primary ON product_offers(is_primary)
    `)
    await query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_product_offers_source_external_offer_id
      ON product_offers(source_id, external_offer_id)
      WHERE external_offer_id IS NOT NULL
    `)
    await query(`
      CREATE INDEX IF NOT EXISTS idx_product_tags_product_id ON product_tags(product_id)
    `)
    await query(`
      CREATE INDEX IF NOT EXISTS idx_product_tags_tag ON product_tags(tag)
    `)
    await query(`
      CREATE INDEX IF NOT EXISTS idx_cart_items_product_offer_id ON cart_items(product_offer_id)
    `)
    await query(`
      CREATE INDEX IF NOT EXISTS idx_order_items_product_offer_id ON order_items(product_offer_id)
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
