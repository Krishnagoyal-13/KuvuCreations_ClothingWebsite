import { fallbackCatalogProducts } from "./catalog-fallback"
import {
  catalogParamByFacetKey,
  catalogPriceRangeOptions,
  catalogTagFacetDefinitions,
  createDefaultCatalogBrowseFilters,
  type CatalogBrowseFilters,
  type CatalogFacetKey,
  type CatalogPriceRange,
} from "./catalog-filters"
import { query } from "./db"

export type { CatalogBrowseFilters, CatalogPriceRange, CatalogSortOption } from "./catalog-filters"

export interface CatalogListProduct {
  id: string
  name: string
  brandName: string
  brandSlug: string | null
  description: string
  price: number
  compareAtPrice: number | null
  currency: string
  image: string
  primaryOfferUrl: string | null
  offerCount: number
  isNew: boolean
  isSale: boolean
}

export interface CatalogOffer {
  id: string
  merchantName: string
  sourceName: string
  offerUrl: string | null
  checkoutMethod: "external" | "internal"
  price: number
  compareAtPrice: number | null
  currency: string
  availability: string
  image: string | null
  isPrimary: boolean
}

export interface CatalogProductDetail {
  id: string
  name: string
  brandName: string
  brandSlug: string | null
  brandWebsiteUrl: string | null
  description: string
  details: string
  price: number
  compareAtPrice: number | null
  currency: string
  image: string
  images: string[]
  tags: string[]
  offers: CatalogOffer[]
  isNew: boolean
  isSale: boolean
}

export interface CatalogFacetOption {
  value: string
  label: string
  count: number
  selected: boolean
}

export interface CatalogFacetSection {
  key: CatalogFacetKey
  label: string
  param: string
  type: "multi" | "single"
  options: CatalogFacetOption[]
}

export interface CatalogBrowseData {
  products: CatalogListProduct[]
  facets: CatalogFacetSection[]
  totalCount: number
  filteredCount: number
}

interface CatalogBrowseProduct extends CatalogListProduct {
  createdAt: string | null
  tags: string[]
}

function parseMoney(value: number | string | null | undefined) {
  if (value == null) {
    return null
  }

  const parsed = Number.parseFloat(String(value))
  return Number.isFinite(parsed) ? parsed : null
}

function parseTagList(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .map((tag) => String(tag).trim().toLowerCase())
      .filter((tag) => tag.length > 0)
  }

  if (typeof value !== "string") {
    return []
  }

  const normalizedValue = value.trim()

  if (normalizedValue === "{}" || normalizedValue.length === 0) {
    return []
  }

  return normalizedValue
    .replace(/^\{|\}$/g, "")
    .split(",")
    .map((tag) => tag.trim().replace(/^"|"$/g, "").toLowerCase())
    .filter((tag) => tag.length > 0)
}

function dedupeImages(images: Array<string | null | undefined>) {
  return Array.from(
    new Set(images.filter((image): image is string => typeof image === "string" && image.trim().length > 0)),
  )
}

function getProductNumber(id: string) {
  const parsedId = Number.parseInt(id, 10)
  return Number.isFinite(parsedId) ? parsedId : 0
}

function buildFallbackBrowseProducts(): CatalogBrowseProduct[] {
  return fallbackCatalogProducts.map((product) => {
    const primaryOffer = product.offers.find((offer) => offer.isPrimary) ?? product.offers[0]

    return {
      id: product.id,
      name: product.name,
      brandName: product.brandName,
      brandSlug: product.brandSlug ?? null,
      description: product.description,
      price: primaryOffer?.price ?? product.price,
      compareAtPrice: primaryOffer?.compareAtPrice ?? null,
      currency: primaryOffer?.currency ?? "INR",
      image: product.image,
      primaryOfferUrl: primaryOffer?.offerUrl ?? null,
      offerCount: product.offers.length,
      isNew: getProductNumber(product.id) % 5 === 0,
      isSale:
        primaryOffer?.compareAtPrice != null
          ? primaryOffer.compareAtPrice > primaryOffer.price
          : product.offers.some((offer) => (offer.compareAtPrice ?? 0) > offer.price),
      createdAt: null,
      tags: product.tags ?? [],
    }
  })
}

function toCatalogListProduct(product: CatalogBrowseProduct): CatalogListProduct {
  return {
    id: product.id,
    name: product.name,
    brandName: product.brandName,
    brandSlug: product.brandSlug,
    description: product.description,
    price: product.price,
    compareAtPrice: product.compareAtPrice,
    currency: product.currency,
    image: product.image,
    primaryOfferUrl: product.primaryOfferUrl,
    offerCount: product.offerCount,
    isNew: product.isNew,
    isSale: product.isSale,
  }
}

