"use client"

import { useState } from "react"
import { AlertCircle, X } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

export default function MockDataNotice() {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) {
    return null
  }

  return (
    <Alert className="fixed bottom-4 right-4 w-auto max-w-md z-50 bg-yellow-50 border-yellow-200">
      <AlertCircle className="h-4 w-4 text-yellow-600" />
      <div className="flex-1">
        <AlertTitle className="text-yellow-800">Using Mock Data</AlertTitle>
        <AlertDescription className="text-yellow-700">
          This preview is using mock data instead of a live database connection.
        </AlertDescription>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-100"
        onClick={() => setDismissed(true)}
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Dismiss</span>
      </Button>
    </Alert>
  )
}
