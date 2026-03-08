import { query } from "./db"
import { marketplaceBrands, marketplaceExternalSources, marketplaceProducts } from "./marketplace-seed-data"
import type {
  MarketplaceSeedBrand,
  MarketplaceSeedExternalSource,
  MarketplaceSeedProduct,
  MarketplaceSeedProductOffer,
  SeedMarketplaceResult,
} from "./marketplace-types"

function normalizeOptionalText(value?: string | null) {
  const normalized = value?.trim()
  return normalized && normalized.length > 0 ? normalized : null
}

async function upsertBrand(brand: MarketplaceSeedBrand) {
  const existingBrandResult = await query("SELECT id FROM brands WHERE slug = $1 LIMIT 1", [brand.slug])

  if (existingBrandResult.rows.length > 0) {
    const brandId = existingBrandResult.rows[0].id
    await query(
      `
        UPDATE brands
        SET name = $1,
            description = $2,
            logo_url = $3,
            website_url = $4,
            status = $5,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $6
      `,
      [
        brand.name,
        normalizeOptionalText(brand.description),
        normalizeOptionalText(brand.logoUrl),
        normalizeOptionalText(brand.websiteUrl),
        brand.status ?? "active",
        brandId,
      ],
    )

    return Number(brandId)
  }

  const insertedBrandResult = await query(
    `
      INSERT INTO brands (name, slug, description, logo_url, website_url, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `,
    [
      brand.name,
      brand.slug,
      normalizeOptionalText(brand.description),
      normalizeOptionalText(brand.logoUrl),
      normalizeOptionalText(brand.websiteUrl),
      brand.status ?? "active",
    ],
  )

  return Number(insertedBrandResult.rows[0].id)
}

async function upsertExternalSource(source: MarketplaceSeedExternalSource) {
  const existingSourceResult = await query("SELECT id FROM external_sources WHERE slug = $1 LIMIT 1", [source.slug])

  if (existingSourceResult.rows.length > 0) {
    const sourceId = existingSourceResult.rows[0].id
    await query(
      `
        UPDATE external_sources
        SET name = $1,
            kind = $2,
            base_url = $3,
            is_active = $4,
            metadata = $5::jsonb,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $6
      `,
      [
        source.name,
        source.kind,
        normalizeOptionalText(source.baseUrl),
        source.isActive ?? true,
        JSON.stringify(source.metadata ?? {}),
        sourceId,
      ],
    )

    return Number(sourceId)
  }

  const insertedSourceResult = await query(
    `
      INSERT INTO external_sources (name, slug, kind, base_url, is_active, metadata)
      VALUES ($1, $2, $3, $4, $5, $6::jsonb)
      RETURNING id
    `,
    [
      source.name,
      source.slug,
      source.kind,
      normalizeOptionalText(source.baseUrl),
      source.isActive ?? true,
      JSON.stringify(source.metadata ?? {}),
    ],
  )

  return Number(insertedSourceResult.rows[0].id)
}

async function upsertProduct(product: MarketplaceSeedProduct, brandId: number) {
  const existingProductResult = await query("SELECT id FROM products WHERE slug = $1 LIMIT 1", [product.slug])

  if (existingProductResult.rows.length > 0) {
    const productId = existingProductResult.rows[0].id
    await query(
      `
        UPDATE products
        SET brand_id = $1,
            name = $2,
            description = $3,
            price = $4,
            image = $5,
            status = $6,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $7
      `,
      [brandId, product.name, product.description, product.price, product.image, product.status ?? "active", productId],
    )

    return Number(productId)
  }

  const insertedProductResult = await query(
    `
      INSERT INTO products (brand_id, name, slug, description, price, image, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `,
    [brandId, product.name, product.slug, product.description, product.price, product.image, product.status ?? "active"],
  )

  return Number(insertedProductResult.rows[0].id)
}

async function replaceProductTags(productId: number, tags: string[]) {
  await query("DELETE FROM product_tags WHERE product_id = $1", [productId])

  for (const tag of tags) {
    const normalizedTag = tag.trim().toLowerCase()

    if (normalizedTag.length === 0) {
      continue
    }

    await query("INSERT INTO product_tags (product_id, tag) VALUES ($1, $2)", [productId, normalizedTag])
  }
}

async function replaceProductOffers(
  productId: number,
  offers: MarketplaceSeedProductOffer[],
  sourceIdsBySlug: Map<string, number>,
) {
  await query("DELETE FROM product_offers WHERE product_id = $1", [productId])

  for (const offer of offers) {
    const sourceId = sourceIdsBySlug.get(offer.sourceSlug)

    if (!sourceId) {
      throw new Error(`Unknown external source slug: ${offer.sourceSlug}`)
    }

    await query(
      `
        INSERT INTO product_offers (
          product_id,
          source_id,
          external_offer_id,
          merchant_name,
          offer_url,
          checkout_method,
          price,
          compare_at_price,
          currency,
          availability,
          sku,
          inventory_quantity,
          image,
          is_primary,
          is_active,
          last_synced_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      `,
      [
        productId,
        sourceId,
        normalizeOptionalText(offer.externalOfferId),
        normalizeOptionalText(offer.merchantName),
        normalizeOptionalText(offer.offerUrl),
        offer.checkoutMethod ?? "external",
        offer.price,
        offer.compareAtPrice ?? null,
        offer.currency ?? "INR",
        offer.availability ?? "in_stock",
        normalizeOptionalText(offer.sku),
        offer.inventoryQuantity ?? null,
        normalizeOptionalText(offer.image),
        offer.isPrimary ?? false,
        offer.isActive ?? true,
        offer.lastSyncedAt ?? null,
      ],
    )
  }
}

export async function seedMarketplaceCatalog(): Promise<SeedMarketplaceResult> {
  const brandIdsBySlug = new Map<string, number>()
  const sourceIdsBySlug = new Map<string, number>()

  for (const brand of marketplaceBrands) {
    const brandId = await upsertBrand(brand)
    brandIdsBySlug.set(brand.slug, brandId)
  }

  for (const source of marketplaceExternalSources) {
    const sourceId = await upsertExternalSource(source)
    sourceIdsBySlug.set(source.slug, sourceId)
  }

  let offerCount = 0
  let tagCount = 0

  for (const product of marketplaceProducts) {
    const brandId = brandIdsBySlug.get(product.brandSlug)

    if (!brandId) {
      throw new Error(`Unknown brand slug: ${product.brandSlug}`)
    }

    const productId = await upsertProduct(product, brandId)
    await replaceProductTags(productId, product.tags)
    await replaceProductOffers(productId, product.offers, sourceIdsBySlug)

    offerCount += product.offers.length
    tagCount += product.tags.length
  }

  return {
    brands: marketplaceBrands.length,
    externalSources: marketplaceExternalSources.length,
    products: marketplaceProducts.length,
    offers: offerCount,
    tags: tagCount,
  }
}
