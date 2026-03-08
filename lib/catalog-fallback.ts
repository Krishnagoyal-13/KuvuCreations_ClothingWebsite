import { marketplaceBrands, marketplaceExternalSources, marketplaceProducts } from "./marketplace-seed-data"

const brandBySlug = new Map(marketplaceBrands.map((brand) => [brand.slug, brand]))
const sourceBySlug = new Map(marketplaceExternalSources.map((source) => [source.slug, source]))

export const fallbackCatalogProducts = marketplaceProducts.map((product, index) => {
  const brand = brandBySlug.get(product.brandSlug)

  return {
    id: String(index + 1),
    name: product.name,
    brandName: brand?.name ?? "Independent Label",
    brandSlug: brand?.slug ?? null,
    brandWebsiteUrl: brand?.websiteUrl ?? null,
    description: product.description,
    price: product.price,
    image: product.image,
    tags: product.tags,
    offers: product.offers.map((offer, offerIndex) => {
      const source = sourceBySlug.get(offer.sourceSlug)

      return {
        merchantName: offer.merchantName ?? brand?.name ?? "Marketplace Seller",
        sourceName: source?.name ?? "Direct Source",
        offerUrl: offer.offerUrl ?? "",
        checkoutMethod: offer.checkoutMethod ?? "external",
        price: offer.price,
        compareAtPrice: offer.compareAtPrice ?? null,
        currency: offer.currency ?? "INR",
        availability: offer.availability ?? "unknown",
        isPrimary: offer.isPrimary ?? offerIndex === 0,
      }
    }),
  }
})
