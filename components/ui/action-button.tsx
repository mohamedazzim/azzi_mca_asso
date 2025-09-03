'use client'

import { useState } from 'react'
import { Button, ButtonProps } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { cn } from '@/lib/utils'

interface ActionButtonProps extends ButtonProps {
  children: React.ReactNode
  loadingText?: string
  onClick?: () => void | Promise<void>
  icon?: React.ReactNode
}

export function ActionButton({ 
  children, 
  loadingText = "Loading...", 
  onClick, 
  icon,
  className,
  disabled,
  ...props 
}: ActionButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    if (onClick) {
      try {
        setLoading(true)
        await onClick()
      } catch (error) {
        console.error('Action button error:', error)
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <Button
      {...props}
      className={cn(className)}
      disabled={loading || disabled}
      onClick={handleClick}
    >
      {loading ? (
        <>
          <LoadingSpinner size="sm" className="mr-2" />
          {loadingText}
        </>
      ) : (
        <>
          {icon && <span className="mr-2">{icon}</span>}
          {children}
        </>
      )}
    </Button>
  )
}