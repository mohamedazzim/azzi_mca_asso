"use client"

import { useState, useEffect } from 'react'

interface User {
  userId: string
  username: string
  role: string
  fullName: string
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const updateUser = () => {
      if (typeof window === "undefined") return
      
      const storedUser = localStorage.getItem("user")
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser)
          setUser(userData)
        } catch (error) {
          console.error("Error parsing stored user data:", error)
          setUser(null)
        }
      } else {
        setUser(null)
      }
      setIsLoading(false)
    }

    updateUser()

    // Listen for storage changes (when user logs in/out in another tab)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "user") {
        updateUser()
      }
    }

    window.addEventListener("storage", handleStorageChange)
    
    return () => {
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [])

  const isAdmin = user?.role === 'admin'
  const isStaff = user?.role === 'staff'
  const canEdit = isAdmin // Only admin can edit
  const canView = isAdmin || isStaff // Both can view

  return {
    user,
    isLoading,
    isAdmin,
    isStaff,
    canEdit,
    canView,
    isAuthenticated: !!user
  }
}