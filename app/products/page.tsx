import { Filter, SlidersHorizontal } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { query } from "@/lib/db"
import { mockProducts } from "@/lib/mock-data"

// Fetch products from the database
async function getProducts() {
  try {
    const result = await query("SELECT * FROM products ORDER BY created_at DESC")
    return result.rows.map((product) => ({
      id: product.id,
      name: product.name,
      price: Number.parseFloat(product.price),
      originalPrice: product.id % 3 === 0 ? Number.parseFloat(product.price) * 1.2 : null,
      image: product.image || `/placeholder.svg?height=400&width=300&text=Product+${product.id}`,
      isNew: product.id % 5 === 0,
      isSale: product.id % 3 === 0,
    }))
  } catch (error) {
    console.error("Error fetching products:", error)
    // Return mock products as fallback
    return mockProducts.map((product) => ({
      id: product.id,
      name: product.name,
      price: product.price,
      originalPrice: Number.parseInt(product.id) % 3 === 0 ? product.price * 1.2 : null,
      image: product.image,
      isNew: Number.parseInt(product.id) % 5 === 0,
      isSale: Number.parseInt(product.id) % 3 === 0,
    }))
  }
}

export default async function ProductsPage() {
  const products = await getProducts()

  return (
    <div className="container py-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">All Products</h1>
          <p className="text-muted-foreground">Showing {products.length} products</p>
        </div>

        <div className="flex items-center gap-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="md:hidden">
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
                <SheetDescription>Narrow down your product search</SheetDescription>
              </SheetHeader>
              <div className="py-6 space-y-6">
                <div>
                  <h3 className="font-medium mb-4">Categories</h3>
                  <div className="space-y-3">
                    {["Dresses", "Tops", "Bottoms", "Outerwear", "Accessories"].map((category) => (
                      <div key={category} className="flex items-center space-x-2">
                        <Checkbox id={`category-${category}`} />
                        <Label htmlFor={`category-${category}`}>{category}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                <Separator />
                <div>
                  <h3 className="font-medium mb-4">Price Range</h3>
                  <RadioGroup defaultValue="all">
                    {[
                      { value: "all", label: "All Prices" },
                      { value: "under-50", label: "Under $50" },
                      { value: "50-100", label: "$50 - $100" },
                      { value: "100-200", label: "$100 - $200" },
                      { value: "over-200", label: "Over $200" },
                    ].map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <RadioGroupItem value={option.value} id={`price-${option.value}`} />
                        <Label htmlFor={`price-${option.value}`}>{option.label}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
                <Separator />
                <div>
                  <h3 className="font-medium mb-4">Size</h3>
                  <div className="space-y-3">
                    {["XS", "S", "M", "L", "XL"].map((size) => (
                      <div key={size} className="flex items-center space-x-2">
                        <Checkbox id={`size-${size}`} />
                        <Label htmlFor={`size-${size}`}>{size}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <div className="hidden md:flex items-center gap-4">
            <Select defaultValue="featured">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="featured">Featured</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <Card key={product.id} className="group overflow-hidden border-0 shadow-sm">
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
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                  {product.isNew && <Badge className="bg-black text-white hover:bg-black">New</Badge>}
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
                  <Button variant="outline" size="sm" className="flex-1">
                    Add to Cart
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-12 flex justify-center">
        <Button variant="outline">Load More</Button>
      </div>
    </div>
  )
}
