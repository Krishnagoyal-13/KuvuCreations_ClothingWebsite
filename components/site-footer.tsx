import Link from "next/link"
import { Facebook, Instagram, Twitter } from "lucide-react"

export default function SiteFooter() {
  return (
    <footer className="border-t border-[#1f2536]/20 bg-[#171f32] text-[#f2e5ca]">
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div>
            <h3 className="mb-4 text-lg font-semibold tracking-[0.14em] bg-gradient-to-r from-[#f2e5ca] via-[#EABF74] to-[#6cd7e3] bg-clip-text text-transparent">
              KUVU CREATIONS
            </h3>
            <p className="mb-4 text-[#c8bfa9]">
              Curated fashion for the modern woman. Discover your unique style with our premium collection.
            </p>
            <div className="flex gap-4">
              <Link href="#" className="text-[#c8bfa9] hover:text-[#EABF74]">
                <Facebook className="h-5 w-5" />
                <span className="sr-only">Facebook</span>
              </Link>
              <Link href="#" className="text-[#c8bfa9] hover:text-[#EABF74]">
                <Instagram className="h-5 w-5" />
                <span className="sr-only">Instagram</span>
              </Link>
              <Link href="#" className="text-[#c8bfa9] hover:text-[#EABF74]">
                <Twitter className="h-5 w-5" />
                <span className="sr-only">Twitter</span>
              </Link>
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.12em] text-[#f2e5ca]">Shop</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/products/new-arrivals" className="text-[#c8bfa9] hover:text-[#EABF74]">
                  New Arrivals
                </Link>
              </li>
              <li>
                <Link href="/products/bestsellers" className="text-[#c8bfa9] hover:text-[#EABF74]">
                  Bestsellers
                </Link>
              </li>
              <li>
                <Link href="/products/sale" className="text-[#c8bfa9] hover:text-[#EABF74]">
                  Sale
                </Link>
              </li>
              <li>
                <Link href="/collections" className="text-[#c8bfa9] hover:text-[#EABF74]">
                  Collections
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.12em] text-[#f2e5ca]">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-[#c8bfa9] hover:text-[#EABF74]">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-[#c8bfa9] hover:text-[#EABF74]">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/careers" className="text-[#c8bfa9] hover:text-[#EABF74]">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-[#c8bfa9] hover:text-[#EABF74]">
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.12em] text-[#f2e5ca]">Customer Service</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/help" className="text-[#c8bfa9] hover:text-[#EABF74]">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="text-[#c8bfa9] hover:text-[#EABF74]">
                  Shipping & Returns
                </Link>
              </li>
              <li>
                <Link href="/size-guide" className="text-[#c8bfa9] hover:text-[#EABF74]">
                  Size Guide
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-[#c8bfa9] hover:text-[#EABF74]">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-[#f2e5ca]/15 py-6">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-sm text-[#c8bfa9]">Copyright {new Date().getFullYear()} Kuvu Creations. All rights reserved.</p>
          <div className="flex gap-4 text-sm">
            <Link href="/privacy" className="text-[#c8bfa9] hover:text-[#EABF74]">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-[#c8bfa9] hover:text-[#EABF74]">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
