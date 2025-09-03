'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { cn } from '@/lib/utils'

interface NavigationLinkProps {
  href: string
  children: React.ReactNode
  className?: string
}

export function NavigationLink({ href, children, className }: NavigationLinkProps) {
  const [loading, setLoading] = useState(false)
  const pathname = usePathname()
  const isActive = pathname === href || pathname.startsWith(href + '/')

  const handleClick = () => {
    if (pathname !== href) {
      setLoading(true)
      // Reset loading state after a delay
      setTimeout(() => setLoading(false), 1000)
    }
  }

  return (
    <Link 
      href={href} 
      className={cn(
        "text-gray-700 hover:text-blue-700 font-medium inline-flex items-center space-x-1 transition-colors",
        isActive && "text-blue-700 font-semibold",
        className
      )}
      onClick={handleClick}
    >
      {loading && <LoadingSpinner size="sm" className="mr-1" />}
      <span>{children}</span>
    </Link>
  )
}