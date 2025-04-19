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
          className="group relative h-80 overflow-hidden rounded-lg"
        >
          <Image
            src={category.image || "/placeholder.svg"}
            alt={category.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-4">
            <h3 className="text-2xl font-bold mb-1">{category.name}</h3>
            <p className="text-sm opacity-90">{category.count} items</p>
          </div>
        </Link>
      ))}
    </div>
  )
}
