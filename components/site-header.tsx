"use client"

import Link from "next/link"
import { Heart, LogOut, Menu, Search, Shield, ShieldCheck, ShoppingBag, User } from "lucide-react"

import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useUser } from "@/context/user-context"
import { logoutAdmin } from "@/lib/admin-actions"

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
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#06070a]/85 text-[#f7efe3] backdrop-blur-xl supports-[backdrop-filter]:bg-[#06070a]/70">
      <div className="border-b border-white/10 bg-[linear-gradient(90deg,rgba(255,123,58,0.18),rgba(255,255,255,0.04),rgba(255,123,58,0.12))] px-3 py-2 text-center text-[11px] font-medium uppercase tracking-[0.24em] text-[#f6dcc4] sm:text-xs">
        Free express shipping over INR 100 | Use code KUVU20 for 20% off your first order
      </div>

      <div className="container flex items-center gap-2 py-3">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 rounded-full border border-white/10 bg-white/[0.03] text-[#f7efe3] hover:bg-[#ff7b3a] hover:text-[#0a0c10] md:hidden"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>

          <SheetContent side="left" className="w-[85vw] max-w-[340px] border-white/10 bg-[#07090d] text-[#f7efe3] sm:w-[400px]">
            <nav className="mt-8 flex flex-col gap-4">
              <Link href="/" className="text-lg font-semibold text-[#f7efe3] hover:text-[#ff9b61]">
                Home
              </Link>
              <Link href="/products" className="text-lg font-semibold text-[#f7efe3] hover:text-[#ff9b61]">
                Shop All
              </Link>
              <Link href="/categories" className="text-lg font-semibold text-[#f7efe3] hover:text-[#ff9b61]">
                Categories
              </Link>
              <Link href="/collections" className="text-lg font-semibold text-[#f7efe3] hover:text-[#ff9b61]">
                Collections
              </Link>
              <Link href="/about" className="text-lg font-semibold text-[#f7efe3] hover:text-[#ff9b61]">
                About
              </Link>
              <Link href="/contact" className="text-lg font-semibold text-[#f7efe3] hover:text-[#ff9b61]">
                Contact
              </Link>
            </nav>
          </SheetContent>
        </Sheet>

        <Link href="/" className="ml-2 min-w-0 flex-1 md:ml-0 md:flex-none">
          <h1 className="truncate text-base font-semibold tracking-[0.26em] text-[#f7efe3] sm:text-xl">
            KUVU CREATIONS
          </h1>
        </Link>

        <nav className="mx-6 hidden items-center gap-6 text-sm md:flex">
          <Link href="/" className="font-medium uppercase tracking-[0.18em] text-[#d4c8b8] transition-colors hover:text-[#ff9b61]">
            Home
          </Link>
          <Link href="/products" className="font-medium uppercase tracking-[0.18em] text-[#d4c8b8] transition-colors hover:text-[#ff9b61]">
            Shop All
          </Link>
          <Link href="/categories" className="font-medium uppercase tracking-[0.18em] text-[#d4c8b8] transition-colors hover:text-[#ff9b61]">
            Categories
          </Link>
          <Link href="/collections" className="font-medium uppercase tracking-[0.18em] text-[#d4c8b8] transition-colors hover:text-[#ff9b61]">
            Collections
          </Link>
          <Link href="/about" className="font-medium uppercase tracking-[0.18em] text-[#d4c8b8] transition-colors hover:text-[#ff9b61]">
            About
          </Link>
        </nav>

        <div className="flex flex-1 items-center justify-end gap-1 sm:gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="hidden rounded-full border border-white/10 bg-white/[0.03] text-[#f7efe3] hover:bg-[#ff7b3a] hover:text-[#0a0c10] md:flex"
          >
            <Search className="h-5 w-5" />
            <span className="sr-only">Search</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative rounded-full border border-white/10 bg-white/[0.03] text-[#f7efe3] hover:bg-[#ff7b3a] hover:text-[#0a0c10]"
              >
                <User className="h-5 w-5" />
                {isAdmin && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-emerald-500" />}
                <span className="sr-only">User menu</span>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56 border-white/10 bg-[#0b0d11] text-[#f7efe3]">
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

          <Button
            variant="ghost"
            size="icon"
            className="rounded-full border border-white/10 bg-white/[0.03] text-[#f7efe3] hover:bg-[#ff7b3a] hover:text-[#0a0c10]"
          >
            <Heart className="h-5 w-5" />
            <span className="sr-only">Wishlist</span>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="relative rounded-full border border-white/10 bg-white/[0.03] text-[#f7efe3] hover:bg-[#ff7b3a] hover:text-[#0a0c10]"
            asChild
          >
            <Link href="/cart">
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 && (
                <Badge className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#ff7b3a] p-0 text-[#0a0c10] hover:bg-[#ff7b3a]">
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
