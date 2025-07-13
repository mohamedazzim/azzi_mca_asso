"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function DashboardRedirect() {
  const router = useRouter()

  useEffect(() => {
    if (typeof window === "undefined") return
    if (localStorage.getItem("user")) {
      router.replace("/admin/dashboard")
    } else {
      router.replace("/login")
    }
  }, [router])

  return null
}
