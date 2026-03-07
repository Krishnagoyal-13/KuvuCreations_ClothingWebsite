"use client"

import type React from "react"

import { useState } from "react"
import InteractiveCard from "@/components/interactive-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"

export default function Newsletter() {
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Subscribed!",
        description: "You've been added to our newsletter.",
      })
      setEmail("")
      setIsSubmitting(false)
    }, 1000)
  }

  return (
    <InteractiveCard className="antimatter-card-strong relative overflow-hidden px-6 py-8 sm:px-10 sm:py-10 lg:px-12 lg:py-12" delay={120} tilt={6}>
      <div className="pointer-events-none absolute -right-16 top-0 h-52 w-52 rounded-full bg-[rgba(255,123,58,0.18)] blur-3xl" />
      <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#f2bc93]">Inner Circle</p>
          <h2 className="mt-4 max-w-2xl text-4xl leading-tight text-[#f8f1e6] sm:text-5xl">
            Get first access to every drop.
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-8 text-[#b7b0a4]">
            Subscriber-only previews, early release access, and styling notes that keep each capsule feeling coherent.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="antimatter-card mx-auto w-full max-w-xl p-4 sm:p-5">
          <label className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#f2bc93]">Email address</label>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-12 flex-1 rounded-full border-white/[0.12] bg-black/20 px-5 text-[#f8f1e6] placeholder:text-[#8f887d] focus-visible:ring-[#ff7b3a]"
            />
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-12 rounded-full bg-[#ff7b3a] px-6 text-[#0a0c10] hover:bg-[#ff9b61] hover:text-[#0a0c10]"
            >
              {isSubmitting ? "Subscribing..." : "Subscribe"}
            </Button>
          </div>
          <p className="mt-4 text-sm leading-7 text-[#a9a297]">No noise. Just new launches, offers, and useful styling cues.</p>
        </form>
      </div>
    </InteractiveCard>
  )
}
