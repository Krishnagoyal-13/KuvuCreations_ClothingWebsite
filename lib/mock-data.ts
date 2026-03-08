import { v4 as uuidv4 } from "uuid"

// Mock product data
export const mockProducts = [
  {
    id: "1",
    brandName: "Northline Studio",
    brandSlug: "northline-studio",
    brandWebsiteUrl: "https://northline.example",
    name: "Floral Summer Dress",
    description:
      "A beautiful floral summer dress made from lightweight fabric. Perfect for warm days and special occasions.",
    price: 89.99,
    image: "/placeholder.svg?height=600&width=500&text=Product+Image+1",
    tags: ["dress", "summer", "occasion"],
    offers: [
      {
        merchantName: "Northline Studio",
        sourceName: "Northline Brand Site",
        offerUrl: "https://northline.example/products/floral-summer-dress",
        price: 89.99,
        compareAtPrice: 99.99,
        currency: "INR",
        availability: "in_stock",
        isPrimary: true,
      },
    ],
  },
  {
    id: "2",
    brandName: "Meridian Essentials",
    brandSlug: "meridian-essentials",
    brandWebsiteUrl: "https://meridian.example",
    name: "Casual Linen Blouse",
    description: "A comfortable and stylish linen blouse, perfect for casual outings and everyday wear.",
    price: 49.99,
    image: "/placeholder.svg?height=600&width=500&text=Product+Image+2",
    tags: ["blouse", "linen", "casual"],
    offers: [
      {
        merchantName: "Meridian Essentials",
        sourceName: "Meridian Brand Site",
        offerUrl: "https://meridian.example/products/casual-linen-blouse",
        price: 49.99,
        currency: "INR",
        availability: "in_stock",
        isPrimary: true,
      },
    ],
  },
  {
    id: "3",
    brandName: "Aster Atelier",
    brandSlug: "aster-atelier",
    brandWebsiteUrl: "https://asteratelier.example",
    name: "High-Waisted Jeans",
    description: "Classic high-waisted jeans with a modern fit. Versatile and comfortable for any occasion.",
    price: 79.99,
    image: "/placeholder.svg?height=600&width=500&text=Product+Image+3",
    tags: ["denim", "jeans", "wardrobe"],
    offers: [
      {
        merchantName: "Aster Atelier",
        sourceName: "Aster Brand Site",
        offerUrl: "https://asteratelier.example/products/high-waisted-jeans",
        price: 79.99,
        compareAtPrice: 89.99,
        currency: "INR",
        availability: "in_stock",
        isPrimary: true,
      },
    ],
  },
  {
    id: "4",
    brandName: "Northline Studio",
    brandSlug: "northline-studio",
    brandWebsiteUrl: "https://northline.example",
    name: "Oversized Knit Sweater",
    description: "A cozy oversized knit sweater, perfect for layering during colder months.",
    price: 64.99,
    image: "/placeholder.svg?height=600&width=500&text=Product+Image+4",
    tags: ["knitwear", "cold-weather", "layering"],
    offers: [
      {
        merchantName: "Northline Studio",
        sourceName: "Northline Brand Site",
        offerUrl: "https://northline.example/products/oversized-knit-sweater",
        price: 64.99,
        currency: "INR",
        availability: "in_stock",
        isPrimary: true,
      },
    ],
  },
  {
    id: "5",
    brandName: "Meridian Essentials",
    brandSlug: "meridian-essentials",
    brandWebsiteUrl: "https://meridian.example",
    name: "Pleated Midi Skirt",
    description: "An elegant pleated midi skirt that transitions perfectly from office to evening.",
    price: 59.99,
    image: "/placeholder.svg?height=600&width=500&text=Product+Image+5",
    tags: ["skirt", "office", "evening"],
    offers: [
      {
        merchantName: "Meridian Essentials",
        sourceName: "Meridian Brand Site",
        offerUrl: "https://meridian.example/products/pleated-midi-skirt",
        price: 59.99,
        currency: "INR",
        availability: "in_stock",
        isPrimary: true,
      },
    ],
  },
  {
    id: "6",
    brandName: "Aster Atelier",
    brandSlug: "aster-atelier",
    brandWebsiteUrl: "https://asteratelier.example",
    name: "Satin Slip Dress",
    description: "A luxurious satin slip dress for special occasions and elegant evenings out.",
    price: 99.99,
    image: "/placeholder.svg?height=600&width=500&text=Product+Image+6",
    tags: ["dress", "evening", "occasion"],
    offers: [
      {
        merchantName: "Aster Atelier",
        sourceName: "Aster Brand Site",
        offerUrl: "https://asteratelier.example/products/satin-slip-dress",
        price: 99.99,
        compareAtPrice: 119.99,
        currency: "INR",
        availability: "in_stock",
        isPrimary: true,
      },
    ],
  },
  {
    id: "7",
    brandName: "Meridian Essentials",
    brandSlug: "meridian-essentials",
    brandWebsiteUrl: "https://meridian.example",
    name: "Cotton T-Shirt",
    description: "A soft, breathable cotton t-shirt for everyday casual wear.",
    price: 29.99,
    image: "/placeholder.svg?height=600&width=500&text=Product+Image+7",
    tags: ["tee", "basics", "cotton"],
    offers: [
      {
        merchantName: "Meridian Essentials",
        sourceName: "Meridian Brand Site",
        offerUrl: "https://meridian.example/products/cotton-t-shirt",
        price: 29.99,
        currency: "INR",
        availability: "in_stock",
        isPrimary: true,
      },
    ],
  },
  {
    id: "8",
    brandName: "Northline Studio",
    brandSlug: "northline-studio",
    brandWebsiteUrl: "https://northline.example",
    name: "Leather Jacket",
    description: "A classic leather jacket that adds edge to any outfit.",
    price: 149.99,
    image: "/placeholder.svg?height=600&width=500&text=Product+Image+8",
    tags: ["outerwear", "jacket", "statement"],
    offers: [
      {
        merchantName: "Northline Studio",
        sourceName: "Northline Brand Site",
        offerUrl: "https://northline.example/products/leather-jacket",
        price: 149.99,
        compareAtPrice: 169.99,
        currency: "INR",
        availability: "in_stock",
        isPrimary: true,
      },
    ],
  },
]

