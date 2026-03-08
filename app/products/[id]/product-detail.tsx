interface ProductOffer {
  id: string
  merchantName: string
  sourceName: string
  offerUrl: string | null
  checkoutMethod: "external" | "internal"
  price: number
  compareAtPrice: number | null
  currency: string
  availability: string
  isPrimary: boolean
}

interface Product {
  id: string
  name: string
  brandName: string
  brandSlug: string | null
  brandWebsiteUrl: string | null
  price: number
  compareAtPrice: number | null
  currency: string
  description: string
  details: string
  image: string
  images: string[]
  tags: string[]
  offers: ProductOffer[]
  isNew: boolean
  isSale: boolean
}

interface ProductDetailProps {
  product: Product
}

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency || "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

function formatAvailabilityLabel(availability: string) {
  switch (availability) {
    case "in_stock":
      return "In stock"
    case "out_of_stock":
      return "Out of stock"
    case "preorder":
      return "Preorder"
    default:
      return "Unknown"
  }
}

export default function ProductDetail({ product }: ProductDetailProps) {
  return (
    <div className="container py-10">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="overflow-hidden rounded-2xl border bg-muted/20">
            <img src={product.image || "/placeholder.svg"} alt={product.name} className="h-auto w-full object-cover" />
          </div>
          <div className="grid grid-cols-4 gap-4">
            {product.images.map((image, index) => (
              <div key={`${image}-${index}`} className="overflow-hidden rounded-md border">
                <img
                  src={image || "/placeholder.svg"}
                  alt={`${product.name} thumbnail ${index + 1}`}
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              <span className="rounded-full border px-3 py-1">{product.brandName}</span>
              {product.isNew && <span className="rounded-full bg-black px-3 py-1 text-white">New</span>}
              {product.isSale && <span className="rounded-full bg-red-500 px-3 py-1 text-white">Sale</span>}
            </div>
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <p className="mt-3 text-muted-foreground">{product.description}</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-2xl font-bold">{formatMoney(product.price, product.currency)}</div>
            {product.compareAtPrice && (
              <span className="text-base text-muted-foreground line-through">
                {formatMoney(product.compareAtPrice, product.currency)}
              </span>
            )}
          </div>

          {product.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground">
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="border-t pt-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Available Offers</h2>
              <span className="text-sm text-muted-foreground">{product.offers.length} linked source(s)</span>
            </div>
            <div className="space-y-3">
              {product.offers.length > 0 ? (
                product.offers.map((offer) => (
                  <div key={offer.id} className="rounded-xl border border-border bg-card/70 p-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium">{offer.merchantName}</p>
                          {offer.isPrimary && <span className="rounded-full bg-black px-3 py-1 text-xs text-white">Primary</span>}
                          <span className="rounded-full border px-3 py-1 text-xs text-muted-foreground">
                            {formatAvailabilityLabel(offer.availability)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{offer.sourceName}</p>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{formatMoney(offer.price, offer.currency)}</span>
                          {offer.compareAtPrice && (
                            <span className="text-sm text-muted-foreground line-through">
                              {formatMoney(offer.compareAtPrice, offer.currency)}
                            </span>
                          )}
                        </div>
                      </div>
                      {offer.offerUrl ? (
                        <a
                          href={offer.offerUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center rounded-md bg-rose-500 px-4 py-2 text-sm font-medium text-white hover:bg-rose-600"
                        >
                          {offer.checkoutMethod === "external" ? "Shop Offer" : "Buy Now"}
                        </a>
                      ) : (
                        <span className="inline-flex items-center rounded-md border px-4 py-2 text-sm text-muted-foreground">
                          Offer unavailable
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                  No active offers are linked to this product yet.
                </div>
              )}
            </div>
          </div>

          <div className="border-t pt-6">
            {product.brandWebsiteUrl && (
              <a
                href={product.brandWebsiteUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                Visit Brand Site
              </a>
            )}
          </div>

          <div className="space-y-4 border-t pt-6">
            <div>
              <h2 className="font-medium">Details</h2>
              <p className="mt-2 text-muted-foreground">{product.details}</p>
            </div>
            <div>
              <h2 className="font-medium">Marketplace</h2>
              <p className="mt-2 text-muted-foreground">
                Prices and availability come from linked third-party brand sources and can change at the destination.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
