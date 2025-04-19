"use client"

import { useState } from "react"
import Image from "next/image"
import { Minus, Plus, Share2, Star } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Import our components
import ProductZoomViewer from "@/components/product-zoom-viewer"
import SizeGuide from "@/components/size-guide"
import ProductReviews from "@/components/product-reviews"
import VirtualTryOn from "@/components/virtual-try-on"
import AddToCart from "./add-to-cart"

interface Product {
  id: string
  name: string
  price: number
  description: string
  details: string
  sizes: string[]
  colors: string[]
  images: string[]
  rating: number
  reviewCount: number
  isNew: boolean
  isSale: boolean
  material: string
  care: string
  relatedProducts: number[]
}

interface ProductDetailProps {
  product: Product
}

export default function ProductDetail({ product }: ProductDetailProps) {
  const [selectedSize, setSelectedSize] = useState("")
  const [selectedColor, setSelectedColor] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [mainImage, setMainImage] = useState(product.images[0])

  const incrementQuantity = () => setQuantity((prev) => prev + 1)
  const decrementQuantity = () => setQuantity((prev) => (prev > 1 ? prev - 1 : 1))

  return (
    <div className="container py-10">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Product Images */}
        <div className="space-y-4">
          <ProductZoomViewer image={mainImage || "/placeholder.svg"} alt={product.name} />
          <div className="grid grid-cols-4 gap-4">
            {product.images.map((image, index) => (
              <button
                key={index}
                className={`relative aspect-square overflow-hidden rounded-md border ${
                  mainImage === image ? "ring-2 ring-rose-500" : ""
                }`}
                onClick={() => setMainImage(image)}
              >
                <Image
                  src={image || "/placeholder.svg"}
                  alt={`${product.name} thumbnail ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < Math.floor(product.rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                {product.rating} ({product.reviewCount} reviews)
              </span>
            </div>
          </div>

          <div className="text-2xl font-bold">${product.price.toFixed(2)}</div>

          <p className="text-muted-foreground">{product.description}</p>

          <Separator />

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="size" className="block text-sm font-medium">
                  Size
                </label>
                <SizeGuide />
              </div>
              <Select value={selectedSize} onValueChange={setSelectedSize}>
                <SelectTrigger id="size" className="w-full">
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  {product.sizes.map((size) => (
                    <SelectItem key={size} value={size}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label htmlFor="color" className="block text-sm font-medium mb-2">
                Color
              </label>
              <Select value={selectedColor} onValueChange={setSelectedColor}>
                <SelectTrigger id="color" className="w-full">
                  <SelectValue placeholder="Select color" />
                </SelectTrigger>
                <SelectContent>
                  {product.colors.map((color) => (
                    <SelectItem key={color} value={color}>
                      {color}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label htmlFor="quantity" className="block text-sm font-medium mb-2">
                Quantity
              </label>
              <div className="flex items-center">
                <Button variant="outline" size="icon" onClick={decrementQuantity} disabled={quantity <= 1}>
                  <Minus className="h-4 w-4" />
                  <span className="sr-only">Decrease quantity</span>
                </Button>
                <span className="w-12 text-center">{quantity}</span>
                <Button variant="outline" size="icon" onClick={incrementQuantity}>
                  <Plus className="h-4 w-4" />
                  <span className="sr-only">Increase quantity</span>
                </Button>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <AddToCart
              product={{
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.images[0],
              }}
              selectedSize={selectedSize}
              selectedColor={selectedColor}
              quantity={quantity}
            />
            <VirtualTryOn productImage={product.images[0]} productName={product.name} />
          </div>

          <div className="flex items-center gap-4 pt-2">
            <Button variant="ghost" size="sm">
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
          </div>

          <Separator />

          <Tabs defaultValue="details">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="material">Material & Care</TabsTrigger>
              <TabsTrigger value="shipping">Shipping & Returns</TabsTrigger>
            </TabsList>
            <TabsContent value="details" className="pt-4">
              <p>{product.details}</p>
            </TabsContent>
            <TabsContent value="material" className="pt-4">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium">Material</h4>
                  <p className="text-muted-foreground">{product.material}</p>
                </div>
                <div>
                  <h4 className="font-medium">Care Instructions</h4>
                  <p className="text-muted-foreground">{product.care}</p>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="shipping" className="pt-4">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium">Shipping</h4>
                  <p className="text-muted-foreground">
                    Free standard shipping on orders over $100. Expedited and international shipping options available
                    at checkout.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium">Returns</h4>
                  <p className="text-muted-foreground">
                    We accept returns within 30 days of delivery. Items must be unworn, unwashed, and with the original
                    tags attached.
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          <div className="mt-4 p-4 bg-muted/30 rounded-lg">
            <h4 className="font-medium mb-2">Model Information</h4>
            <p className="text-sm text-muted-foreground">
              Model is 5'9" (175 cm) and wearing size S. For the most accurate fit, please refer to the size guide.
            </p>
          </div>
        </div>
      </div>
      <div className="mt-12">
        <Separator className="mb-8" />
        <ProductReviews />
      </div>
    </div>
  )
}
