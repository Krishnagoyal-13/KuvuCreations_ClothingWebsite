export type CatalogSortOption = "newest" | "price-low" | "price-high"

export type CatalogPriceRange = "all" | "under-50" | "50-100" | "100-200" | "over-200"

export type CatalogFacetKey = "brands" | "categories" | "colors" | "fits" | "styles" | "priceRange"

export type CatalogMultiFacetKey = Exclude<CatalogFacetKey, "priceRange">

export interface CatalogBrowseFilters {
  brands: string[]
  categories: string[]
  colors: string[]
  fits: string[]
  styles: string[]
  priceRange: CatalogPriceRange
  sort: CatalogSortOption
}

export interface CatalogOptionDefinition<TValue extends string = string> {
  value: TValue
  label: string
}

export interface CatalogTagFacetDefinition {
  key: Exclude<CatalogMultiFacetKey, "brands">
  label: string
  param: string
  options: CatalogOptionDefinition[]
}

export type CatalogSearchParams = Record<string, string | string[] | undefined>

export const catalogSortOptions: CatalogOptionDefinition<CatalogSortOption>[] = [
  { value: "newest", label: "Newest" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
]

export const catalogPriceRangeOptions: CatalogOptionDefinition<CatalogPriceRange>[] = [
  { value: "all", label: "All Prices" },
  { value: "under-50", label: "Under INR 50" },
  { value: "50-100", label: "INR 50 - INR 100" },
  { value: "100-200", label: "INR 100 - INR 200" },
  { value: "over-200", label: "Over INR 200" },
]

export const catalogTagFacetDefinitions: CatalogTagFacetDefinition[] = [
  {
    key: "categories",
    label: "Category",
    param: "category",
    options: [
      { value: "outerwear", label: "Outerwear" },
      { value: "trousers", label: "Trousers" },
      { value: "dress", label: "Dresses" },
      { value: "vest", label: "Vests" },
      { value: "tee", label: "Tees" },
      { value: "knitwear", label: "Knitwear" },
    ],
  },
  {
    key: "colors",
    label: "Color",
    param: "color",
    options: [
      { value: "black", label: "Black" },
      { value: "charcoal", label: "Charcoal" },
      { value: "ivory", label: "Ivory" },
      { value: "sand", label: "Sand" },
      { value: "white", label: "White" },
      { value: "olive", label: "Olive" },
    ],
  },
  {
    key: "fits",
    label: "Fit",
    param: "fit",
    options: [
      { value: "structured", label: "Structured" },
      { value: "relaxed", label: "Relaxed" },
      { value: "slim", label: "Slim" },
      { value: "tailored", label: "Tailored" },
      { value: "fitted", label: "Fitted" },
    ],
  },
  {
    key: "styles",
    label: "Aesthetic",
    param: "style",
    options: [
      { value: "minimal", label: "Minimal" },
      { value: "citywear", label: "Citywear" },
      { value: "travel", label: "Travel" },
      { value: "evening", label: "Evening" },
      { value: "occasion", label: "Occasion" },
      { value: "tailoring", label: "Tailoring" },
      { value: "layering", label: "Layering" },
      { value: "essentials", label: "Essentials" },
      { value: "basics", label: "Basics" },
      { value: "weekend", label: "Weekend" },
    ],
  },
]

export const catalogParamByFacetKey: Record<CatalogFacetKey | "sort", string> = {
  brands: "brand",
  categories: "category",
  colors: "color",
  fits: "fit",
  styles: "style",
  priceRange: "price",
  sort: "sort",
}

export function createDefaultCatalogBrowseFilters(): CatalogBrowseFilters {
  return {
    brands: [],
    categories: [],
    colors: [],
    fits: [],
    styles: [],
    priceRange: "all",
    sort: "newest",
  }
}

function normalizeParamValues(value: string | string[] | undefined) {
  const rawValues = Array.isArray(value) ? value : typeof value === "string" ? [value] : []

  return Array.from(
    new Set(
      rawValues
        .flatMap((entry) => entry.split(","))
        .map((entry) => entry.trim().toLowerCase())
        .filter((entry) => entry.length > 0),
    ),
  )
}

function normalizeSingleValue<TValue extends string>(
  value: string | string[] | undefined,
  allowedValues: readonly TValue[],
  fallbackValue: TValue,
) {
  const normalizedValue = normalizeParamValues(value)[0]
  return normalizedValue && allowedValues.includes(normalizedValue as TValue)
    ? (normalizedValue as TValue)
    : fallbackValue
}

export function parseCatalogBrowseFilters(searchParams: CatalogSearchParams = {}): CatalogBrowseFilters {
  return {
    brands: normalizeParamValues(searchParams.brand),
    categories: normalizeParamValues(searchParams.category),
    colors: normalizeParamValues(searchParams.color),
    fits: normalizeParamValues(searchParams.fit),
    styles: normalizeParamValues(searchParams.style),
    priceRange: normalizeSingleValue(
      searchParams.price,
      catalogPriceRangeOptions.map((option) => option.value),
      "all",
    ),
    sort: normalizeSingleValue(
      searchParams.sort,
      catalogSortOptions.map((option) => option.value),
      "newest",
    ),
  }
}

export function getCatalogActiveFilterCount(filters: CatalogBrowseFilters) {
  return (
    filters.brands.length +
    filters.categories.length +
    filters.colors.length +
    filters.fits.length +
    filters.styles.length +
    (filters.priceRange === "all" ? 0 : 1)
  )
}

export function hasActiveCatalogFilters(filters: CatalogBrowseFilters) {
  return getCatalogActiveFilterCount(filters) > 0
}