async function loadCatalogBrowseProducts(): Promise<CatalogBrowseProduct[]> {
  try {
    const result = await query(
      `
        SELECT
          p.id,
          p.name,
          p.description,
          p.price,
          p.image,
          p.created_at,
          b.name AS brand_name,
          b.slug AS brand_slug,
          primary_offer.price AS primary_offer_price,
          primary_offer.compare_at_price AS primary_offer_compare_at_price,
          primary_offer.currency AS primary_offer_currency,
          primary_offer.offer_url AS primary_offer_url,
          COALESCE(offer_counts.offer_count, 0) AS offer_count,
          COALESCE(
            ARRAY_AGG(DISTINCT pt.tag) FILTER (WHERE pt.tag IS NOT NULL),
            '{}'::text[]
          ) AS tags
        FROM products p
        LEFT JOIN brands b ON b.id = p.brand_id
        LEFT JOIN product_tags pt ON pt.product_id = p.id
        LEFT JOIN LATERAL (
          SELECT po.price, po.compare_at_price, po.currency, po.offer_url
          FROM product_offers po
          WHERE po.product_id = p.id AND po.is_active = TRUE
          ORDER BY po.is_primary DESC, po.price ASC, po.id ASC
          LIMIT 1
        ) primary_offer ON TRUE
        LEFT JOIN LATERAL (
          SELECT COUNT(*)::INTEGER AS offer_count
          FROM product_offers po
          WHERE po.product_id = p.id AND po.is_active = TRUE
        ) offer_counts ON TRUE
        WHERE p.status = 'active'
        GROUP BY
          p.id,
          p.name,
          p.description,
          p.price,
          p.image,
          p.created_at,
          b.name,
          b.slug,
          primary_offer.price,
          primary_offer.compare_at_price,
          primary_offer.currency,
          primary_offer.offer_url,
          offer_counts.offer_count
        ORDER BY p.created_at DESC, p.id DESC
      `,
    )

    if (result.rows.length === 0) {
      return buildFallbackBrowseProducts()
    }

    return result.rows.map((product) => {
      const price = parseMoney(product.primary_offer_price) ?? parseMoney(product.price) ?? 0
      const compareAtPrice = parseMoney(product.primary_offer_compare_at_price)

      return {
        id: String(product.id),
        name: product.name,
        brandName: product.brand_name ?? "Independent Label",
        brandSlug: product.brand_slug ?? null,
        description: product.description ?? "Curated marketplace product.",
        price,
        compareAtPrice,
        currency: product.primary_offer_currency ?? "INR",
        image: product.image || `/placeholder.svg?height=400&width=300&text=Product+${product.id}`,
        primaryOfferUrl: product.primary_offer_url ?? null,
        offerCount: Number(product.offer_count ?? 0),
        isNew: getProductNumber(String(product.id)) % 5 === 0,
        isSale: compareAtPrice != null && compareAtPrice > price,
        createdAt: product.created_at ? String(product.created_at) : null,
        tags: parseTagList(product.tags),
      }
    })
  } catch (error) {
    console.error("Error fetching catalog browse products:", error)
    return buildFallbackBrowseProducts()
  }
}

function matchesPriceRange(price: number, priceRange: CatalogPriceRange) {
  switch (priceRange) {
    case "under-50":
      return price < 50
    case "50-100":
      return price >= 50 && price <= 100
    case "100-200":
      return price > 100 && price <= 200
    case "over-200":
      return price > 200
    case "all":
    default:
      return true
  }
}

function productMatchesFilters(
  product: CatalogBrowseProduct,
  filters: CatalogBrowseFilters,
  excludedFacetKey?: CatalogFacetKey,
) {
  if (excludedFacetKey !== "brands" && filters.brands.length > 0) {
    if (!product.brandSlug || !filters.brands.includes(product.brandSlug)) {
      return false
    }
  }

  if (excludedFacetKey !== "categories" && filters.categories.length > 0) {
    if (!filters.categories.some((value) => product.tags.includes(value))) {
      return false
    }
  }

  if (excludedFacetKey !== "colors" && filters.colors.length > 0) {
    if (!filters.colors.some((value) => product.tags.includes(value))) {
      return false
    }
  }

  if (excludedFacetKey !== "fits" && filters.fits.length > 0) {
    if (!filters.fits.some((value) => product.tags.includes(value))) {
      return false
    }
  }

  if (excludedFacetKey !== "styles" && filters.styles.length > 0) {
    if (!filters.styles.some((value) => product.tags.includes(value))) {
      return false
    }
  }

  if (excludedFacetKey !== "priceRange" && filters.priceRange !== "all") {
    if (!matchesPriceRange(product.price, filters.priceRange)) {
      return false
    }
  }

  return true
}

