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
);

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
);

ALTER TABLE products
ADD COLUMN IF NOT EXISTS brand_id INTEGER REFERENCES brands(id) ON DELETE SET NULL;

ALTER TABLE products
ADD COLUMN IF NOT EXISTS slug VARCHAR(255);

ALTER TABLE products
ADD COLUMN IF NOT EXISTS status VARCHAR(50) NOT NULL DEFAULT 'active';

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
);

CREATE TABLE IF NOT EXISTS product_tags (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  tag VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (product_id, tag)
);

ALTER TABLE cart_items
ADD COLUMN IF NOT EXISTS product_offer_id INTEGER REFERENCES product_offers(id) ON DELETE SET NULL;

ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS product_offer_id INTEGER REFERENCES product_offers(id) ON DELETE SET NULL;

ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS currency VARCHAR(10) NOT NULL DEFAULT 'INR';

ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS product_name VARCHAR(255);

ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS product_image VARCHAR(255);

ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS brand_name VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_products_brand_id ON products(brand_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_slug ON products(slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_product_offers_product_id ON product_offers(product_id);
CREATE INDEX IF NOT EXISTS idx_product_offers_source_id ON product_offers(source_id);
CREATE INDEX IF NOT EXISTS idx_product_offers_checkout_method ON product_offers(checkout_method);
CREATE INDEX IF NOT EXISTS idx_product_offers_is_primary ON product_offers(is_primary);
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_offers_source_external_offer_id
ON product_offers(source_id, external_offer_id)
WHERE external_offer_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_product_tags_product_id ON product_tags(product_id);
CREATE INDEX IF NOT EXISTS idx_product_tags_tag ON product_tags(tag);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_offer_id ON cart_items(product_offer_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_offer_id ON order_items(product_offer_id);
