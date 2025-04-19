import { NextResponse } from "next/server"
import { query } from "@/lib/db"

// Sample product data
const products = [
  {
    name: "Floral Summer Dress",
    description:
      "A beautiful floral summer dress made from lightweight fabric. Perfect for warm days and special occasions.",
    price: 89.99,
    image: "/placeholder.svg?height=600&width=500&text=Product+Image+1",
  },
  {
    name: "Casual Linen Blouse",
    description: "A comfortable and stylish linen blouse, perfect for casual outings and everyday wear.",
    price: 49.99,
    image: "/placeholder.svg?height=600&width=500&text=Product+Image+2",
  },
  {
    name: "High-Waisted Jeans",
    description: "Classic high-waisted jeans with a modern fit. Versatile and comfortable for any occasion.",
    price: 79.99,
    image: "/placeholder.svg?height=600&width=500&text=Product+Image+3",
  },
  {
    name: "Oversized Knit Sweater",
    description: "A cozy oversized knit sweater, perfect for layering during colder months.",
    price: 64.99,
    image: "/placeholder.svg?height=600&width=500&text=Product+Image+4",
  },
  {
    name: "Pleated Midi Skirt",
    description: "An elegant pleated midi skirt that transitions perfectly from office to evening.",
    price: 59.99,
    image: "/placeholder.svg?height=600&width=500&text=Product+Image+5",
  },
  {
    name: "Satin Slip Dress",
    description: "A luxurious satin slip dress for special occasions and elegant evenings out.",
    price: 99.99,
    image: "/placeholder.svg?height=600&width=500&text=Product+Image+6",
  },
  {
    name: "Cotton T-Shirt",
    description: "A soft, breathable cotton t-shirt for everyday casual wear.",
    price: 29.99,
    image: "/placeholder.svg?height=600&width=500&text=Product+Image+7",
  },
  {
    name: "Leather Jacket",
    description: "A classic leather jacket that adds edge to any outfit.",
    price: 149.99,
    image: "/placeholder.svg?height=600&width=500&text=Product+Image+8",
  },
]

export async function GET() {
  try {
    // Seed products
    for (const product of products) {
      // Check if product already exists
      const existingProduct = await query("SELECT * FROM products WHERE name = $1", [product.name])

      if (existingProduct.rows.length === 0) {
        await query("INSERT INTO products (name, description, price, image) VALUES ($1, $2, $3, $4)", [
          product.name,
          product.description,
          product.price,
          product.image,
        ])
      }
    }

    return NextResponse.json({ success: true, message: "Database seeded successfully" })
  } catch (error) {
    console.error("Error seeding database:", error)
    return NextResponse.json({ success: false, error: "Failed to seed database" }, { status: 500 })
  }
}
