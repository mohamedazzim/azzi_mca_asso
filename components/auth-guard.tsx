"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSessionTimeout } from "@/hooks/useSessionTimeout";

interface AuthGuardProps {
  children: React.ReactNode
  requiredRole?: string
}

export function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)

  useSessionTimeout();

  useEffect(() => {
    if (typeof window === "undefined") return
    
    const user = localStorage.getItem("user")
    if (!user) {
      router.replace("/login")
      return
    }

    const userData = JSON.parse(user)
    
    // If no specific role is required, just check if user exists
    if (!requiredRole) {
      setIsAuthorized(true)
      return
    }

    // Check if user has the required role
    if (userData.role === requiredRole) {
      setIsAuthorized(true)
    } else {
      // Redirect to dashboard if user doesn't have required role
      router.replace("/admin/dashboard")
    }
  }, [router, requiredRole])

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span>Loading...</span>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
