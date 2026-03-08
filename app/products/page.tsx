import { ExternalLink } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

import InteractiveCard from "@/components/interactive-card"
import { MarketplaceFilters } from "@/components/products/marketplace-filters"
import { MarketplaceSort } from "@/components/products/marketplace-sort"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getCatalogBrowseData } from "@/lib/catalog"
import { hasActiveCatalogFilters, parseCatalogBrowseFilters } from "@/lib/catalog-filters"

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

function buildClearFiltersHref(sort: string) {
  return sort === "newest" ? "/products" : `/products?sort=${encodeURIComponent(sort)}`
}

function formatResultLabel(count: number) {
  return `${count} result${count === 1 ? "" : "s"}`
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const resolvedSearchParams = (await searchParams) ?? {}
  const filters = parseCatalogBrowseFilters(resolvedSearchParams)
  const browseData = await getCatalogBrowseData(filters)
  const activeFilterLabels = browseData.facets.flatMap((section) =>
    section.options
      .filter((option) => option.selected && !(section.key === "priceRange" && option.value === "all"))
      .map((option) => `${section.label}: ${option.label}`),
  )
  const clearFiltersHref = buildClearFiltersHref(filters.sort)
  const hasActiveFilters = hasActiveCatalogFilters(filters)

  return (
    <div className="container py-10 text-white">
      <div className="space-y-8">
        <section className="rounded-[2rem] border border-white/[0.12] bg-[#05070b]/80 p-6 shadow-[0_30px_80px_rgba(0,0,0,0.28)] backdrop-blur sm:p-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl space-y-4">
              <Badge className="w-fit rounded-full border border-[#f7a06b]/35 bg-[#f7a06b]/12 px-4 py-1 text-[11px] uppercase tracking-[0.24em] text-[#ffd0ad]">
                Marketplace Discovery
              </Badge>
              <div className="space-y-3">
                <h1 className="text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">
                  Browse independent labels, compare live offers, and move out to checkout fast.
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-white/62 sm:text-base">
                  Discover third-party fashion across tailoring, occasionwear, outerwear, and elevated basics. Filter
                  by brand, silhouette, color, or aesthetic, then jump to the active external offer that fits.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <MarketplaceFilters
                mode="mobile"
                facets={browseData.facets}
                filters={filters}
                filteredCount={browseData.filteredCount}
                totalCount={browseData.totalCount}
              />
              <MarketplaceSort value={filters.sort} />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Badge className="rounded-full border border-white/[0.12] bg-white/[0.05] px-4 py-1.5 text-[11px] uppercase tracking-[0.18em] text-white/78">
              {formatResultLabel(browseData.filteredCount)}
            </Badge>
            {browseData.filteredCount !== browseData.totalCount && (
              <Badge
                variant="outline"
                className="rounded-full border-white/[0.12] bg-white/[0.02] px-4 py-1.5 text-[11px] uppercase tracking-[0.18em] text-white/65"
              >
                {browseData.totalCount} total
              </Badge>
            )}
            {activeFilterLabels.map((label) => (
              <Badge
                key={label}
                variant="outline"
                className="rounded-full border-white/[0.12] bg-white/[0.02] px-4 py-1.5 text-[11px] uppercase tracking-[0.16em] text-white/72"
              >
                {label}
              </Badge>
            ))}
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" className="rounded-full px-4 text-white/70 hover:bg-white/[0.08] hover:text-white" asChild>
                <Link href={clearFiltersHref}>Clear filters</Link>
              </Button>
            )}
          </div>
        </section>

        <div className="grid gap-8 lg:grid-cols-[280px,minmax(0,1fr)]">
          <MarketplaceFilters
            mode="desktop"
            facets={browseData.facets}
            filters={filters}
            filteredCount={browseData.filteredCount}
            totalCount={browseData.totalCount}
          />

          <div className="space-y-6">
            {browseData.totalCount === 0 ? (
              <div className="rounded-[1.75rem] border border-dashed border-white/[0.12] bg-white/[0.03] px-6 py-12 text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#f7a06b]">Marketplace Empty</p>
                <h2 className="mt-4 text-2xl font-semibold">No marketplace products are available yet.</h2>
                <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-white/58">
                  Seed or import brand catalog data first. The discovery page will automatically build filters from the
                  active marketplace products and tags.
                </p>
              </div>
            ) : browseData.products.length === 0 ? (
              <div className="rounded-[1.75rem] border border-dashed border-white/[0.12] bg-white/[0.03] px-6 py-12 text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#f7a06b]">No Matches</p>
                <h2 className="mt-4 text-2xl font-semibold">No products match the current filters.</h2>
                <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-white/58">
                  Try widening the price range, switching aesthetics, or clearing the active filters to reopen the full
                  marketplace catalog.
                </p>
                <div className="mt-6 flex justify-center">
                  <Button
                    variant="outline"
                    className="rounded-full border-white/[0.12] bg-white/[0.03] text-white hover:bg-white/[0.08] hover:text-white"
                    asChild
                  >
                    <Link href={clearFiltersHref}>Reset filters</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {browseData.products.map((product, index) => (
                    <InteractiveCard
                      key={product.id}
                      className="h-full rounded-[1.75rem] border border-white/[0.12] bg-white/[0.04] shadow-[0_24px_70px_rgba(0,0,0,0.24)]"
                      delay={Math.min(index * 70, 280)}
                      tilt={8}
                    >
                      <div className="group flex h-full flex-col overflow-hidden">
                        <div className="relative h-80 overflow-hidden">
                          <Link href={`/products/${product.id}`} className="absolute inset-0 z-10" aria-label={product.name} />
                          <Image
                            src={product.image || "/placeholder.svg"}
                            alt={product.name}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/12 to-transparent" />
                          <div className="absolute left-4 top-4 z-20 flex flex-wrap gap-2">
                            {product.isNew && (
                              <Badge className="rounded-full bg-black/80 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-white">
                                New
                              </Badge>
                            )}
                            {product.isSale && (
                              <Badge className="rounded-full bg-[#ea6a4c] px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-white">
                                Sale
                              </Badge>
                            )}
                            <Badge className="rounded-full border border-white/[0.14] bg-white/85 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-black">
                              {product.offerCount > 0 ? `${product.offerCount} offers` : "Catalog only"}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex flex-1 flex-col p-5">
                          <div className="space-y-2">
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#f7a06b]">
                              {product.brandName}
                            </p>
                            <Link href={`/products/${product.id}`} className="block transition-colors hover:text-[#ffd0ad]">
                              <h2 className="text-xl font-semibold tracking-[-0.03em]">{product.name}</h2>
                            </Link>
                            <p className="line-clamp-3 text-sm leading-6 text-white/58">{product.description}</p>
                          </div>

                          <div className="mt-5 flex items-end justify-between gap-4">
                            <div className="space-y-1">
                              <div className="text-lg font-semibold">{currencyFormatter.format(product.price)}</div>
                              {product.compareAtPrice && (
                                <div className="text-sm text-white/45 line-through">
                                  {currencyFormatter.format(product.compareAtPrice)}
                                </div>
                              )}
                            </div>
                            <div className="text-xs uppercase tracking-[0.18em] text-white/42">External checkout</div>
                          </div>

                          <div className="mt-5 flex gap-3">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 rounded-full border-white/[0.12] bg-white/[0.02] text-white hover:bg-white/[0.08] hover:text-white"
                              asChild
                            >
                              <Link href={`/products/${product.id}`}>View offers</Link>
                            </Button>
                            {product.primaryOfferUrl && (
                              <Button
                                size="sm"
                                className="flex-1 rounded-full bg-[#f7a06b] text-black hover:bg-[#ffb684]"
                                asChild
                              >
                                <a href={product.primaryOfferUrl} target="_blank" rel="noreferrer">
                                  Shop now
                                  <ExternalLink className="ml-2 h-4 w-4" />
                                </a>
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </InteractiveCard>
                  ))}
                </div>

                <div className="rounded-[1.5rem] border border-white/[0.12] bg-white/[0.03] px-5 py-4 text-sm leading-7 text-white/56">
                  Offer prices and availability come from linked brand sites and partner sources. Filtering uses brand
                  ownership plus normalized product tags, so new seeded or imported marketplace products automatically
                  slot into the same browse experience.
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
