'use client'

import { useRouter } from 'next/navigation'
import { useState, useCallback } from 'react'
import { toast } from '@/hooks/use-toast'

export function useNavigationLoading() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const navigateWithLoading = useCallback(async (
    path: string, 
    options?: { 
      replace?: boolean
      showToast?: boolean
      toastMessage?: string
    }
  ) => {
    try {
      setLoading(true)
      
      if (options?.showToast && options?.toastMessage) {
        toast({
          title: "Loading...",
          description: options.toastMessage,
        })
      }

      // Add a small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 100))
      
      if (options?.replace) {
        router.replace(path)
      } else {
        router.push(path)
      }
    } catch (error) {
      console.error('Navigation error:', error)
      toast({
        title: "Navigation Error",
        description: "Failed to navigate. Please try again.",
        variant: "destructive",
      })
    } finally {
      // Keep loading state for a bit longer to show feedback
      setTimeout(() => setLoading(false), 500)
    }
  }, [router])

  const backWithLoading = useCallback(() => {
    try {
      setLoading(true)
      router.back()
      setTimeout(() => setLoading(false), 500)
    } catch (error) {
      console.error('Back navigation error:', error)
      setLoading(false)
    }
  }, [router])

  return {
    loading,
    navigateWithLoading,
    backWithLoading,
    setLoading
  }
}