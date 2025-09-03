"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow hover:bg-primary/90 hover:shadow-md",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 hover:shadow-md",
        outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground hover:shadow-md",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 hover:shadow-md",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        success: "bg-green-600 text-white shadow hover:bg-green-700 hover:shadow-md",
        warning: "bg-yellow-600 text-white shadow hover:bg-yellow-700 hover:shadow-md",
        info: "bg-blue-600 text-white shadow hover:bg-blue-700 hover:shadow-md"
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        xl: "h-12 rounded-md px-10 text-base",
        icon: "h-9 w-9",
        "icon-sm": "h-8 w-8",
        "icon-lg": "h-10 w-10"
      },
      loading: {
        true: "cursor-not-allowed",
        false: ""
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      loading: false
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  loadingText?: string
  icon?: React.ReactNode
  iconPosition?: "left" | "right"
  tooltip?: string
  confirmAction?: boolean
  confirmMessage?: string
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    asChild = false, 
    loading = false,
    loadingText,
    icon,
    iconPosition = "left",
    tooltip,
    confirmAction = false,
    confirmMessage = "Are you sure?",
    children,
    onClick,
    disabled,
    ...props 
  }, ref) => {
    const [showConfirm, setShowConfirm] = React.useState(false)
    const Comp = asChild ? Slot : "button"

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      if (confirmAction && !showConfirm) {
        event.preventDefault()
        setShowConfirm(true)
        // Auto-hide confirmation after 3 seconds
        setTimeout(() => setShowConfirm(false), 3000)
        return
      }
      
      if (onClick) {
        onClick(event)
      }
      setShowConfirm(false)
    }

    const content = (
      <>
        {loading && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        )}
        {!loading && icon && iconPosition === "left" && (
          <span className="mr-2">{icon}</span>
        )}
        {loading ? (loadingText || "Loading...") : children}
        {!loading && icon && iconPosition === "right" && (
          <span className="ml-2">{icon}</span>
        )}
        
        {/* Ripple effect */}
        <span className="absolute inset-0 overflow-hidden rounded-md">
          <span className="absolute inset-0 rounded-md opacity-0 transition-opacity duration-300 bg-white/20 hover:opacity-100" />
        </span>
      </>
    )

    const button = (
      <Comp
        className={cn(buttonVariants({ variant, size, loading, className }))}
        ref={ref}
        disabled={disabled || loading}
        onClick={handleClick}
        title={tooltip}
        aria-label={tooltip}
        {...props}
      >
        {showConfirm ? (
          <>
            <span className="mr-2">⚠️</span>
            {confirmMessage}
          </>
        ) : (
          content
        )}
      </Comp>
    )

    if (tooltip && !asChild) {
      return (
        <div className="relative group">
          {button}
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
            {tooltip}
          </div>
        </div>
      )
    }

    return button
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }