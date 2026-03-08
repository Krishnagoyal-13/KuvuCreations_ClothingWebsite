import { notFound } from "next/navigation"

import { getCatalogProductById, getCatalogProductIds } from "@/lib/catalog"

import ProductDetail from "./product-detail"

export async function generateStaticParams() {
  const ids = await getCatalogProductIds()
  return ids.map((id) => ({ id }))
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const product = await getCatalogProductById(id)

  if (!product) {
    notFound()
  }

  return <ProductDetail product={product} />
}