function compareProductsBySort(a: CatalogBrowseProduct, b: CatalogBrowseProduct, sort: CatalogBrowseFilters["sort"]) {
  if (sort === "price-low") {
    if (a.price !== b.price) {
      return a.price - b.price
    }
  } else if (sort === "price-high") {
    if (a.price !== b.price) {
      return b.price - a.price
    }
  } else {
    const timestampA = a.createdAt ? new Date(a.createdAt).getTime() : 0
    const timestampB = b.createdAt ? new Date(b.createdAt).getTime() : 0

    if (timestampA !== timestampB) {
      return timestampB - timestampA
    }
  }

  return getProductNumber(b.id) - getProductNumber(a.id)
}

function buildCatalogFacetSections(products: CatalogBrowseProduct[], filters: CatalogBrowseFilters): CatalogFacetSection[] {
  const sections: CatalogFacetSection[] = []

  const brandBaseProducts = products.filter((product) => productMatchesFilters(product, filters, "brands"))
  const brandCounts = new Map<string, { label: string; count: number }>()

  for (const product of brandBaseProducts) {
    if (!product.brandSlug) {
      continue
    }

    const existingBrand = brandCounts.get(product.brandSlug)

    if (existingBrand) {
      existingBrand.count += 1
      continue
    }

    brandCounts.set(product.brandSlug, {
      label: product.brandName,
      count: 1,
    })
  }

  const brandOptions = Array.from(brandCounts.entries())
    .map(([value, brand]) => ({
      value,
      label: brand.label,
      count: brand.count,
      selected: filters.brands.includes(value),
    }))
    .sort((left, right) => left.label.localeCompare(right.label))

  if (brandOptions.length > 0) {
    sections.push({
      key: "brands",
      label: "Brand",
      param: catalogParamByFacetKey.brands,
      type: "multi",
      options: brandOptions,
    })
  }

  for (const facetDefinition of catalogTagFacetDefinitions) {
    const baseProducts = products.filter((product) => productMatchesFilters(product, filters, facetDefinition.key))
    const selectedValues = filters[facetDefinition.key]

    const options = facetDefinition.options
      .map((option) => ({
        value: option.value,
        label: option.label,
        count: baseProducts.filter((product) => product.tags.includes(option.value)).length,
        selected: selectedValues.includes(option.value),
      }))
      .filter((option) => option.count > 0 || option.selected)

    if (options.length === 0) {
      continue
    }

    sections.push({
      key: facetDefinition.key,
      label: facetDefinition.label,
      param: facetDefinition.param,
      type: "multi",
      options,
    })
  }

  const priceBaseProducts = products.filter((product) => productMatchesFilters(product, filters, "priceRange"))

  sections.push({
    key: "priceRange",
    label: "Price Range",
    param: catalogParamByFacetKey.priceRange,
    type: "single",
    options: catalogPriceRangeOptions.map((option) => ({
      value: option.value,
      label: option.label,
      count: option.value === "all" ? priceBaseProducts.length : priceBaseProducts.filter((product) => matchesPriceRange(product.price, option.value)).length,
      selected: filters.priceRange === option.value,
    })),
  })

  return sections
}

export async function getCatalogBrowseData(filters: CatalogBrowseFilters = createDefaultCatalogBrowseFilters()): Promise<CatalogBrowseData> {
  const products = await loadCatalogBrowseProducts()
  const filteredProducts = products
    .filter((product) => productMatchesFilters(product, filters))
    .sort((left, right) => compareProductsBySort(left, right, filters.sort))

  return {
    products: filteredProducts.map(toCatalogListProduct),
    facets: buildCatalogFacetSections(products, filters),
    totalCount: products.length,
    filteredCount: filteredProducts.length,
  }
}

export async function getCatalogProducts(filters: CatalogBrowseFilters = createDefaultCatalogBrowseFilters()): Promise<CatalogListProduct[]> {
  const browseData = await getCatalogBrowseData(filters)
  return browseData.products
}

export async function getCatalogProductIds(): Promise<string[]> {
  try {
    const result = await query("SELECT id FROM products WHERE status = 'active' ORDER BY created_at DESC, id DESC")

    if (result.rows.length === 0) {
      return fallbackCatalogProducts.map((product) => product.id)
    }

    return result.rows.map((product) => String(product.id))
  } catch (error) {
    console.error("Error fetching catalog product ids:", error)
    return fallbackCatalogProducts.map((product) => product.id)
  }
}

