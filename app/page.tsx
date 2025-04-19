import Link from "next/link"
import Image from "next/image"
import { ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import FeaturedProducts from "@/components/featured-products"
import CategoryGrid from "@/components/category-grid"
import Newsletter from "@/components/newsletter"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative w-full h-[90vh] overflow-hidden">
        <Image
          src="/placeholder.svg?height=1080&width=1920"
          alt="Fashion model in trendy outfit"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-purple-900/40" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 sm:px-6">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-4">Express Your Unique Style</h1>
          <p className="text-xl text-white mb-8 max-w-2xl">
            Discover the artistry of Kuvu Creations - where fashion meets individuality
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button size="lg" className="bg-rose-500 hover:bg-rose-600 text-white" asChild>
              <Link href="/products">Shop Now</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="bg-white/10 backdrop-blur-sm text-white border-white"
              asChild
            >
              <Link href="/style-quiz">Find Your Style</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* New Arrivals */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-rose-500 to-purple-600 bg-clip-text text-transparent">
              New Arrivals
            </h2>
            <Link
              href="/products/new-arrivals"
              className="flex items-center text-sm font-medium hover:underline text-rose-500"
            >
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          <FeaturedProducts />
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-rose-500 to-purple-600 bg-clip-text text-transparent">
            Shop by Category
          </h2>
          <CategoryGrid />
        </div>
      </section>

      {/* Featured Collection */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="order-2 lg:order-1">
              <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-rose-500 to-purple-600 bg-clip-text text-transparent">
                Summer Collection 2025
              </h2>
              <p className="text-muted-foreground mb-6">
                Discover our curated selection of lightweight fabrics and vibrant colors perfect for the summer season.
                Each piece is crafted with attention to detail and designed to make you feel confident and beautiful.
              </p>
              <Button size="lg" className="bg-rose-500 hover:bg-rose-600" asChild>
                <Link href="/collections/summer">Explore Collection</Link>
              </Button>
            </div>
            <div className="order-1 lg:order-2 relative h-[500px] rounded-lg overflow-hidden">
              <Image
                src="/placeholder.svg?height=1000&width=800"
                alt="Summer collection"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="container mx-auto">
          <Newsletter />
        </div>
      </section>
    </div>
  )
}
