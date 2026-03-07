import Link from "next/link"
import { Facebook, Instagram, Twitter } from "lucide-react"

export default function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#06070a] text-[#f2e6d6]">
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          <div>
            <h3 className="mb-4 text-lg font-semibold tracking-[0.26em] text-[#f7efe3]">KUVU CREATIONS</h3>
            <p className="mb-4 max-w-xs text-[#b4aa9d]">
              Darker, sharper, and more editorial. Kuvu is now staged like a campaign, not just a catalog.
            </p>
            <div className="flex gap-4">
              <Link href="#" className="text-[#b4aa9d] hover:text-[#ff9b61]">
                <Facebook className="h-5 w-5" />
                <span className="sr-only">Facebook</span>
              </Link>
              <Link href="#" className="text-[#b4aa9d] hover:text-[#ff9b61]">
                <Instagram className="h-5 w-5" />
                <span className="sr-only">Instagram</span>
              </Link>
              <Link href="#" className="text-[#b4aa9d] hover:text-[#ff9b61]">
                <Twitter className="h-5 w-5" />
                <span className="sr-only">Twitter</span>
              </Link>
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-[#f7efe3]">Shop</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/products/new-arrivals" className="text-[#b4aa9d] hover:text-[#ff9b61]">
                  New Arrivals
                </Link>
              </li>
              <li>
                <Link href="/products/bestsellers" className="text-[#b4aa9d] hover:text-[#ff9b61]">
                  Bestsellers
                </Link>
              </li>
              <li>
                <Link href="/products/sale" className="text-[#b4aa9d] hover:text-[#ff9b61]">
                  Sale
                </Link>
              </li>
              <li>
                <Link href="/collections" className="text-[#b4aa9d] hover:text-[#ff9b61]">
                  Collections
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-[#f7efe3]">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-[#b4aa9d] hover:text-[#ff9b61]">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-[#b4aa9d] hover:text-[#ff9b61]">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/careers" className="text-[#b4aa9d] hover:text-[#ff9b61]">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-[#b4aa9d] hover:text-[#ff9b61]">
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-[#f7efe3]">Customer Service</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/help" className="text-[#b4aa9d] hover:text-[#ff9b61]">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="text-[#b4aa9d] hover:text-[#ff9b61]">
                  Shipping & Returns
                </Link>
              </li>
              <li>
                <Link href="/size-guide" className="text-[#b4aa9d] hover:text-[#ff9b61]">
                  Size Guide
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-[#b4aa9d] hover:text-[#ff9b61]">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 py-6">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-sm text-[#b4aa9d]">Copyright {new Date().getFullYear()} Kuvu Creations. All rights reserved.</p>
          <div className="flex gap-4 text-sm">
            <Link href="/privacy" className="text-[#b4aa9d] hover:text-[#ff9b61]">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-[#b4aa9d] hover:text-[#ff9b61]">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
