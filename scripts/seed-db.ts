import { query } from "../lib/db"

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
]

async function seedProducts() {
  try {
    console.log("Seeding products...")

    // Clear existing products
    await query("TRUNCATE products CASCADE")

    // Insert new products
    for (const product of products) {
      await query("INSERT INTO products (name, description, price, image) VALUES ($1, $2, $3, $4)", [
        product.name,
        product.description,
        product.price,
        product.image,
      ])
    }

    console.log("Products seeded successfully")
  } catch (error) {
    console.error("Error seeding products:", error)
  }
}

// Run the seed function
seedProducts().catch(console.error)
