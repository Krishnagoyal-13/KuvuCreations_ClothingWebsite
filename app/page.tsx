import Link from "next/link"
import { ArrowRight, Layers3, Sparkles, Star, TrendingUp } from "lucide-react"

import { Button } from "@/components/ui/button"
import CategoryGrid from "@/components/category-grid"
import FeaturedProducts from "@/components/featured-products"
import InteractiveCard from "@/components/interactive-card"
import Newsletter from "@/components/newsletter"

const signalMetrics = [
  { label: "Sell-through in week one", value: "82%", note: "Built around fast capsule drops." },
  { label: "Average outfit saves", value: "19k", note: "Designed for repeat styling content." },
  { label: "Repeat customers", value: "3.4x", note: "Clear silhouettes across every launch." },
]

const rhythmHighlights = [
  { label: "Drop cadence", value: "Every Friday" },
  { label: "Core palette", value: "Onyx, bone, ember" },
  { label: "Hero mood", value: "Soft armor / liquid shine" },
]

const collectionSignals = ["Day-zero essentials", "After-dark tailoring", "Travel uniforms", "Camera-ready layers"]

const systemPrinciples = [
  "Sharper typography and darker contrast to make the brand feel more directional.",
  "Asymmetric product blocks and heavier spacing to echo the Antimatter editorial pacing.",
  "Warm orange accents instead of mixed bright colors so calls to action stay deliberate.",
]

export default function Home() {
  return (
    <div className="antimatter-shell overflow-hidden text-[#f6eee2]">
      <section className="relative px-4 pb-16 pt-12 sm:px-6 lg:px-8 lg:pb-24 lg:pt-16">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
        <div className="pointer-events-none absolute -left-20 top-12 h-64 w-64 rounded-full bg-[rgba(255,123,58,0.18)] blur-3xl float-slow" />
        <div
          className="pointer-events-none absolute right-0 top-20 h-80 w-80 rounded-full bg-[rgba(247,217,188,0.1)] blur-3xl float-slow"
          style={{ animationDelay: "1.6s" }}
        />

        <div className="container grid items-start gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:gap-12">
          <div className="space-y-8 reveal-up">
            <div className="antimatter-pill w-fit">
              <Sparkles className="h-4 w-4 text-[#ff9b61]" />
              Inspired by Antimatter. Tuned for fashion.
            </div>

            <div className="space-y-6">
              <h1 className="text-balance max-w-4xl text-5xl leading-[0.88] text-[#f8f1e6] sm:text-6xl lg:text-8xl">
                Kuvu now lands
                <br />
                like a <span className="text-[#ff9b61]">fashion signal.</span>
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-[#b7b0a4] sm:text-xl">
                The storefront shifts from soft boutique styling to a darker editorial system: bigger type, slower
                pacing, stronger contrast, and sharper product framing.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                className="rounded-full bg-[#f6ede1] px-8 text-[#0a0c10] hover:bg-[#ffffff] hover:text-[#0a0c10]"
                asChild
              >
                <Link href="/products">Enter The Drop</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-full border-white/[0.12] bg-white/[0.04] px-8 text-[#f8f1e6] hover:bg-[#ff7b3a] hover:text-[#0a0c10]"
                asChild
              >
                <Link href="/style-quiz">Map My Style DNA</Link>
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {signalMetrics.map((metric, index) => (
                <InteractiveCard
                  key={metric.label}
                  className="antimatter-card reveal-soft p-5"
                  delay={160 + index * 120}
                  tilt={8}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#f2bc93]">{metric.label}</p>
                  <p className="mt-3 text-3xl text-[#f8f1e6]">{metric.value}</p>
                  <p className="mt-2 text-sm leading-6 text-[#a7a094]">{metric.note}</p>
                </InteractiveCard>
              ))}
            </div>
          </div>

          <div className="relative reveal-up lg:pl-4" style={{ animationDelay: "140ms" }}>
            <div className="antimatter-card-strong relative overflow-hidden p-6 sm:p-8">
              <div className="pointer-events-none absolute right-[-8%] top-[-10%] h-52 w-52 rounded-full bg-[rgba(255,123,58,0.16)] blur-3xl" />
              <div className="pointer-events-none absolute bottom-0 left-6 h-28 w-28 rounded-full border border-white/10" />

              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="antimatter-pill">Drop System 03</div>
                  <h2 className="mt-6 text-3xl leading-tight text-[#f8f1e6] sm:text-4xl">Night Signal Capsule</h2>
                  <p className="mt-4 max-w-md text-sm leading-7 text-[#b7b0a4] sm:text-base">
                    Structured tailoring, fluid satins, and clean essentials arranged like launch assets instead of a
                    standard storefront grid.
                  </p>
                </div>

                <div className="rounded-full border border-white/[0.12] bg-white/[0.04] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.26em] text-[#f6ede1]">
                  Live Layout
                </div>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                {rhythmHighlights.map((highlight, index) => (
                  <InteractiveCard
                    key={highlight.label}
                    className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4"
                    delay={160 + index * 80}
                    tilt={7}
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#a8a095]">
                      {highlight.label}
                    </p>
                    <p className="mt-3 text-lg text-[#f8f1e6]">{highlight.value}</p>
                  </InteractiveCard>
                ))}
              </div>

              <div className="mt-8 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
                <InteractiveCard className="rounded-[1.75rem] border border-white/10 bg-black/20 p-5" delay={260} tilt={7}>
                  <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#f2bc93]">
                    <Layers3 className="h-4 w-4" />
                    Launch Priorities
                  </div>
                  <div className="mt-6 space-y-4">
                    {collectionSignals.map((signal, index) => (
                      <div key={signal}>
                        <div className="flex items-center justify-between gap-3 text-sm text-[#f8f1e6]">
                          <span>{signal}</span>
                          <span className="text-[#f2bc93]">0{index + 1}</span>
                        </div>
                        <div className="mt-2 h-px bg-white/10" />
                      </div>
                    ))}
                  </div>
                </InteractiveCard>

                <InteractiveCard
                  className="rounded-[1.75rem] border border-white/10 bg-gradient-to-br from-white/[0.1] to-transparent p-5"
                  delay={340}
                  tilt={7}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#f2bc93]">
                    Visual Momentum
                  </p>
                  <div className="mt-6 space-y-4">
                    <div>
                      <div className="flex items-center justify-between text-sm text-[#b7b0a4]">
                        <span>Hero contrast</span>
                        <span className="text-[#f8f1e6]">95%</span>
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-white/10">
                        <div className="h-full w-[95%] rounded-full bg-[#ff7b3a]" />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-sm text-[#b7b0a4]">
                        <span>Editorial spacing</span>
                        <span className="text-[#f8f1e6]">88%</span>
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-white/10">
                        <div className="h-full w-[88%] rounded-full bg-[#f3d8be]" />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-sm text-[#b7b0a4]">
                        <span>Commerce clarity</span>
                        <span className="text-[#f8f1e6]">91%</span>
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-white/10">
                        <div className="h-full w-[91%] rounded-full bg-[#ff9b61]" />
                      </div>
                    </div>
                  </div>
                </InteractiveCard>
              </div>

              <div className="mt-4">
                <InteractiveCard className="antimatter-card p-5 md:p-6" delay={420} tilt={6}>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#f2bc93]">Trend Watch</p>
                  <div className="mt-3 grid gap-4 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
                    <p className="text-xl leading-tight text-[#f8f1e6] sm:text-2xl">
                      Soft armor tailoring is carrying the entire season.
                    </p>
                    <p className="text-sm leading-7 text-[#a7a094]">
                      Clean shoulders, liquid fabrics, and monochrome layers keep the product story coherent.
                    </p>
                  </div>
                </InteractiveCard>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="container grid gap-4 md:grid-cols-4">
          <InteractiveCard className="antimatter-card p-5" delay={80} tilt={7}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#f2bc93]">Customer score</p>
            <p className="mt-3 flex items-center gap-2 text-3xl text-[#f8f1e6]">
              4.9 <Star className="h-5 w-5 fill-[#ff9b61] text-[#ff9b61]" />
            </p>
          </InteractiveCard>
          <InteractiveCard className="antimatter-card p-5" delay={140} tilt={7}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#f2bc93]">Looks sold</p>
            <p className="mt-3 text-3xl text-[#f8f1e6]">18k+</p>
          </InteractiveCard>
          <InteractiveCard className="antimatter-card p-5" delay={200} tilt={7}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#f2bc93]">Quarter growth</p>
            <p className="mt-3 flex items-center gap-2 text-3xl text-[#f8f1e6]">
              63% <TrendingUp className="h-5 w-5 text-[#ff9b61]" />
            </p>
          </InteractiveCard>
          <InteractiveCard className="antimatter-card p-5" delay={260} tilt={7}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#f2bc93]">Launch rhythm</p>
            <p className="mt-3 text-xl leading-8 text-[#f8f1e6]">Fresh capsule every Friday, always story-first.</p>
          </InteractiveCard>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="container">
          <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#f2bc93]">Featured Edit</p>
              <h2 className="mt-4 text-4xl leading-tight text-[#f8f1e6] sm:text-5xl">Products staged like hero frames.</h2>
            </div>

            <div className="max-w-xl">
              <p className="text-sm leading-7 text-[#b7b0a4]">
                Instead of a flat product shelf, the landing page now treats each item like part of a campaign system,
                with larger image treatments and clearer visual hierarchy.
              </p>
              <Link
                href="/products/new-arrivals"
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-[#f7ddc4] transition-colors hover:text-[#ff9b61]"
              >
                View Full Rack <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <FeaturedProducts />
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="container grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <InteractiveCard className="antimatter-card-strong p-8 sm:p-10" delay={120} tilt={6}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#f2bc93]">Design Direction</p>
            <h2 className="mt-5 text-4xl leading-tight text-[#f8f1e6] sm:text-5xl">One system. Many moods.</h2>
            <p className="mt-5 max-w-xl text-base leading-8 text-[#b7b0a4]">
              This is the Antimatter-inspired shift translated for apparel: darker canvas, stronger structure, and
              more confidence in what deserves attention.
            </p>

            <div className="my-8 antimatter-divider" />

            <div className="space-y-4">
              {systemPrinciples.map((principle) => (
                <div key={principle} className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
                  <p className="text-sm leading-7 text-[#e9dece]">{principle}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              {["Direction-led", "Sharper luxury", "Campaign pacing"].map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-medium text-[#e8dccd]"
                >
                  {tag}
                </span>
              ))}
            </div>
          </InteractiveCard>

          <div className="antimatter-card p-3 sm:p-4">
            <div className="rounded-[1.7rem] border border-white/[0.08] bg-black/20 p-5 sm:p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#f2bc93]">Shop by Mood</p>
              <h3 className="mt-3 text-3xl text-[#f8f1e6] sm:text-4xl">Category tiles with more tension.</h3>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-[#b7b0a4]">
                The category section now behaves like a campaign wall rather than a soft collage.
              </p>
            </div>
            <div className="mt-4">
              <CategoryGrid />
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="container">
          <div className="antimatter-card-strong overflow-hidden p-8 sm:p-10 lg:p-12">
            <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#f2bc93]">Limited Capsule</p>
                <h2 className="mt-5 text-4xl leading-tight text-[#f8f1e6] sm:text-6xl">The Golden Hour collection, reframed.</h2>
                <p className="mt-5 max-w-2xl text-base leading-8 text-[#b7b0a4]">
                  Instead of relying on a generic promo block, the collection is presented as a sharper editorial
                  feature with explicit styling cues and stronger hierarchy.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  {["Luminous satin", "Tailored utility", "Rooftop-ready", "Flash-friendly neutrals"].map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-medium text-[#e8dccd]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <Button
                  size="lg"
                  className="mt-8 rounded-full bg-[#ff7b3a] px-8 text-[#0a0c10] hover:bg-[#ff9b61] hover:text-[#0a0c10]"
                  asChild
                >
                  <Link href="/collections/summer">Explore Collection</Link>
                </Button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  { label: "Looks in the capsule", value: "12" },
                  { label: "Signature finishes", value: "04" },
                  { label: "Styling windows", value: "Day to night" },
                  { label: "Hero promise", value: "Low effort, high read" },
                ].map((item, index) => (
                  <InteractiveCard
                    key={item.label}
                    className="rounded-[1.75rem] border border-white/10 bg-black/20 p-5 sm:p-6"
                    delay={140 + index * 80}
                    tilt={6}
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#f2bc93]">{item.label}</p>
                    <p className="mt-5 text-2xl leading-tight text-[#f8f1e6]">{item.value}</p>
                  </InteractiveCard>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-16 pt-8 sm:px-6 lg:px-8 lg:pb-24">
        <div className="container">
          <Newsletter />
        </div>
      </section>
    </div>
  )
}
