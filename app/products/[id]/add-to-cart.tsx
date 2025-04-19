"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ShoppingBag, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { addToCart } from "@/lib/cart-actions"
import { useUser } from "@/context/user-context"

interface AddToCartProps {
  product: {
    id: string
    name: string
    price: number
    image: string
  }
  selectedSize: string
  selectedColor: string
  quantity: number
}

export default function AddToCart({ product, selectedSize, selectedColor, quantity }: AddToCartProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const { refreshCart } = useUser()
  const router = useRouter()

  const handleAddToCart = async () => {
    if (!selectedSize) {
      toast({
        title: "Please select a size",
        variant: "destructive",
      })
      return
    }

    if (!selectedColor) {
      toast({
        title: "Please select a color",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      await addToCart({
        productId: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity,
        size: selectedSize,
        color: selectedColor,
      })

      await refreshCart()

      toast({
        title: "Added to cart",
        description: `${quantity} × ${product.name} added to your cart`,
      })

      // Optional: Navigate to cart
      // router.push('/cart');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add item to cart",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button className="flex-1 bg-rose-500 hover:bg-rose-600" size="lg" onClick={handleAddToCart} disabled={isLoading}>
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Adding...
        </>
      ) : (
        <>
          <ShoppingBag className="mr-2 h-5 w-5" /> Add to Cart
        </>
      )}
    </Button>
  )
}