// Mock users data
export const mockUsers = [
  {
    id: "1",
    email: "user@example.com",
    password: "$2a$10$zPzOPGjRMgT/cP5SglYA7OdKci2OQxuG1MQnKBf2QEJzJ6GtbDQJi", // "password123" hashed
    first_name: "John",
    last_name: "Doe",
  },
]

// Mock sessions data
export const mockSessions: Record<string, { user_id: string; expires: Date }> = {}

// Mock carts data
export const mockCarts: Record<string, { id: string; user_id?: string; session_id?: string; items: MockCartItem[] }> =
  {}

export interface MockCartItem {
  id: string
  product_id: string
  quantity: number
  size?: string
  color?: string
}

// Mock data utility functions
export function createMockSession(userId: string): string {
  const sessionId = uuidv4()
  const expires = new Date()
  expires.setDate(expires.getDate() + 7) // Session expires in 7 days

  mockSessions[sessionId] = {
    user_id: userId,
    expires,
  }

  return sessionId
}

export function getMockSession(sessionId: string) {
  const session = mockSessions[sessionId]
  if (!session || new Date() > session.expires) {
    return null
  }
  return session
}

export function deleteMockSession(sessionId: string) {
  delete mockSessions[sessionId]
}

export function getMockUser(userId: string) {
  return mockUsers.find((user) => user.id === userId) || null
}

export function getMockUserByEmail(email: string) {
  return mockUsers.find((user) => user.email === email) || null
}

export function createMockUser(userData: { email: string; password: string; first_name: string; last_name: string }) {
  const newUser = {
    id: uuidv4(),
    ...userData,
  }
  mockUsers.push(newUser)
  return newUser
}

export function getMockCart(userId?: string, sessionId?: string) {
  let cartId: string | undefined

  if (userId) {
    cartId = Object.keys(mockCarts).find((id) => mockCarts[id].user_id === userId)
  } else if (sessionId) {
    cartId = Object.keys(mockCarts).find((id) => mockCarts[id].session_id === sessionId)
  }

  if (!cartId) {
    return null
  }

  return mockCarts[cartId]
}

export function createMockCart(userId?: string, sessionId?: string) {
  const cartId = uuidv4()
  mockCarts[cartId] = {
    id: cartId,
    user_id: userId,
    session_id: sessionId,
    items: [],
  }
  return mockCarts[cartId]
}

export function addMockCartItem(cartId: string, productId: string, quantity: number, size?: string, color?: string) {
  const cart = mockCarts[cartId]
  if (!cart) return null

  // Check if item already exists
  const existingItemIndex = cart.items.findIndex(
    (item) => item.product_id === productId && item.size === size && item.color === color,
  )

  if (existingItemIndex !== -1) {
    // Update quantity if item exists
    cart.items[existingItemIndex].quantity += quantity
  } else {
    // Add new item if it doesn't exist
    cart.items.push({
      id: uuidv4(),
      product_id: productId,
      quantity,
      size,
      color,
    })
  }

  return cart
}

export function updateMockCartItemQuantity(cartId: string, itemId: string, quantity: number) {
  const cart = mockCarts[cartId]
  if (!cart) return false

  const itemIndex = cart.items.findIndex((item) => item.id === itemId)
  if (itemIndex === -1) return false

  if (quantity <= 0) {
    // Remove item if quantity is 0 or less
    cart.items = cart.items.filter((item) => item.id !== itemId)
  } else {
    // Update quantity
    cart.items[itemIndex].quantity = quantity
  }

  return true
}

export function removeMockCartItem(cartId: string, itemId: string) {
  const cart = mockCarts[cartId]
  if (!cart) return false

  cart.items = cart.items.filter((item) => item.id !== itemId)
  return true
}

export function clearMockCart(cartId: string) {
  const cart = mockCarts[cartId]
  if (!cart) return false

  cart.items = []
  return true
}

export function mergeMockCarts(userCartId: string, anonCartId: string) {
  const userCart = mockCarts[userCartId]
  const anonCart = mockCarts[anonCartId]

  if (!userCart || !anonCart) return false

  // For each item in anonymous cart
  for (const anonItem of anonCart.items) {
    // Check if item already exists in user cart
    const existingItemIndex = userCart.items.findIndex(
      (item) => item.product_id === anonItem.product_id && item.size === anonItem.size && item.color === anonItem.color,
    )

    if (existingItemIndex !== -1) {
      // Update quantity if item exists
      userCart.items[existingItemIndex].quantity += anonItem.quantity
    } else {
      // Add new item if it doesn't exist
      userCart.items.push({
        ...anonItem,
        id: uuidv4(),
      })
    }
  }

  // Clear anonymous cart
  delete mockCarts[anonCartId]

  return true
}

export function getMockProduct(productId: string) {
  return mockProducts.find((product) => product.id === productId) || null
}

export function getAllMockProducts() {
  return [...mockProducts]
}
