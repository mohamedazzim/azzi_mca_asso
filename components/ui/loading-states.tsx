"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Loader2, MoreHorizontal } from "lucide-react"

// Skeleton loading component
export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

// Enhanced spinner component
export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg" | "xl"
  variant?: "default" | "dots" | "pulse" | "bounce"
  color?: "default" | "primary" | "secondary" | "accent"
}

export function Spinner({ 
  size = "md", 
  variant = "default", 
  color = "default",
  className,
  ...props 
}: SpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6", 
    lg: "h-8 w-8",
    xl: "h-12 w-12"
  }

  const colorClasses = {
    default: "text-foreground",
    primary: "text-primary",
    secondary: "text-secondary",
    accent: "text-accent"
  }

  if (variant === "dots") {
    return (
      <div className={cn("flex space-x-1", className)} {...props}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={cn(
              "rounded-full bg-current animate-pulse",
              size === "sm" ? "h-1 w-1" : 
              size === "md" ? "h-1.5 w-1.5" :
              size === "lg" ? "h-2 w-2" : "h-3 w-3",
              colorClasses[color]
            )}
            style={{
              animationDelay: `${i * 0.2}s`,
              animationDuration: "1s"
            }}
          />
        ))}
      </div>
    )
  }

  if (variant === "pulse") {
    return (
      <div
        className={cn(
          "rounded-full bg-current animate-pulse",
          sizeClasses[size],
          colorClasses[color],
          className
        )}
        {...props}
      />
    )
  }

  if (variant === "bounce") {
    return (
      <div className={cn("flex space-x-1", className)} {...props}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={cn(
              "rounded-full bg-current animate-bounce",
              size === "sm" ? "h-2 w-2" : 
              size === "md" ? "h-3 w-3" :
              size === "lg" ? "h-4 w-4" : "h-6 w-6",
              colorClasses[color]
            )}
            style={{
              animationDelay: `${i * 0.1}s`,
              animationDuration: "0.6s"
            }}
          />
        ))}
      </div>
    )
  }

  return (
    <Loader2 
      className={cn(
        "animate-spin",
        sizeClasses[size],
        colorClasses[color],
        className
      )} 
      {...props}
    />
  )
}

// Table loading skeleton
export function TableSkeleton({ 
  rows = 5, 
  columns = 4,
  showHeader = true 
}: { 
  rows?: number
  columns?: number
  showHeader?: boolean
}) {
  return (
    <div className="w-full">
      {showHeader && (
        <div className="flex space-x-4 mb-4">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-4 flex-1" />
          ))}
        </div>
      )}
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex space-x-4">
            {Array.from({ length: columns }).map((_, j) => (
              <Skeleton key={j} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// Card loading skeleton
export function CardSkeleton({ 
  showAvatar = false,
  showImage = false,
  lines = 3 
}: {
  showAvatar?: boolean
  showImage?: boolean  
  lines?: number
}) {
  return (
    <div className="rounded-lg border p-6 space-y-4">
      {showImage && <Skeleton className="h-48 w-full" />}
      
      <div className="space-y-3">
        {showAvatar && (
          <div className="flex items-center space-x-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-3 w-[100px]" />
            </div>
          </div>
        )}
        
        <div className="space-y-2">
          {Array.from({ length: lines }).map((_, i) => (
            <Skeleton 
              key={i} 
              className={cn(
                "h-4",
                i === lines - 1 ? "w-[60%]" : "w-full"
              )} 
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// Form loading skeleton  
export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="space-y-6">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <div className="flex space-x-2">
        <Skeleton className="h-10 w-20" />
        <Skeleton className="h-10 w-20" />
      </div>
    </div>
  )
}

// List loading skeleton
export function ListSkeleton({ 
  items = 5,
  showThumbnail = false 
}: { 
  items?: number
  showThumbnail?: boolean
}) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center space-x-3 p-3 border rounded">
          {showThumbnail && <Skeleton className="h-12 w-12 rounded" />}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-8 w-16" />
        </div>
      ))}
    </div>
  )
}

// Progress bar component
export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
  max?: number
  variant?: "default" | "success" | "warning" | "error"
  size?: "sm" | "md" | "lg"
  showLabel?: boolean
  animated?: boolean
}

export function Progress({
  value = 0,
  max = 100,
  variant = "default",
  size = "md",
  showLabel = false,
  animated = false,
  className,
  ...props
}: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
  
  const sizeClasses = {
    sm: "h-1",
    md: "h-2", 
    lg: "h-3"
  }

  const variantClasses = {
    default: "bg-primary",
    success: "bg-green-500",
    warning: "bg-yellow-500", 
    error: "bg-red-500"
  }

  return (
    <div className={cn("w-full space-y-1", className)} {...props}>
      {showLabel && (
        <div className="flex justify-between text-sm">
          <span>Progress</span>
          <span>{Math.round(percentage)}%</span>
        </div>
      )}
      <div className={cn("bg-secondary rounded-full overflow-hidden", sizeClasses[size])}>
        <div
          className={cn(
            "h-full transition-all duration-300 ease-out rounded-full",
            variantClasses[variant],
            animated && "bg-gradient-to-r from-transparent via-white/20 to-transparent bg-[length:200%_100%] animate-pulse"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

// Loading overlay component
export interface LoadingOverlayProps {
  isLoading: boolean
  children: React.ReactNode
  message?: string
  variant?: "spinner" | "dots" | "pulse"
  blur?: boolean
}

export function LoadingOverlay({
  isLoading,
  children,
  message = "Loading...",
  variant = "spinner",
  blur = true
}: LoadingOverlayProps) {
  return (
    <div className="relative">
      {children}
      {isLoading && (
        <div className={cn(
          "absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50",
          blur && "backdrop-blur-sm"
        )}>
          <div className="flex flex-col items-center space-y-2">
            <Spinner variant={variant} size="lg" />
            {message && (
              <p className="text-sm text-muted-foreground">{message}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Pulse animation for live updates
export function PulseIndicator({ 
  active = false,
  color = "green" 
}: { 
  active?: boolean
  color?: "green" | "blue" | "red" | "yellow"
}) {
  const colorClasses = {
    green: "bg-green-500",
    blue: "bg-blue-500", 
    red: "bg-red-500",
    yellow: "bg-yellow-500"
  }

  return (
    <div className="relative">
      <div className={cn("h-2 w-2 rounded-full", colorClasses[color])} />
      {active && (
        <div className={cn(
          "absolute inset-0 h-2 w-2 rounded-full animate-ping",
          colorClasses[color],
          "opacity-75"
        )} />
      )}
    </div>
  )
}