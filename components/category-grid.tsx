import Link from "next/link"
import Image from "next/image"
import { ArrowUpRight } from "lucide-react"

import InteractiveCard from "@/components/interactive-card"

// Mock category data
const categories = [
  {
    id: 1,
    name: "Dresses",
    image: "/placeholder.svg?height=400&width=300",
    count: 42,
    descriptor: "Fluid shapes built to read in one glance.",
  },
  {
    id: 2,
    name: "Tops",
    image: "/placeholder.svg?height=400&width=300",
    count: 56,
    descriptor: "Layering anchors for sharper capsule building.",
  },
  {
    id: 3,
    name: "Bottoms",
    image: "/placeholder.svg?height=400&width=300",
    count: 38,
    descriptor: "Grounding pieces with cleaner lines and fit.",
  },
  {
    id: 4,
    name: "Accessories",
    image: "/placeholder.svg?height=400&width=300",
    count: 24,
    descriptor: "Finishers that keep the mood intentional.",
  },
]

const layoutClasses = ["lg:col-span-7", "lg:col-span-5", "lg:col-span-5", "lg:col-span-7"]

export default function CategoryGrid() {
  return (
    <div className="grid grid-cols-12 gap-4">
      {categories.map((category, index) => (
        <InteractiveCard
          key={category.id}
          className={`group col-span-12 rounded-[1.75rem] ${layoutClasses[index]}`}
          delay={120 + index * 90}
          tilt={7}
        >
          <Link
            href={`/categories/${category.id}`}
            className="group relative block h-full overflow-hidden rounded-[1.75rem] border border-white/10"
          >
            <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#06080d] via-[#06080d]/24 to-transparent" />
            <Image
              src={category.image || "/placeholder.svg"}
              alt={category.name}
              fill
              className="object-cover opacity-80 transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.08] via-transparent to-transparent opacity-60" />
            <div className="relative z-20 flex h-full min-h-[18rem] flex-col justify-between p-6 text-white sm:min-h-[20rem]">
              <div className="flex items-start justify-between gap-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#f2bc93]">Edit 0{index + 1}</p>
                <span className="rounded-full border border-white/[0.12] bg-black/25 p-2 backdrop-blur-sm transition-colors group-hover:bg-[#ff7b3a] group-hover:text-[#0a0c10]">
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              </div>

              <div>
                <h3 className="text-3xl text-[#f8f1e6] sm:text-4xl">{category.name}</h3>
                <p className="mt-3 max-w-xs text-sm leading-7 text-[#ddd2c4]">{category.descriptor}</p>
                <p className="mt-5 inline-flex rounded-full border border-white/[0.12] bg-white/[0.06] px-3 py-1 text-sm text-[#f8f1e6]">
                  {category.count} pieces
                </p>
              </div>
            </div>
          </Link>
        </InteractiveCard>
      ))}
    </div>
  )
}
