"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Heart, ShoppingBag } from "lucide-react"

import InteractiveCard from "@/components/interactive-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

// Mock product data
const products = [
  {
    id: 1,
    name: "Signal Satin Dress",
    price: 89.99,
    image: "/placeholder.svg?height=400&width=300",
    descriptor: "A liquid silhouette for nights that need almost no styling effort.",
    isNew: true,
    isSale: false,
  },
  {
    id: 2,
    name: "Utility Silk Shirt",
    price: 49.99,
    originalPrice: 69.99,
    image: "/placeholder.svg?height=400&width=300",
    descriptor: "Sharp enough for tailoring, soft enough to anchor every capsule.",
    isNew: false,
    isSale: true,
  },
  {
    id: 3,
    name: "Noir Column Trousers",
    price: 79.99,
    image: "/placeholder.svg?height=400&width=300",
    descriptor: "Straight lines, deep tone, and enough structure to carry the whole look.",
    isNew: true,
    isSale: false,
  },
  {
    id: 4,
    name: "Afterglow Knit Set",
    price: 64.99,
    image: "/placeholder.svg?height=400&width=300",
    descriptor: "A softer layer for off-duty frames without losing the editorial read.",
    isNew: false,
    isSale: false,
  },
]

const layoutClasses = ["lg:col-span-7", "lg:col-span-5", "lg:col-span-5", "lg:col-span-7"]

export default function FeaturedProducts() {
  const [wishlist, setWishlist] = useState<number[]>([])

  const toggleWishlist = (id: number) => {
    if (wishlist.includes(id)) {
      setWishlist(wishlist.filter((itemId) => itemId !== id))
    } else {
      setWishlist([...wishlist, id])
    }
  }

  return (
    <div className="grid grid-cols-12 gap-5">
      {products.map((product, index) => (
        <InteractiveCard
          key={product.id}
          className={`group col-span-12 rounded-[2rem] ${layoutClasses[index]}`}
          delay={120 + index * 80}
          tilt={8}
        >
          <div className="antimatter-card h-full overflow-hidden p-0 transition-transform duration-500 group-hover:-translate-y-1">
            <div className="relative">
              <Link href={`/products/${product.id}`}>
                <div className="relative h-80 w-full overflow-hidden lg:h-[26rem]">
                  <Image
                    src={product.image || "/placeholder.svg"}
                    alt={product.name}
                    fill
                    className="object-cover opacity-85 transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#07090d] via-[#07090d]/28 to-transparent" />
                </div>
              </Link>
              <div className="absolute right-4 top-4 z-10">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full border border-white/[0.12] bg-black/25 text-[#f6eee2] backdrop-blur-md hover:bg-[#ff7b3a] hover:text-[#0a0c10]"
                  onClick={() => toggleWishlist(product.id)}
                >
                  <Heart className={`h-5 w-5 ${wishlist.includes(product.id) ? "fill-[#ff7b3a] text-[#ff7b3a]" : ""}`} />
                  <span className="sr-only">Add to wishlist</span>
                </Button>
              </div>
              <div className="absolute left-4 top-4 flex flex-col gap-2">
                {product.isNew && <Badge className="bg-[#f6ede1] text-[#0a0c10] hover:bg-[#f6ede1]">New</Badge>}
                {product.isSale && <Badge className="bg-[#ff7b3a] text-[#0a0c10] hover:bg-[#ff7b3a]">Sale</Badge>}
              </div>
            </div>
            <div className="p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#f2bc93]">
                  Signal 0{index + 1}
                </p>
                <span className="text-xs uppercase tracking-[0.18em] text-[#9f978b]">Editorial product frame</span>
              </div>

              <Link href={`/products/${product.id}`} className="hover:underline">
                <h3 className="mt-4 text-2xl text-[#f8f1e6]">{product.name}</h3>
              </Link>
              <p className="mt-3 max-w-xl text-sm leading-7 text-[#a9a297]">{product.descriptor}</p>

              <div className="mt-5 flex items-center gap-2">
                <span className="font-semibold text-[#f8f1e6]">{currencyFormatter.format(product.price)}</span>
                {product.originalPrice && (
                  <span className="text-sm text-[#7a7f92] line-through">
                    {currencyFormatter.format(product.originalPrice)}
                  </span>
                )}
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full border-white/[0.12] bg-white/[0.04] text-[#f6eee2] hover:bg-[#ff7b3a] hover:text-[#0a0c10]"
                >
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  Add to Cart
                </Button>
                <Link
                  href={`/products/${product.id}`}
                  className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-[#f2bc93] transition-colors hover:text-[#f8f1e6]"
                >
                  Open Frame <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </InteractiveCard>
      ))}
    </div>
  )
}
