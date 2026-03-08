export type BrandStatus = "active" | "inactive"

export type ProductStatus = "draft" | "active" | "archived"

export type ExternalSourceKind = "brand_site" | "affiliate_feed" | "manual_import" | "api"

export type CheckoutMethod = "external" | "internal"

export type OfferAvailability = "in_stock" | "out_of_stock" | "preorder" | "unknown"

export interface BrandRow {
  id: number
  name: string
  slug: string
  description: string | null
  logo_url: string | null
  website_url: string | null
  status: BrandStatus
  created_at: string
  updated_at: string
}

export interface ExternalSourceRow {
  id: number
  name: string
  slug: string
  kind: ExternalSourceKind
  base_url: string | null
  is_active: boolean
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface ProductRow {
  id: number
  brand_id: number | null
  name: string
  slug: string | null
  description: string | null
  price: number | string
  image: string | null
  status: string
  created_at: string
  updated_at: string
}

export interface ProductOfferRow {
  id: number
  product_id: number
  source_id: number | null
  external_offer_id: string | null
  merchant_name: string | null
  offer_url: string | null
  checkout_method: CheckoutMethod
  price: number | string
  compare_at_price: number | string | null
  currency: string
  availability: OfferAvailability
  sku: string | null
  inventory_quantity: number | null
  image: string | null
  is_primary: boolean
  is_active: boolean
  last_synced_at: string | null
  created_at: string
  updated_at: string
}

export interface ProductTagRow {
  id: number
  product_id: number
  tag: string
  created_at: string
}

export interface MarketplaceSeedBrand {
  name: string
  slug: string
  description?: string
  logoUrl?: string
  websiteUrl?: string
  status?: BrandStatus
}

export interface MarketplaceSeedExternalSource {
  name: string
  slug: string
  kind: ExternalSourceKind
  baseUrl?: string
  isActive?: boolean
  metadata?: Record<string, unknown>
}

export interface MarketplaceSeedProductOffer {
  sourceSlug: string
  externalOfferId?: string
  merchantName?: string
  offerUrl?: string
  checkoutMethod?: CheckoutMethod
  price: number
  compareAtPrice?: number
  currency?: string
  availability?: OfferAvailability
  sku?: string
  inventoryQuantity?: number
  image?: string
  isPrimary?: boolean
  isActive?: boolean
  lastSyncedAt?: string
}

export interface MarketplaceSeedProduct {
  brandSlug: string
  name: string
  slug: string
  description: string
  price: number
  image: string
  status?: ProductStatus
  tags: string[]
  offers: MarketplaceSeedProductOffer[]
}

export interface SeedMarketplaceResult {
  brands: number
  externalSources: number
  products: number
  offers: number
  tags: number
}
