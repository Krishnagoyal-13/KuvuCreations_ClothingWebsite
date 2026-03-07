"use client"

import type { CSSProperties, HTMLAttributes, PointerEvent } from "react"
import { useEffect, useRef, useState } from "react"

import { cn } from "@/lib/utils"

type InteractiveCardProps = HTMLAttributes<HTMLDivElement> & {
  delay?: number
  once?: boolean
  tilt?: number
}

export default function InteractiveCard({
  className,
  children,
  delay = 0,
  once = true,
  tilt = 10,
  onPointerEnter,
  onPointerLeave,
  onPointerMove,
  style,
  ...props
}: InteractiveCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node || typeof IntersectionObserver === "undefined") {
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) {
          return
        }

        if (entry.isIntersecting) {
          setInView(true)
          if (once) {
            observer.unobserve(node)
          }
          return
        }

        if (!once) {
          setInView(false)
        }
      },
      {
        threshold: 0.24,
        rootMargin: "0px 0px -10% 0px",
      },
    )

    observer.observe(node)

    return () => observer.disconnect()
  }, [once])

  const resetCard = () => {
    const node = ref.current
    if (!node) {
      return
    }

    node.style.setProperty("--card-rotate-x", "0deg")
    node.style.setProperty("--card-rotate-y", "0deg")
    node.style.setProperty("--card-lift", "0px")
    node.dataset.hovered = "false"
  }

  const handlePointerEnter = (event: PointerEvent<HTMLDivElement>) => {
    onPointerEnter?.(event)

    if (event.pointerType !== "mouse") {
      return
    }

    const node = ref.current
    if (!node) {
      return
    }

    node.dataset.hovered = "true"
  }

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    onPointerMove?.(event)

    if (event.pointerType !== "mouse") {
      return
    }

    const node = ref.current
    if (!node) {
      return
    }

    const rect = node.getBoundingClientRect()
    const relativeX = (event.clientX - rect.left) / rect.width
    const relativeY = (event.clientY - rect.top) / rect.height
    const rotateX = (0.5 - relativeY) * tilt
    const rotateY = (relativeX - 0.5) * tilt

    node.style.setProperty("--card-glow-x", `${(relativeX * 100).toFixed(2)}%`)
    node.style.setProperty("--card-glow-y", `${(relativeY * 100).toFixed(2)}%`)
    node.style.setProperty("--card-rotate-x", `${rotateX.toFixed(2)}deg`)
    node.style.setProperty("--card-rotate-y", `${rotateY.toFixed(2)}deg`)
    node.style.setProperty("--card-lift", "-6px")
    node.dataset.hovered = "true"
  }

  const handlePointerLeave = (event: PointerEvent<HTMLDivElement>) => {
    onPointerLeave?.(event)
    resetCard()
  }

  const mergedStyle = {
    ...style,
    "--enter-delay": `${delay}ms`,
  } as CSSProperties

  return (
    <div
      ref={ref}
      data-hovered="false"
      data-in-view={inView}
      className={cn("interactive-card-shell", className)}
      style={mergedStyle}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onPointerMove={handlePointerMove}
      {...props}
    >
      <div className="interactive-card-content h-full">{children}</div>
    </div>
  )
}
