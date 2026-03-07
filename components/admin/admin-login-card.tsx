"use client"

import { FormEvent, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Lock } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { loginAdmin } from "@/lib/admin-actions"
import { useUser } from "@/context/user-context"

export default function AdminLoginCard() {
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const { refreshAdminStatus } = useUser()

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")

    startTransition(async () => {
      const result = await loginAdmin(password)
      if (!result.success) {
        setError(result.error || "Invalid admin password.")
        return
      }

      setPassword("")
      await refreshAdminStatus()
      router.refresh()
    })
  }

  return (
    <div className="container py-10">
      <Card className="mx-auto max-w-lg border-[#1f2536]/[0.15] bg-white/80 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#171f32]">
            <Lock className="h-5 w-5" />
            Admin Billing Access
          </CardTitle>
          <CardDescription>Enter admin password to open Billing, Orders, and Payment tabs.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="admin-password" className="text-sm font-medium text-[#171f32]">
                Admin Password
              </label>
              <Input
                id="admin-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter admin password"
                required
                className="border-[#1f2536]/20"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button
              type="submit"
              disabled={isPending}
              className="w-full rounded-full bg-[#171f32] text-[#FCEBCD] hover:bg-[#2b3652]"
            >
              {isPending ? "Verifying..." : "Open Admin Billing"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
