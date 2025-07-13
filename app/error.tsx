"use client"

import { useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, RefreshCw } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const focusRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    console.error(error)
    if (focusRef.current) {
      focusRef.current.focus()
    }
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4" role="alertdialog" aria-modal="true" aria-labelledby="error-title" aria-describedby="error-desc">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <AlertTriangle className="h-12 w-12 text-red-500" aria-hidden="true" />
          </div>
          <CardTitle id="error-title">Something went wrong!</CardTitle>
          <CardDescription id="error-desc">An error occurred while loading this page. Please try again. If the problem persists, <a href="mailto:ca245213133@bhc.edu.in" className="underline text-blue-600">contact support</a>.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={reset} className="w-full" ref={focusRef} aria-label="Try again">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
