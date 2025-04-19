"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Heart, ShoppingBag } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

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
          className="group overflow-hidden border-0 shadow-sm hover:shadow-md transition-all duration-300"
        >
          <CardContent className="p-0">
            <div className="relative">
              <Link href={`/products/${product.id}`}>
                <div className="relative h-80 w-full overflow-hidden">
                  <Image
                    src={product.image || "/placeholder.svg"}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
              </Link>
              <div className="absolute top-3 right-3 z-10">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full bg-white/80 backdrop-blur-sm hover:bg-white text-rose-500"
                  onClick={() => toggleWishlist(product.id)}
                >
                  <Heart className={`h-5 w-5 ${wishlist.includes(product.id) ? "fill-rose-500 text-rose-500" : ""}`} />
                  <span className="sr-only">Add to wishlist</span>
                </Button>
              </div>
              <div className="absolute top-3 left-3 flex flex-col gap-2">
                {product.isNew && <Badge className="bg-rose-500 text-white hover:bg-rose-600">New</Badge>}
                {product.isSale && <Badge className="bg-red-500 text-white hover:bg-red-600">Sale</Badge>}
              </div>
            </div>
            <div className="p-4">
              <Link href={`/products/${product.id}`} className="hover:underline">
                <h3 className="font-medium mb-1">{product.name}</h3>
              </Link>
              <div className="flex items-center gap-2">
                <span className="font-semibold">${product.price.toFixed(2)}</span>
                {product.originalPrice && (
                  <span className="text-sm text-muted-foreground line-through">
                    ${product.originalPrice.toFixed(2)}
                  </span>
                )}
              </div>
              <div className="mt-4 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 hover:bg-rose-50 hover:text-rose-500 hover:border-rose-200"
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
