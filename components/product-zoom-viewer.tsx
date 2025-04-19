"use client"

import type React from "react"

import { useState, useRef } from "react"
import Image from "next/image"

interface ProductZoomViewerProps {
  image: string
  alt: string
}

export default function ProductZoomViewer({ image, alt }: ProductZoomViewerProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [showZoom, setShowZoom] = useState(false)
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (containerRef.current) {
      const { left, top, width, height } = containerRef.current.getBoundingClientRect()
      const x = ((e.clientX - left) / width) * 100
      const y = ((e.clientY - top) / height) * 100

      setCursorPosition({ x: e.clientX - left, y: e.clientY - top })
      setPosition({ x, y })
    }
  }

  return (
    <div className="relative w-full h-full">
      <div
        ref={containerRef}
        className="relative aspect-[4/5] overflow-hidden rounded-lg border cursor-zoom-in"
        onMouseEnter={() => setShowZoom(true)}
        onMouseLeave={() => setShowZoom(false)}
        onMouseMove={handleMouseMove}
      >
        <Image src={image || "/placeholder.svg"} alt={alt} fill className="object-cover" />

        {showZoom && (
          <div
            className="absolute w-24 h-24 border-2 border-rose-500 rounded-full pointer-events-none z-10"
            style={{
              left: cursorPosition.x - 48,
              top: cursorPosition.y - 48,
              opacity: 0.5,
            }}
          />
        )}
      </div>

      {showZoom && (
        <div className="absolute top-0 left-full ml-4 w-[300px] h-[375px] rounded-lg overflow-hidden border shadow-lg hidden lg:block">
          <div
            className="absolute w-full h-full"
            style={{
              backgroundImage: `url(${image})`,
              backgroundPosition: `${position.x}% ${position.y}%`,
              backgroundSize: "200%",
              backgroundRepeat: "no-repeat",
            }}
          />
        </div>
      )}
    </div>
  )
}
