"use server"

import { cookies } from "next/headers"
import { v4 as uuidv4 } from "uuid"
import { getCurrentUser } from "./auth-actions"
import { query } from "./db"

export interface CartItem {
  id: string
  productId: string
  name: string
  price: number
  image: string
  quantity: number
  size?: string
  color?: string
}

// Get or create cart
async function getOrCreateCart() {
  try {
    const user = await getCurrentUser()
    let cartId: number | null = null
    let sessionId: string | null = null

    if (user) {
      // Check if user has a cart
      const userCartResult = await query("SELECT id FROM carts WHERE user_id = $1", [user.id])

      if (userCartResult.rows.length > 0) {
        cartId = userCartResult.rows[0].id
      } else {
        // Create a new cart for the user
        const newCartResult = await query("INSERT INTO carts (user_id) VALUES ($1) RETURNING id", [user.id])
        cartId = newCartResult.rows[0].id
      }
    } else {
      // Get or create anonymous cart
      sessionId = cookies().get("cart_session_id")?.value

      if (!sessionId) {
        sessionId = uuidv4()
        cookies().set("cart_session_id", sessionId, {
          httpOnly: true,
          maxAge: 60 * 60 * 24 * 30, // 30 days
          path: "/",
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
        })
      }

      // Check if session has a cart
      const sessionCartResult = await query("SELECT id FROM carts WHERE session_id = $1", [sessionId])

      if (sessionCartResult.rows.length > 0) {
        cartId = sessionCartResult.rows[0].id
      } else {
        // Create a new cart for the session
        const newCartResult = await query("INSERT INTO carts (session_id) VALUES ($1) RETURNING id", [sessionId])
        cartId = newCartResult.rows[0].id
      }
    }

    return { cartId, userId: user?.id, sessionId }
  } catch (error) {
    console.error("Error getting or creating cart:", error)
    // Return a null cartId to indicate an error
    return { cartId: null, userId: null, sessionId: null }
  }
}

// Get cart items
export async function getCart(): Promise<CartItem[]> {
  try {
    const { cartId } = await getOrCreateCart()

    if (!cartId) {
      return []
    }

    const cartItemsResult = await query(
      `
      SELECT ci.id, ci.product_id as "productId", p.name, p.price, p.image, 
             ci.quantity, ci.size, ci.color
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.cart_id = $1
    `,
      [cartId],
    )

    return cartItemsResult.rows
  } catch (error) {
    console.error("Error getting cart:", error)
    return []
  }
}

// Add item to cart
export async function addToCart(item: Omit<CartItem, "id">) {
  try {
    const { cartId } = await getOrCreateCart()

    if (!cartId) {
      return { success: false, error: "Could not create cart" }
    }

    // Check if product exists
    let productId = Number.parseInt(item.productId)
    const productResult = await query("SELECT * FROM products WHERE id = $1", [productId])

    if (productResult.rows.length === 0) {
      // Product doesn't exist, create it
      const newProductResult = await query(
        `
        INSERT INTO products (name, price, image) 
        VALUES ($1, $2, $3) 
        RETURNING id
      `,
        [item.name, item.price, item.image],
      )

      productId = newProductResult.rows[0].id
    }

    // Check if item already exists in cart
    const existingItemResult = await query(
      `
      SELECT * FROM cart_items 
      WHERE cart_id = $1 AND product_id = $2 AND size = $3 AND color = $4
    `,
      [cartId, productId, item.size, item.color],
    )

    if (existingItemResult.rows.length > 0) {
      // Update quantity if item exists
      const existingItem = existingItemResult.rows[0]
      await query(
        `
        UPDATE cart_items 
        SET quantity = quantity + $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `,
        [item.quantity, existingItem.id],
      )
    } else {
      // Add new item if it doesn't exist
      await query(
        `
        INSERT INTO cart_items (cart_id, product_id, quantity, size, color) 
        VALUES ($1, $2, $3, $4, $5)
      `,
        [cartId, productId, item.quantity, item.size, item.color],
      )
    }

    return { success: true }
  } catch (error) {
    console.error("Error adding to cart:", error)
    return { success: false, error: "Failed to add item to cart" }
  }
}

