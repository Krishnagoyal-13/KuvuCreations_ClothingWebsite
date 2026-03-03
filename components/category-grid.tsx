import Link from "next/link"
import Image from "next/image"

// Mock category data
const categories = [
  {
    id: 1,
    name: "Dresses",
    image: "/placeholder.svg?height=400&width=300",
    count: 42,
  },
  {
    id: 2,
    name: "Tops",
    image: "/placeholder.svg?height=400&width=300",
    count: 56,
  },
  {
    id: 3,
    name: "Bottoms",
    image: "/placeholder.svg?height=400&width=300",
    count: 38,
  },
  {
    id: 4,
    name: "Accessories",
    image: "/placeholder.svg?height=400&width=300",
    count: 24,
  },
]

export default function CategoryGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {categories.map((category) => (
        <Link
          key={category.id}
          href={`/categories/${category.id}`}
          className="group relative h-80 overflow-hidden rounded-3xl border border-[#1f2536]/10"
        >
          <Image
            src={category.image || "/placeholder.svg"}
            alt={category.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#131a2e]/80 via-[#131a2e]/20 to-transparent transition-all duration-500 group-hover:from-[#131a2e]/90" />
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#f6dca7]">Edit</p>
            <h3 className="mb-1 mt-2 text-3xl">{category.name}</h3>
            <p className="rounded-full border border-white/40 bg-white/10 px-3 py-1 text-sm backdrop-blur">
              {category.count} items
            </p>
          </div>
        </Link>
      ))}
    </div>
  )
}
