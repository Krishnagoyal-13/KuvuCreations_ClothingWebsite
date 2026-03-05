"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Heart, ShoppingBag } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
    name: "Floral Summer Dress",
    price: 89.99,
    image: "/placeholder.svg?height=400&width=300",
    isNew: true,
    isSale: false,
  },
  {
    id: 2,
    name: "Casual Linen Blouse",
    price: 49.99,
    originalPrice: 69.99,
    image: "/placeholder.svg?height=400&width=300",
    isNew: false,
    isSale: true,
  },
  {
    id: 3,
    name: "High-Waisted Jeans",
    price: 79.99,
    image: "/placeholder.svg?height=400&width=300",
    isNew: true,
    isSale: false,
  },
  {
    id: 4,
    name: "Oversized Knit Sweater",
    price: 64.99,
    image: "/placeholder.svg?height=400&width=300",
    isNew: false,
    isSale: false,
  },
]

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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {products.map((product) => (
        <Card
          key={product.id}
          className="group overflow-hidden rounded-3xl border border-[#1f2536]/10 bg-white/70 shadow-[0_14px_40px_rgba(16,22,38,0.08)] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_22px_60px_rgba(16,22,38,0.16)]"
        >
          <CardContent className="p-0">
            <div className="relative">
              <Link href={`/products/${product.id}`}>
                <div className="relative h-80 w-full overflow-hidden">
                  <Image
                    src={product.image || "/placeholder.svg"}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
              </Link>
              <div className="absolute top-3 right-3 z-10">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full border border-white/60 bg-white/80 text-[#E98A2D] backdrop-blur-sm hover:bg-white"
                  onClick={() => toggleWishlist(product.id)}
                >
                  <Heart className={`h-5 w-5 ${wishlist.includes(product.id) ? "fill-[#E98A2D] text-[#E98A2D]" : ""}`} />
                  <span className="sr-only">Add to wishlist</span>
                </Button>
              </div>
              <div className="absolute top-3 left-3 flex flex-col gap-2">
                {product.isNew && <Badge className="bg-[#171f32] text-[#FCEBCD] hover:bg-[#171f32]">New</Badge>}
                {product.isSale && <Badge className="bg-[#E98A2D] text-[#171f32] hover:bg-[#E98A2D]">Sale</Badge>}
              </div>
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#131a2e]/40 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            </div>
            <div className="p-4">
              <Link href={`/products/${product.id}`} className="hover:underline">
                <h3 className="mb-1 text-lg font-semibold text-[#171f32]">{product.name}</h3>
              </Link>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[#171f32]">{currencyFormatter.format(product.price)}</span>
                {product.originalPrice && (
                  <span className="text-sm text-[#7a7f92] line-through">
                    {currencyFormatter.format(product.originalPrice)}
                  </span>
                )}
              </div>
              <div className="mt-4 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 rounded-full border-[#171f32]/20 bg-white/60 text-[#171f32] hover:border-[#E98A2D]/40 hover:bg-[#fff3df] hover:text-[#171f32]"
                >
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Add to Cart
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
