"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Minus, Plus, Trash2, ArrowRight, ShoppingBag } from "lucide-react"
import { useUser } from "@/context/user-context"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { updateCartItemQuantity, removeFromCart, clearCart } from "@/lib/cart-actions"
import { useToast } from "@/components/ui/use-toast"

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export default function CartPage() {
  const { cart, cartTotal, refreshCart } = useUser()
  const [isUpdating, setIsUpdating] = useState<string | null>(null)
  const { toast } = useToast()

  const handleUpdateQuantity = async (itemId: string, quantity: number) => {
    setIsUpdating(itemId)
    try {
      await updateCartItemQuantity(itemId, quantity)
      await refreshCart()
      toast({
        description: "Cart updated successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update cart",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(null)
    }
  }

  const handleRemoveItem = async (itemId: string) => {
    setIsUpdating(itemId)
    try {
      await removeFromCart(itemId)
      await refreshCart()
      toast({
        description: "Item removed from cart",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove item",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(null)
    }
  }

  const handleClearCart = async () => {
    try {
      await clearCart()
      await refreshCart()
      toast({
        description: "Cart cleared successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear cart",
        variant: "destructive",
      })
    }
  }

  if (cart.length === 0) {
    return (
      <div className="container py-16 text-center">
        <div className="max-w-md mx-auto">
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-full bg-muted">
              <ShoppingBag className="h-12 w-12 text-muted-foreground" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-4">Your cart is empty</h1>
          <p className="text-muted-foreground mb-8">Looks like you haven't added anything to your cart yet.</p>
          <Button asChild className="bg-rose-500 hover:bg-rose-600">
            <Link href="/products">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Shopping Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2">
          <div className="space-y-6">
            {cart.map((item) => (
              <div key={item.id} className="flex flex-col sm:flex-row gap-4 border-b pb-6">
                <div className="relative h-32 w-32 flex-shrink-0 rounded-md overflow-hidden">
                  <Image src={item.image || "/placeholder.svg"} alt={item.name} fill className="object-cover" />
                </div>
                <div className="flex-1 flex flex-col">
                  <div className="flex justify-between">
                    <Link href={`/products/${item.productId}`} className="font-medium hover:underline">
                      {item.name}
                    </Link>
                    <span className="font-semibold">{currencyFormatter.format(item.price)}</span>
                  </div>
                  {item.size && <span className="text-sm text-muted-foreground">Size: {item.size}</span>}
                  {item.color && <span className="text-sm text-muted-foreground">Color: {item.color}</span>}
                  <div className="flex items-center justify-between mt-auto pt-2">
                    <div className="flex items-center">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                        disabled={isUpdating === item.id || item.quantity <= 1}
                      >
                        <Minus className="h-3 w-3" />
                        <span className="sr-only">Decrease quantity</span>
                      </Button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                        disabled={isUpdating === item.id}
                      >
                        <Plus className="h-3 w-3" />
                        <span className="sr-only">Increase quantity</span>
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground"
                      onClick={() => handleRemoveItem(item.id)}
                      disabled={isUpdating === item.id}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center mt-6">
            <Button variant="outline" size="sm" onClick={handleClearCart}>
              Clear Cart
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/products">Continue Shopping</Link>
            </Button>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="border rounded-lg p-6 space-y-4 sticky top-20">
            <h2 className="text-xl font-semibold">Order Summary</h2>
            <Separator />
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{currencyFormatter.format(cartTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>Calculated at checkout</span>
              </div>
              <div className="flex justify-between">
                <span>Tax</span>
                <span>Calculated at checkout</span>
              </div>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold text-lg">
              <span>Total</span>
              <span>{currencyFormatter.format(cartTotal)}</span>
            </div>
            <Button className="w-full bg-rose-500 hover:bg-rose-600" asChild>
              <Link href="/checkout">
                Proceed to Checkout <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
