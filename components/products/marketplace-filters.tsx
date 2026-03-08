"use client"

import { SlidersHorizontal } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { getCatalogActiveFilterCount, type CatalogBrowseFilters } from "@/lib/catalog-filters"
import type { CatalogFacetSection } from "@/lib/catalog"

import { MarketplaceFilterPanel } from "./marketplace-filter-panel"

interface MarketplaceFiltersProps {
  facets: CatalogFacetSection[]
  filters: CatalogBrowseFilters
  filteredCount: number
  totalCount: number
  mode: "desktop" | "mobile"
}

function formatMarketplaceProductLabel(count: number) {
  return `${count} marketplace product${count === 1 ? "" : "s"}`
}

function MarketplaceFilterHeader({
  filters,
  filteredCount,
  totalCount,
}: Omit<MarketplaceFiltersProps, "facets" | "mode">) {
  const activeFilterCount = getCatalogActiveFilterCount(filters)

  return (
    <div className="mb-5 space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-semibold uppercase tracking-[0.26em] text-[#f7a06b]">Filters</div>
        {activeFilterCount > 0 && (
          <Badge className="rounded-full border border-[#f7a06b]/40 bg-[#f7a06b]/12 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[#ffd0ad]">
            {activeFilterCount} active
          </Badge>
        )}
      </div>
      <p className="text-sm text-white/60">
        {filteredCount === totalCount
          ? formatMarketplaceProductLabel(totalCount)
          : `${filteredCount} of ${formatMarketplaceProductLabel(totalCount)}`}
      </p>
    </div>
  )
}

export function MarketplaceFilters({
  facets,
  filters,
  filteredCount,
  totalCount,
  mode,
}: MarketplaceFiltersProps) {
  const activeFilterCount = getCatalogActiveFilterCount(filters)

  if (mode === "mobile") {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="rounded-full border-white/[0.12] bg-white/[0.04] text-white hover:bg-white/[0.08] hover:text-white lg:hidden"
          >
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-1 inline-flex min-w-5 items-center justify-center rounded-full bg-[#f7a06b] px-1.5 py-0.5 text-[11px] font-semibold text-black">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[92vw] max-w-sm overflow-y-auto border-white/[0.12] bg-[#06070a]/96 text-white">
          <SheetHeader className="pb-2">
            <SheetTitle className="text-left text-white">Marketplace Filters</SheetTitle>
            <SheetDescription className="text-left text-white/60">
              Narrow the catalog by brand, tags, and price without leaving the page.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 rounded-[1.75rem] border border-white/[0.12] bg-white/[0.03] p-5 shadow-[0_24px_60px_rgba(0,0,0,0.24)] backdrop-blur">
            <MarketplaceFilterHeader filters={filters} filteredCount={filteredCount} totalCount={totalCount} />
            <MarketplaceFilterPanel facets={facets} filters={filters} />
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <aside className="hidden lg:block">
      <div className="sticky top-24 rounded-[1.75rem] border border-white/[0.12] bg-white/[0.03] p-5 shadow-[0_24px_60px_rgba(0,0,0,0.24)] backdrop-blur">
        <MarketplaceFilterHeader filters={filters} filteredCount={filteredCount} totalCount={totalCount} />
        <MarketplaceFilterPanel facets={facets} filters={filters} />
      </div>
    </aside>
  )
}
