"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useTransition } from "react"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { catalogParamByFacetKey, getCatalogActiveFilterCount, type CatalogBrowseFilters } from "@/lib/catalog-filters"
import type { CatalogFacetSection } from "@/lib/catalog"
import { cn } from "@/lib/utils"

interface MarketplaceFilterPanelProps {
  facets: CatalogFacetSection[]
  filters: CatalogBrowseFilters
}

function getNormalizedParamValues(params: URLSearchParams, key: string) {
  return Array.from(
    new Set(
      params
        .getAll(key)
        .flatMap((value) => value.split(","))
        .map((value) => value.trim().toLowerCase())
        .filter((value) => value.length > 0),
    ),
  )
}

export function MarketplaceFilterPanel({ facets, filters }: MarketplaceFilterPanelProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const activeFilterCount = getCatalogActiveFilterCount(filters)

  const replaceSearchParams = (nextParams: URLSearchParams) => {
    const nextQuery = nextParams.toString()

    startTransition(() => {
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false })
    })
  }

  const toggleMultiSelectValue = (param: string, value: string) => {
    const nextParams = new URLSearchParams(searchParams.toString())
    const values = new Set(getNormalizedParamValues(nextParams, param))

    if (values.has(value)) {
      values.delete(value)
    } else {
      values.add(value)
    }

    nextParams.delete(param)

    Array.from(values)
      .sort()
      .forEach((entry) => {
        nextParams.append(param, entry)
      })

    replaceSearchParams(nextParams)
  }

  const setSingleValue = (param: string, value: string, defaultValue: string) => {
    const nextParams = new URLSearchParams(searchParams.toString())

    if (value === defaultValue) {
      nextParams.delete(param)
    } else {
      nextParams.set(param, value)
    }

    replaceSearchParams(nextParams)
  }

  const clearFilters = () => {
    const nextParams = new URLSearchParams(searchParams.toString())

    nextParams.delete(catalogParamByFacetKey.brands)
    nextParams.delete(catalogParamByFacetKey.categories)
    nextParams.delete(catalogParamByFacetKey.colors)
    nextParams.delete(catalogParamByFacetKey.fits)
    nextParams.delete(catalogParamByFacetKey.styles)
    nextParams.delete(catalogParamByFacetKey.priceRange)

    replaceSearchParams(nextParams)
  }

  return (
    <div className={cn("space-y-5", isPending && "opacity-80")}>
      <Accordion type="multiple" defaultValue={facets.map((section) => section.key)} className="w-full">
        {facets.map((section) => (
          <AccordionItem key={section.key} value={section.key} className="border-white/[0.08]">
            <AccordionTrigger className="py-4 text-left text-sm uppercase tracking-[0.18em] text-white/82 hover:no-underline">
              <span>{section.label}</span>
            </AccordionTrigger>
            <AccordionContent>
              {section.type === "single" ? (
                <RadioGroup
                  value={section.options.find((option) => option.selected)?.value ?? "all"}
                  onValueChange={(value) => setSingleValue(section.param, value, "all")}
                  className="space-y-3"
                >
                  {section.options.map((option) => {
                    const optionId = `${section.param}-${option.value}`
                    const disabled = option.count === 0 && !option.selected

                    return (
                      <div
                        key={option.value}
                        className={cn(
                          "flex items-center justify-between gap-3 rounded-2xl border border-white/[0.08] px-3 py-3 transition-colors",
                          !disabled && "hover:border-white/[0.18]",
                          disabled && "opacity-45",
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <RadioGroupItem value={option.value} id={optionId} disabled={disabled || isPending} />
                          <Label htmlFor={optionId} className="cursor-pointer text-sm font-normal text-white/88">
                            {option.label}
                          </Label>
                        </div>
                        <span className="text-xs text-white/52">{option.count}</span>
                      </div>
                    )
                  })}
                </RadioGroup>
              ) : (
                <div className="space-y-3">
                  {section.options.map((option) => {
                    const optionId = `${section.param}-${option.value}`
                    const disabled = option.count === 0 && !option.selected

                    return (
                      <div
                        key={option.value}
                        className={cn(
                          "flex items-center justify-between gap-3 rounded-2xl border border-white/[0.08] px-3 py-3 transition-colors",
                          !disabled && "hover:border-white/[0.18]",
                          disabled && "opacity-45",
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id={optionId}
                            checked={option.selected}
                            disabled={disabled || isPending}
                            onCheckedChange={() => toggleMultiSelectValue(section.param, option.value)}
                          />
                          <Label htmlFor={optionId} className="cursor-pointer text-sm font-normal text-white/88">
                            {option.label}
                          </Label>
                        </div>
                        <span className="text-xs text-white/52">{option.count}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {activeFilterCount > 0 && (
        <Button
          type="button"
          variant="outline"
          className="w-full rounded-full border-white/[0.12] bg-white/[0.03] text-white hover:bg-white/[0.08] hover:text-white"
          onClick={clearFilters}
          disabled={isPending}
        >
          Clear all filters
        </Button>
      )}
    </div>
  )
}
