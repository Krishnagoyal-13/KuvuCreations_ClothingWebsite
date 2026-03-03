"use client"

import type React from "react"

import { useState } from "react"
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
    <div className="lux-panel mx-auto max-w-3xl px-6 py-10 text-center sm:px-10">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#6e7488]">Inner Circle</p>
      <h2 className="mt-3 text-4xl text-[#171f32]">Get First Access to Every Drop</h2>
      <p className="mx-auto mb-7 mt-4 max-w-xl text-[#47506b]">
        Subscriber-only promos, early launch previews, and styling picks for every mood board.
      </p>
      <form onSubmit={handleSubmit} className="mx-auto flex max-w-md flex-col gap-3 sm:flex-row">
        <Input
          type="email"
          placeholder="Your email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="h-11 flex-1 rounded-full border-[#171f32]/20 bg-white/80 px-5 text-[#171f32] placeholder:text-[#7a7f92] focus-visible:ring-[#E98A2D]"
        />
        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-11 rounded-full bg-[#171f32] px-6 text-[#FCEBCD] hover:bg-[#242d44]"
        >
          {isSubmitting ? "Subscribing..." : "Subscribe"}
        </Button>
      </form>
    </div>
  )
}
