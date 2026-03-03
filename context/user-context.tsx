"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { getCurrentUser, logoutUser } from "@/lib/auth-actions"
import { getCart, type CartItem } from "@/lib/cart-actions"
import { getAdminSessionStatus } from "@/lib/admin-actions"

interface User {
  id: string
  firstName: string
  lastName: string
  email: string
}

interface UserContextType {
  user: User | null
  isAdmin: boolean
  isLoading: boolean
  cart: CartItem[]
  cartCount: number
  cartTotal: number
  refreshCart: () => Promise<void>
  refreshAdminStatus: () => Promise<void>
  logout: () => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [cart, setCart] = useState<CartItem[]>([])
  const router = useRouter()
  const { toast } = useToast()

  const fetchUserData = async () => {
    try {
      const userData = await getCurrentUser()
      setUser(userData)
    } catch (error) {
      console.error("Error fetching user data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCart = async () => {
    try {
      const cartData = await getCart()
      setCart(cartData)
    } catch (error) {
      console.error("Error fetching cart:", error)
      toast({
        title: "Error",
        description: "Could not load your cart. Please try again later.",
        variant: "destructive",
      })
    }
  }

  const refreshCart = async () => {
    await fetchCart()
  }

  const fetchAdminStatus = async () => {
    try {
      const hasAdminAccess = await getAdminSessionStatus()
      setIsAdmin(hasAdminAccess)
    } catch (error) {
      console.error("Error fetching admin status:", error)
      setIsAdmin(false)
    }
  }

  const refreshAdminStatus = async () => {
    await fetchAdminStatus()
  }

  const logout = async () => {
    try {
      await logoutUser()
      setUser(null)
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      })
      router.refresh()
    } catch (error) {
      console.error("Error logging out:", error)
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    fetchUserData()
    fetchCart()
    fetchAdminStatus()
  }, [])

  // Calculate cart count and total
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0)
  const cartTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0)

  return (
    <UserContext.Provider
      value={{
        user,
        isAdmin,
        isLoading,
        cart,
        cartCount,
        cartTotal,
        refreshCart,
        refreshAdminStatus,
        logout,
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider")
  }
  return context
}
