"use client"

import { ArrowUpDown } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useTransition } from "react"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { catalogSortOptions, type CatalogSortOption } from "@/lib/catalog-filters"

interface MarketplaceSortProps {
  value: CatalogSortOption
}

export function MarketplaceSort({ value }: MarketplaceSortProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const handleValueChange = (nextValue: string) => {
    const nextParams = new URLSearchParams(searchParams.toString())

    if (nextValue === "newest") {
      nextParams.delete("sort")
    } else {
      nextParams.set("sort", nextValue)
    }

    const nextQuery = nextParams.toString()

    startTransition(() => {
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false })
    })
  }

  return (
    <div className="flex items-center gap-3">
      <div className="hidden items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/48 sm:flex">
        <ArrowUpDown className="h-3.5 w-3.5" />
        Sort
      </div>
      <Select value={value} onValueChange={handleValueChange} disabled={isPending}>
        <SelectTrigger className="w-[220px] rounded-full border-white/[0.12] bg-white/[0.04] text-white shadow-none hover:bg-white/[0.08]">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent className="border-white/[0.12] bg-[#0d1017] text-white">
          {catalogSortOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
