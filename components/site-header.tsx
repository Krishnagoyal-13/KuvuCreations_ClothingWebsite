"use client"

import Link from "next/link"
import { Search, ShoppingBag, Heart, User, Menu, LogOut, ShieldCheck, Shield } from "lucide-react"
import { useUser } from "@/context/user-context"
import { logoutAdmin } from "@/lib/admin-actions"
import { useToast } from "@/components/ui/use-toast"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function SiteHeader() {
  const { user, cartCount, logout, isAdmin, refreshAdminStatus } = useUser()
  const { toast } = useToast()

  const handleAdminLogout = async () => {
    const result = await logoutAdmin()
    if (result.success) {
      await refreshAdminStatus()
      toast({
        title: "Admin mode disabled",
        description: "You are now browsing as customer.",
      })
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#1f2536]/10 bg-[#f8f3e9]/85 backdrop-blur-xl supports-[backdrop-filter]:bg-[#f8f3e9]/65">
      {/* Announcement Bar */}
      <div className="bg-gradient-to-r from-[#151b2d] via-[#273453] to-[#0f6e80] px-3 py-2 text-center text-xs font-medium leading-relaxed text-[#f6dca7] sm:text-sm">
        Free express shipping over ₹100 | Use code KUVU20 for 20% off your first order
      </div>

      <div className="container flex h-16 items-center gap-1">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 text-[#171f32] hover:bg-[#171f32]/10 hover:text-[#171f32] md:hidden"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[85vw] max-w-[340px] border-[#1f2536]/10 bg-[#f8f3e9] sm:w-[400px]">
            <nav className="flex flex-col gap-4 mt-8">
              <Link href="/" className="text-lg font-semibold text-[#171f32] hover:text-[#E98A2D]">
                Home
              </Link>
              <Link href="/products" className="text-lg font-semibold text-[#171f32] hover:text-[#E98A2D]">
                Shop All
              </Link>
              <Link href="/categories" className="text-lg font-semibold text-[#171f32] hover:text-[#E98A2D]">
                Categories
              </Link>
              <Link href="/collections" className="text-lg font-semibold text-[#171f32] hover:text-[#E98A2D]">
                Collections
              </Link>
              <Link href="/about" className="text-lg font-semibold text-[#171f32] hover:text-[#E98A2D]">
                About
              </Link>
              <Link href="/contact" className="text-lg font-semibold text-[#171f32] hover:text-[#E98A2D]">
                Contact
              </Link>
            </nav>
          </SheetContent>
        </Sheet>

        <Link href="/" className="ml-2 min-w-0 flex-1 md:ml-0 md:flex-none">
          <h1 className="truncate text-base font-semibold tracking-[0.1em] bg-gradient-to-r from-[#171f32] via-[#E98A2D] to-[#0F6E80] bg-clip-text text-transparent sm:text-xl sm:tracking-[0.16em]">
            KUVU CREATIONS
          </h1>
        </Link>

        <nav className="mx-6 hidden md:flex items-center gap-6 text-sm">
          <Link href="/" className="font-medium text-[#2c3448] transition-colors hover:text-[#E98A2D]">
            Home
          </Link>
          <Link href="/products" className="font-medium text-[#2c3448] transition-colors hover:text-[#E98A2D]">
            Shop All
          </Link>
          <Link href="/categories" className="font-medium text-[#2c3448] transition-colors hover:text-[#E98A2D]">
            Categories
          </Link>
          <Link href="/collections" className="font-medium text-[#2c3448] transition-colors hover:text-[#E98A2D]">
            Collections
          </Link>
          <Link href="/about" className="font-medium text-[#2c3448] transition-colors hover:text-[#E98A2D]">
            About
          </Link>
        </nav>

        <div className="flex flex-1 items-center justify-end gap-1 sm:gap-2">
          <Button variant="ghost" size="icon" className="hidden text-[#171f32] hover:bg-[#171f32]/10 hover:text-[#171f32] md:flex">
            <Search className="h-5 w-5" />
            <span className="sr-only">Search</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative text-[#171f32] hover:bg-[#171f32]/10 hover:text-[#171f32]">
                <User className="h-5 w-5" />
                {isAdmin && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-emerald-500" />}
                <span className="sr-only">User menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 border-[#1f2536]/10 bg-[#fffaf1]">
              <DropdownMenuLabel>{isAdmin ? "Role: Admin" : "Role: Customer"}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={user ? "/account" : "/login"}>
                  <User className="mr-2 h-4 w-4" />
                  {user ? "Customer Dashboard" : "Customer Login"}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/admin">
                  {isAdmin ? <ShieldCheck className="mr-2 h-4 w-4" /> : <Shield className="mr-2 h-4 w-4" />}
                  {isAdmin ? "Admin Dashboard" : "Admin Billing Login"}
                </Link>
              </DropdownMenuItem>
              {isAdmin && (
                <DropdownMenuItem onClick={handleAdminLogout}>
                  <Shield className="mr-2 h-4 w-4" />
                  Exit Admin Mode
                </DropdownMenuItem>
              )}
              {user && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="icon" className="text-[#171f32] hover:bg-[#171f32]/10 hover:text-[#171f32]">
            <Heart className="h-5 w-5" />
            <span className="sr-only">Wishlist</span>
          </Button>

          <Button variant="ghost" size="icon" className="relative text-[#171f32] hover:bg-[#171f32]/10 hover:text-[#171f32]" asChild>
            <Link href="/cart">
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 && (
                <Badge className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#E98A2D] p-0 text-[#1b2235] hover:bg-[#E98A2D]">
                  {cartCount}
                </Badge>
              )}
              <span className="sr-only">Cart</span>
            </Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