export async function getCatalogProductById(id: string): Promise<CatalogProductDetail | null> {
  try {
    const productResult = await query(
      `
        SELECT
          p.id,
          p.name,
          p.description,
          p.price,
          p.image,
          p.created_at,
          p.slug,
          b.name AS brand_name,
          b.slug AS brand_slug,
          b.website_url AS brand_website_url
        FROM products p
        LEFT JOIN brands b ON b.id = p.brand_id
        WHERE p.id = $1
        LIMIT 1
      `,
      [id],
    )

    if (productResult.rows.length === 0) {
      return buildFallbackProductDetail(id)
    }

    const product = productResult.rows[0]
    const tagsResult = await query("SELECT tag FROM product_tags WHERE product_id = $1 ORDER BY tag ASC", [id])
    const offersResult = await query(
      `
        SELECT
          po.id,
          po.offer_url,
          po.checkout_method,
          po.price,
          po.compare_at_price,
          po.currency,
          po.availability,
          po.image,
          po.is_primary,
          COALESCE(po.merchant_name, es.name, b.name, 'Marketplace Seller') AS merchant_name,
          COALESCE(es.name, 'Direct Source') AS source_name
        FROM product_offers po
        LEFT JOIN external_sources es ON es.id = po.source_id
        LEFT JOIN products p ON p.id = po.product_id
        LEFT JOIN brands b ON b.id = p.brand_id
        WHERE po.product_id = $1 AND po.is_active = TRUE
        ORDER BY po.is_primary DESC, po.price ASC, po.id ASC
      `,
      [id],
    )

    const offers: CatalogOffer[] = offersResult.rows.map((offer) => ({
      id: String(offer.id),
      merchantName: offer.merchant_name,
      sourceName: offer.source_name,
      offerUrl: offer.offer_url ?? null,
      checkoutMethod: offer.checkout_method,
      price: parseMoney(offer.price) ?? 0,
      compareAtPrice: parseMoney(offer.compare_at_price),
      currency: offer.currency ?? "INR",
      availability: offer.availability ?? "unknown",
      image: offer.image ?? null,
      isPrimary: offer.is_primary === true,
    }))

    const primaryOffer = offers.find((offer) => offer.isPrimary) ?? offers[0]
    const imageSet = dedupeImages([
      product.image,
      ...offers.map((offer) => offer.image),
    ])

    return {
      id: String(product.id),
      name: product.name,
      brandName: product.brand_name ?? "Independent Label",
      brandSlug: product.brand_slug ?? null,
      brandWebsiteUrl: product.brand_website_url ?? null,
      description: product.description ?? "Curated marketplace product.",
      details: product.description ?? "Curated marketplace product.",
      price: primaryOffer?.price ?? parseMoney(product.price) ?? 0,
      compareAtPrice: primaryOffer?.compareAtPrice ?? null,
      currency: primaryOffer?.currency ?? "INR",
      image: product.image || `/placeholder.svg?height=600&width=500&text=Product+${product.id}`,
      images: imageSet.length > 0 ? imageSet : [`/placeholder.svg?height=600&width=500&text=Product+${product.id}`],
      tags: tagsResult.rows.map((tagRow) => tagRow.tag),
      offers,
      isNew: getProductNumber(String(product.id)) % 5 === 0,
      isSale: primaryOffer?.compareAtPrice != null ? primaryOffer.compareAtPrice > primaryOffer.price : false,
    }
  } catch (error) {
    console.error("Error fetching catalog product:", error)
    return buildFallbackProductDetail(id)
  }
}

function buildFallbackProductDetail(id: string): CatalogProductDetail | null {
  const product = fallbackCatalogProducts.find((entry) => entry.id === id)

  if (!product) {
    return null
  }

  const offers: CatalogOffer[] = product.offers.map((offer, index): CatalogOffer => ({
    id: `${product.id}-${index + 1}`,
    merchantName: offer.merchantName,
    sourceName: offer.sourceName,
    offerUrl: offer.offerUrl,
    checkoutMethod: offer.checkoutMethod ?? "external",
    price: offer.price,
    compareAtPrice: offer.compareAtPrice ?? null,
    currency: offer.currency ?? "INR",
    availability: offer.availability ?? "in_stock",
    image: null,
    isPrimary: offer.isPrimary ?? index === 0,
  }))

  const primaryOffer = offers.find((offer) => offer.isPrimary) ?? offers[0]

  return {
    id: product.id,
    name: product.name,
    brandName: product.brandName,
    brandSlug: product.brandSlug ?? null,
    brandWebsiteUrl: product.brandWebsiteUrl ?? null,
    description: product.description,
    details: product.description,
    price: primaryOffer?.price ?? product.price,
    compareAtPrice: primaryOffer?.compareAtPrice ?? null,
    currency: primaryOffer?.currency ?? "INR",
    image: product.image,
    images: dedupeImages([product.image]),
    tags: product.tags ?? [],
    offers,
    isNew: getProductNumber(product.id) % 5 === 0,
    isSale: primaryOffer?.compareAtPrice != null ? primaryOffer.compareAtPrice > primaryOffer.price : false,
  }
}
