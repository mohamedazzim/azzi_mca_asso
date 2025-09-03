"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// Screen reader only text
export function ScreenReaderOnly({ 
  children,
  className,
  ...props 
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span 
      className={cn("sr-only", className)}
      {...props}
    >
      {children}
    </span>
  )
}

// Skip link for keyboard navigation
export function SkipLink({ 
  href = "#main",
  children = "Skip to main content",
  className,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a 
      href={href}
      className={cn(
        "absolute left-[-10000px] top-auto w-[1px] h-[1px] overflow-hidden",
        "focus:left-auto focus:top-auto focus:w-auto focus:h-auto focus:overflow-visible",
        "focus:z-50 focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded-md focus:shadow-lg",
        "transition-all duration-200",
        className
      )}
      {...props}
    >
      {children}
    </a>
  )
}

// Focus trap for modals and overlays
export function FocusTrap({ 
  children,
  enabled = true,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  enabled?: boolean
}) {
  const containerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!enabled || !containerRef.current) return

    const container = containerRef.current
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus()
          e.preventDefault()
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus()
          e.preventDefault()
        }
      }
    }

    // Focus first element when trap is enabled
    firstElement?.focus()

    document.addEventListener('keydown', handleTabKey)
    return () => document.removeEventListener('keydown', handleTabKey)
  }, [enabled])

  return (
    <div ref={containerRef} className={className} {...props}>
      {children}
    </div>
  )
}

// Live region for dynamic content announcements
export function LiveRegion({ 
  children,
  politeness = "polite",
  atomic = false,
  relevant = "all",
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  politeness?: "off" | "polite" | "assertive"
  atomic?: boolean
  relevant?: "additions" | "removals" | "text" | "all"
}) {
  return (
    <div 
      aria-live={politeness}
      aria-atomic={atomic}
      aria-relevant={relevant}
      className={cn("sr-only", className)}
      {...props}
    >
      {children}
    </div>
  )
}

// Keyboard navigation helper
export function useKeyboardNavigation(
  items: HTMLElement[] | (() => HTMLElement[]),
  options: {
    orientation?: "horizontal" | "vertical" | "both"
    loop?: boolean
    activateOnFocus?: boolean
  } = {}
) {
  const { orientation = "vertical", loop = true, activateOnFocus = false } = options
  const [currentIndex, setCurrentIndex] = React.useState(0)

  const getItems = React.useCallback(() => {
    return typeof items === "function" ? items() : items
  }, [items])

  const handleKeyDown = React.useCallback((e: KeyboardEvent) => {
    const itemList = getItems()
    if (itemList.length === 0) return

    let nextIndex = currentIndex

    switch (e.key) {
      case "ArrowDown":
        if (orientation === "vertical" || orientation === "both") {
          e.preventDefault()
          nextIndex = currentIndex + 1
          if (nextIndex >= itemList.length) {
            nextIndex = loop ? 0 : itemList.length - 1
          }
        }
        break
      case "ArrowUp":
        if (orientation === "vertical" || orientation === "both") {
          e.preventDefault()
          nextIndex = currentIndex - 1
          if (nextIndex < 0) {
            nextIndex = loop ? itemList.length - 1 : 0
          }
        }
        break
      case "ArrowRight":
        if (orientation === "horizontal" || orientation === "both") {
          e.preventDefault()
          nextIndex = currentIndex + 1
          if (nextIndex >= itemList.length) {
            nextIndex = loop ? 0 : itemList.length - 1
          }
        }
        break
      case "ArrowLeft":
        if (orientation === "horizontal" || orientation === "both") {
          e.preventDefault()
          nextIndex = currentIndex - 1
          if (nextIndex < 0) {
            nextIndex = loop ? itemList.length - 1 : 0
          }
        }
        break
      case "Home":
        e.preventDefault()
        nextIndex = 0
        break
      case "End":
        e.preventDefault()
        nextIndex = itemList.length - 1
        break
      case "Enter":
      case " ":
        if (activateOnFocus) {
          e.preventDefault()
          itemList[currentIndex]?.click()
        }
        break
    }

    if (nextIndex !== currentIndex) {
      setCurrentIndex(nextIndex)
      itemList[nextIndex]?.focus()
    }
  }, [currentIndex, getItems, orientation, loop, activateOnFocus])

  return {
    currentIndex,
    setCurrentIndex,
    handleKeyDown
  }
}

