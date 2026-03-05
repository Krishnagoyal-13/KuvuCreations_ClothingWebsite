import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Sparkles, Star, TrendingUp } from "lucide-react"

import { Button } from "@/components/ui/button"
import FeaturedProducts from "@/components/featured-products"
import CategoryGrid from "@/components/category-grid"
import Newsletter from "@/components/newsletter"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col pb-8">
      <section className="relative overflow-hidden px-4 pb-12 pt-10 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute -left-20 top-10 h-56 w-56 rounded-full bg-[#FFB253]/40 blur-3xl float-slow" />
        <div
          className="pointer-events-none absolute -right-24 top-28 h-64 w-64 rounded-full bg-[#59D7EA]/30 blur-3xl float-slow"
          style={{ animationDelay: "1.5s" }}
        />

        <div className="container mx-auto grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
          <div className="space-y-8 reveal-up">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#20263A]/20 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#1d2435]">
              <Sparkles className="h-4 w-4 text-[#E98A2D]" />
              New Drop Every Friday
            </div>

            <div className="space-y-5">
              <h1 className="text-balance text-4xl leading-[0.95] text-[#171f32] sm:text-6xl lg:text-7xl">
                Soft Luxury.
                <br />
                <span className="bg-gradient-to-r from-[#171f32] via-[#E98A2D] to-[#59D7EA] bg-clip-text text-transparent">
                  Loud Identity.
                </span>
              </h1>
              <p className="max-w-xl text-lg text-[#353f58] sm:text-xl">
                Kuvu Creations blends elevated fabrics with bold, social-ready silhouettes built for your everyday
                spotlight.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button size="lg" className="rounded-full bg-[#171f32] px-8 text-[#FCEBCD] hover:bg-[#262f48]" asChild>
                <Link href="/products">Shop The Edit</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-full border-[#171f32]/20 bg-white/70 px-8 text-[#171f32] hover:bg-[#171f32] hover:text-[#FCEBCD]"
                asChild
              >
                <Link href="/style-quiz">Build My Style DNA</Link>
              </Button>
            </div>

            <div className="grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="lux-panel reveal-soft p-4 text-center" style={{ animationDelay: "120ms" }}>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6e7488]">Rated</p>
                <p className="mt-1 flex items-center justify-center gap-1 text-2xl font-semibold text-[#171f32]">
                  4.9 <Star className="h-5 w-5 fill-[#E98A2D] text-[#E98A2D]" />
                </p>
              </div>
              <div className="lux-panel reveal-soft p-4 text-center" style={{ animationDelay: "240ms" }}>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6e7488]">Looks Sold</p>
                <p className="mt-1 text-2xl font-semibold text-[#171f32]">18k+</p>
              </div>
              <div className="lux-panel reveal-soft p-4 text-center" style={{ animationDelay: "360ms" }}>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6e7488]">Growth</p>
                <p className="mt-1 flex items-center justify-center gap-1 text-2xl font-semibold text-[#171f32]">
                  63% <TrendingUp className="h-5 w-5 text-[#139a6f]" />
                </p>
              </div>
            </div>
          </div>

          <div className="relative reveal-up lg:pl-8" style={{ animationDelay: "140ms" }}>
            <div className="lux-panel relative h-[460px] overflow-hidden rounded-[2rem] p-3 sm:h-[540px] lg:h-[580px]">
              <div className="absolute left-6 top-6 z-20 rounded-full bg-[#171f32] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#FCEBCD]">
                Capsule 26
              </div>
              <Image
                src="/placeholder.svg?height=1200&width=900"
                alt="Luxury street style model"
                fill
                priority
                className="rounded-[1.6rem] object-cover"
              />
              <div className="absolute inset-0 rounded-[1.6rem] bg-gradient-to-t from-[#11172A]/55 via-transparent to-transparent" />
            </div>
            <div className="absolute -bottom-6 -left-6 hidden w-44 rounded-3xl border border-white/40 bg-white/75 p-4 backdrop-blur md:block">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6e7488]">Trend Watch</p>
              <p className="mt-2 text-lg font-semibold text-[#171f32]">Clean Glam Utility</p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-14 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <div className="mb-8 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#6e7488]">Curated For You</p>
              <h2 className="mt-2 text-3xl text-[#171f32] sm:text-4xl">Hot Right Now</h2>
            </div>
            <Link
              href="/products/new-arrivals"
              className="inline-flex items-center text-sm font-semibold text-[#171f32] hover:text-[#E98A2D]"
            >
              View Full Rack <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          <FeaturedProducts />
        </div>
      </section>

      <section className="px-4 py-14 sm:px-6 lg:px-8">
        <div className="container mx-auto rounded-[2rem] border border-[#20263A]/10 bg-gradient-to-r from-white/70 via-[#fff4df]/65 to-[#eefbfd] p-8 sm:p-10">
          <h2 className="mb-8 text-center text-3xl text-[#171f32] sm:text-4xl">Shop by Mood</h2>
          <CategoryGrid />
        </div>
      </section>

      <section className="px-4 py-14 sm:px-6 lg:px-8">
        <div className="container mx-auto grid grid-cols-1 items-center gap-10 rounded-[2rem] border border-[#20263A]/10 bg-[#171f32] p-8 text-[#FCEBCD] lg:grid-cols-2 lg:p-12">
          <div className="order-2 space-y-5 lg:order-1">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#EABF74]">Limited Capsule</p>
            <h2 className="text-3xl leading-tight sm:text-5xl">The Golden Hour Collection</h2>
            <p className="text-[#d8cdb3]">
              Sculpted cuts, luminous satins, and statement tailoring designed for rooftop nights and camera flashes.
            </p>
            <Button
              size="lg"
              className="rounded-full bg-[#EABF74] px-8 text-[#171f32] hover:bg-[#f4d394] hover:text-[#171f32]"
              asChild
            >
              <Link href="/collections/summer">Explore Collection</Link>
            </Button>
          </div>
          <div className="order-1 relative h-[420px] overflow-hidden rounded-[1.6rem] lg:order-2">
            <Image src="/placeholder.svg?height=900&width=800" alt="Golden hour collection" fill className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#171f32]/55 via-transparent to-transparent" />
          </div>
        </div>
      </section>

      <section className="px-4 py-14 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <Newsletter />
        </div>
      </section>
    </div>
  )
}
