"use client"

import Link from "next/link"
import { useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Home, ArrowLeft } from "lucide-react"

export default function NotFound() {
  const focusRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (focusRef.current) {
      focusRef.current.focus()
    }
  }, [])
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4" role="alertdialog" aria-modal="true" aria-labelledby="notfound-title" aria-describedby="notfound-desc">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="text-6xl font-bold text-gray-400 mb-4" id="notfound-title">404</CardTitle>
          <CardTitle>Page Not Found</CardTitle>
          <CardDescription id="notfound-desc">The page you&apos;re looking for doesn&apos;t exist or has been moved. If you believe this is an error, <a href="mailto:ca245213133@bhc.edu.in" className="underline text-blue-600">contact support</a>.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Link href="/login">
            <Button className="w-full" ref={focusRef} aria-label="Go to Login">
              <Home className="mr-2 h-4 w-4" />
              Go to Login
            </Button>
          </Link>
          <Button variant="outline" onClick={() => window.history.back()} className="w-full" aria-label="Go Back">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
