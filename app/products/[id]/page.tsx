import { notFound } from "next/navigation"
import { query } from "@/lib/db"
import { mockProducts } from "@/lib/mock-data"
import ProductDetail from "./product-detail"

// Fetch product from the database
async function getProduct(id: string) {
  try {
    const result = await query("SELECT * FROM products WHERE id = $1", [id])

    if (result.rows.length === 0) {
      // Try to find in mock data if not in database
      const mockProduct = mockProducts.find((p) => p.id === id)
      if (!mockProduct) return null

      return {
        id: mockProduct.id,
        name: mockProduct.name,
        price: mockProduct.price,
        description: mockProduct.description,
        details: mockProduct.description,
        sizes: ["XS", "S", "M", "L", "XL"],
        colors: ["White", "Black", "Blue", "Pink"],
        images: [
          mockProduct.image,
          "/placeholder.svg?height=600&width=500&text=Product+Image+2",
          "/placeholder.svg?height=600&width=500&text=Product+Image+3",
          "/placeholder.svg?height=600&width=500&text=Product+Image+4",
        ],
        rating: 4.8,
        reviewCount: 124,
        isNew: Number.parseInt(mockProduct.id) % 5 === 0,
        isSale: Number.parseInt(mockProduct.id) % 3 === 0,
        material: "95% Cotton, 5% Elastane",
        care: "Machine wash cold, gentle cycle. Do not bleach. Tumble dry low.",
        relatedProducts: [2, 3, 4, 5],
      }
    }

    const product = result.rows[0]

    return {
      id: product.id.toString(),
      name: product.name,
      price: Number.parseFloat(product.price),
      description: product.description || "A beautiful product from Kuvu Creations.",
      details: product.description || "This elegant product features high-quality materials and craftsmanship.",
      sizes: ["XS", "S", "M", "L", "XL"],
      colors: ["White", "Black", "Blue", "Pink"],
      images: [
        product.image || "/placeholder.svg?height=600&width=500&text=Product+Image+1",
        "/placeholder.svg?height=600&width=500&text=Product+Image+2",
        "/placeholder.svg?height=600&width=500&text=Product+Image+3",
        "/placeholder.svg?height=600&width=500&text=Product+Image+4",
      ],
      rating: 4.8,
      reviewCount: 124,
      isNew: product.id % 5 === 0,
      isSale: product.id % 3 === 0,
      material: "95% Cotton, 5% Elastane",
      care: "Machine wash cold, gentle cycle. Do not bleach. Tumble dry low.",
      relatedProducts: [2, 3, 4, 5],
    }
  } catch (error) {
    console.error("Error fetching product:", error)

    // Try to find in mock data if database error
    const mockProduct = mockProducts.find((p) => p.id === id)
    if (!mockProduct) return null

    return {
      id: mockProduct.id,
      name: mockProduct.name,
      price: mockProduct.price,
      description: mockProduct.description,
      details: mockProduct.description,
      sizes: ["XS", "S", "M", "L", "XL"],
      colors: ["White", "Black", "Blue", "Pink"],
      images: [
        mockProduct.image,
        "/placeholder.svg?height=600&width=500&text=Product+Image+2",
        "/placeholder.svg?height=600&width=500&text=Product+Image+3",
        "/placeholder.svg?height=600&width=500&text=Product+Image+4",
      ],
      rating: 4.8,
      reviewCount: 124,
      isNew: Number.parseInt(mockProduct.id) % 5 === 0,
      isSale: Number.parseInt(mockProduct.id) % 3 === 0,
      material: "95% Cotton, 5% Elastane",
      care: "Machine wash cold, gentle cycle. Do not bleach. Tumble dry low.",
      relatedProducts: [2, 3, 4, 5],
    }
  }
}

export default async function ProductPage({ params }: { params: { id: string } }) {
  const product = await getProduct(params.id)

  if (!product) {
    notFound()
  }

  return <ProductDetail product={product} />
}