// Update cart item quantity
export async function updateCartItemQuantity(itemId: string, quantity: number) {
  try {
    const { cartId } = await getOrCreateCart()

    if (!cartId) {
      return { success: false, error: "Cart not found" }
    }

    if (quantity <= 0) {
      // Remove item if quantity is 0 or less
      await query(
        `
        DELETE FROM cart_items 
        WHERE id = $1 AND cart_id = $2
      `,
        [itemId, cartId],
      )
    } else {
      // Update quantity
      await query(
        `
        UPDATE cart_items 
        SET quantity = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2 AND cart_id = $3
      `,
        [quantity, itemId, cartId],
      )
    }

    return { success: true }
  } catch (error) {
    console.error("Error updating cart item quantity:", error)
    return { success: false, error: "Failed to update cart item" }
  }
}

// Remove item from cart
export async function removeFromCart(itemId: string) {
  try {
    const { cartId } = await getOrCreateCart()

    if (!cartId) {
      return { success: false, error: "Cart not found" }
    }

    await query(
      `
      DELETE FROM cart_items 
      WHERE id = $1 AND cart_id = $2
    `,
      [itemId, cartId],
    )

    return { success: true }
  } catch (error) {
    console.error("Error removing from cart:", error)
    return { success: false, error: "Failed to remove item from cart" }
  }
}

// Clear cart
export async function clearCart() {
  try {
    const { cartId } = await getOrCreateCart()

    if (!cartId) {
      return { success: false, error: "Cart not found" }
    }

    await query("DELETE FROM cart_items WHERE cart_id = $1", [cartId])

    return { success: true }
  } catch (error) {
    console.error("Error clearing cart:", error)
    return { success: false, error: "Failed to clear cart" }
  }
}

// Save cart for later (for logged-in users)
export async function saveCart() {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return { success: false, error: "User not logged in" }
    }

    const sessionId = cookies().get("cart_session_id")?.value

    if (!sessionId) {
      return { success: true } // No anonymous cart to merge
    }

    // Get anonymous cart
    const anonCartResult = await query("SELECT id FROM carts WHERE session_id = $1", [sessionId])

    if (anonCartResult.rows.length === 0) {
      return { success: true } // No anonymous cart to merge
    }

    const anonCartId = anonCartResult.rows[0].id

    // Get user cart
    const userCartResult = await query("SELECT id FROM carts WHERE user_id = $1", [user.id])

    let userCartId: number

    if (userCartResult.rows.length === 0) {
      // Create user cart if it doesn't exist
      const newCartResult = await query("INSERT INTO carts (user_id) VALUES ($1) RETURNING id", [user.id])
      userCartId = newCartResult.rows[0].id
    } else {
      userCartId = userCartResult.rows[0].id
    }

    // Get all items from anonymous cart
    const anonItemsResult = await query("SELECT product_id, quantity, size, color FROM cart_items WHERE cart_id = $1", [
      anonCartId,
    ])

    // For each item in anonymous cart
    for (const anonItem of anonItemsResult.rows) {
      // Check if item already exists in user cart
      const existingItemResult = await query(
        `
        SELECT id, quantity FROM cart_items 
        WHERE cart_id = $1 AND product_id = $2 AND size = $3 AND color = $4
      `,
        [userCartId, anonItem.product_id, anonItem.size, anonItem.color],
      )

      if (existingItemResult.rows.length > 0) {
        // Update quantity if item exists
        const existingItem = existingItemResult.rows[0]
        await query(
          `
          UPDATE cart_items 
          SET quantity = quantity + $1, updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
        `,
          [anonItem.quantity, existingItem.id],
        )
      } else {
        // Add new item if it doesn't exist
        await query(
          `
          INSERT INTO cart_items (cart_id, product_id, quantity, size, color) 
          VALUES ($1, $2, $3, $4, $5)
        `,
          [userCartId, anonItem.product_id, anonItem.quantity, anonItem.size, anonItem.color],
        )
      }
    }

    // Delete anonymous cart items
    await query("DELETE FROM cart_items WHERE cart_id = $1", [anonCartId])

    // Delete anonymous cart
    await query("DELETE FROM carts WHERE id = $1", [anonCartId])

    // Delete cart session cookie
    cookies().delete("cart_session_id")

    return { success: true }
  } catch (error) {
    console.error("Error saving cart:", error)
    return { success: false, error: "Failed to save cart" }
  }
}