// High contrast mode detection
export function useHighContrast() {
  const [isHighContrast, setIsHighContrast] = React.useState(false)

  React.useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-contrast: high)")
    
    const handleChange = (e: MediaQueryListEvent) => {
      setIsHighContrast(e.matches)
    }

    setIsHighContrast(mediaQuery.matches)
    mediaQuery.addEventListener("change", handleChange)
    
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [])

  return isHighContrast
}

// Reduced motion detection
export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false)

  React.useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches)
    }

    setPrefersReducedMotion(mediaQuery.matches)
    mediaQuery.addEventListener("change", handleChange)
    
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [])

  return prefersReducedMotion
}

// Focus management
export function useFocusManagement() {
  const previousActiveElement = React.useRef<HTMLElement | null>(null)

  const saveFocus = React.useCallback(() => {
    previousActiveElement.current = document.activeElement as HTMLElement
  }, [])

  const restoreFocus = React.useCallback(() => {
    if (previousActiveElement.current) {
      previousActiveElement.current.focus()
      previousActiveElement.current = null
    }
  }, [])

  const focusFirst = React.useCallback((container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstElement = focusableElements[0] as HTMLElement
    firstElement?.focus()
  }, [])

  return {
    saveFocus,
    restoreFocus,
    focusFirst
  }
}

// Accessible form field
export interface AccessibleFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string
  description?: string
  error?: string
  required?: boolean
  children: React.ReactElement
}

export function AccessibleField({
  label,
  description,
  error,
  required = false,
  children,
  className,
  ...props
}: AccessibleFieldProps) {
  const id = React.useId()
  const labelId = `${id}-label`
  const descriptionId = description ? `${id}-description` : undefined
  const errorId = error ? `${id}-error` : undefined

  const describedBy = [descriptionId, errorId].filter(Boolean).join(" ")

  const enhancedChild = React.cloneElement(children, {
    id,
    "aria-labelledby": labelId,
    "aria-describedby": describedBy || undefined,
    "aria-invalid": error ? "true" : undefined,
    "aria-required": required
  })

  return (
    <div className={cn("space-y-2", className)} {...props}>
      <label 
        id={labelId}
        htmlFor={id}
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        {label}
        {required && <span className="ml-1 text-red-500" aria-label="required">*</span>}
      </label>
      
      {description && (
        <p id={descriptionId} className="text-sm text-muted-foreground">
          {description}
        </p>
      )}
      
      {enhancedChild}
      
      {error && (
        <p id={errorId} className="text-sm text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

// Color contrast utilities
export function getContrastRatio(foreground: string, background: string): number {
  // This would implement WCAG contrast ratio calculation
  // For now, return a placeholder value
  return 4.5
}

export function isContrastSufficient(
  foreground: string, 
  background: string, 
  level: "AA" | "AAA" = "AA"
): boolean {
  const ratio = getContrastRatio(foreground, background)
  return level === "AA" ? ratio >= 4.5 : ratio >= 7
}

// Announcement hook for screen readers
export function useAnnouncement() {
  const [announcement, setAnnouncement] = React.useState("")

  const announce = React.useCallback((message: string, priority: "polite" | "assertive" = "polite") => {
    setAnnouncement("")
    // Small delay to ensure screen reader picks up the change
    setTimeout(() => {
      setAnnouncement(message)
    }, 100)
  }, [])

  return {
    announcement,
    announce,
    AnnouncementRegion: () => (
      <LiveRegion aria-live="polite" aria-atomic="true">
        {announcement}
      </LiveRegion>
    )
  }
}