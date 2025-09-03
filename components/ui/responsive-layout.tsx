"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, X } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

// Responsive container
export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "full"
}

export function Container({ 
  size = "xl", 
  className, 
  children, 
  ...props 
}: ContainerProps) {
  const sizeClasses = {
    sm: "max-w-3xl",
    md: "max-w-5xl", 
    lg: "max-w-6xl",
    xl: "max-w-7xl",
    "2xl": "max-w-screen-2xl",
    full: "max-w-full"
  }

  return (
    <div 
      className={cn("mx-auto px-4 sm:px-6 lg:px-8", sizeClasses[size], className)}
      {...props}
    >
      {children}
    </div>
  )
}

// Responsive grid
export interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  cols?: {
    default?: number
    sm?: number
    md?: number
    lg?: number
    xl?: number
    "2xl"?: number
  }
  gap?: number
}

export function Grid({ 
  cols = { default: 1, md: 2, lg: 3 },
  gap = 6,
  className,
  children,
  ...props
}: GridProps) {
  const gridClasses = []
  
  if (cols.default) gridClasses.push(`grid-cols-${cols.default}`)
  if (cols.sm) gridClasses.push(`sm:grid-cols-${cols.sm}`)
  if (cols.md) gridClasses.push(`md:grid-cols-${cols.md}`)
  if (cols.lg) gridClasses.push(`lg:grid-cols-${cols.lg}`)
  if (cols.xl) gridClasses.push(`xl:grid-cols-${cols.xl}`)
  if (cols["2xl"]) gridClasses.push(`2xl:grid-cols-${cols["2xl"]}`)
  
  return (
    <div 
      className={cn("grid", `gap-${gap}`, ...gridClasses, className)}
      {...props}
    >
      {children}
    </div>
  )
}

// Responsive stack
export interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: "row" | "col"
  responsive?: {
    sm?: "row" | "col"
    md?: "row" | "col" 
    lg?: "row" | "col"
  }
  spacing?: number
  align?: "start" | "center" | "end" | "stretch"
  justify?: "start" | "center" | "end" | "between" | "around" | "evenly"
}

export function Stack({
  direction = "col",
  responsive,
  spacing = 4,
  align = "stretch",
  justify = "start",
  className,
  children,
  ...props
}: StackProps) {
  const directionClass = direction === "row" ? "flex-row" : "flex-col"
  const spacingClass = direction === "row" ? `space-x-${spacing}` : `space-y-${spacing}`
  
  const alignClasses = {
    start: "items-start",
    center: "items-center", 
    end: "items-end",
    stretch: "items-stretch"
  }
  
  const justifyClasses = {
    start: "justify-start",
    center: "justify-center",
    end: "justify-end", 
    between: "justify-between",
    around: "justify-around",
    evenly: "justify-evenly"
  }

  const responsiveClasses = []
  if (responsive?.sm) {
    responsiveClasses.push(`sm:${responsive.sm === "row" ? "flex-row" : "flex-col"}`)
  }
  if (responsive?.md) {
    responsiveClasses.push(`md:${responsive.md === "row" ? "flex-row" : "flex-col"}`)
  }
  if (responsive?.lg) {
    responsiveClasses.push(`lg:${responsive.lg === "row" ? "flex-row" : "flex-col"}`)
  }

  return (
    <div 
      className={cn(
        "flex",
        directionClass,
        spacingClass,
        alignClasses[align],
        justifyClasses[justify],
        ...responsiveClasses,
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

// Mobile-first navigation
export interface NavItem {
  label: string
  href: string
  icon?: React.ReactNode
  badge?: string | number
  children?: NavItem[]
}

export interface ResponsiveHeaderProps {
  title: string
  subtitle?: string
  navItems?: NavItem[]
  actions?: React.ReactNode
  showMobileMenu?: boolean
  onMobileMenuToggle?: (open: boolean) => void
}

export function ResponsiveHeader({
  title,
  subtitle,
  navItems = [],
  actions,
  showMobileMenu = false,
  onMobileMenuToggle
}: ResponsiveHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
  const pathname = usePathname()

  const handleMobileMenuToggle = (open: boolean) => {
    setMobileMenuOpen(open)
    onMobileMenuToggle?.(open)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <Container>
        <div className="flex h-16 items-center justify-between">
          {/* Logo/Title */}
          <div className="flex items-center space-x-4">
            <div>
              <h1 className="text-xl font-bold">{title}</h1>
              {subtitle && (
                <p className="text-sm text-muted-foreground hidden sm:block">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary",
                  pathname === item.href 
                    ? "text-primary" 
                    : "text-muted-foreground"
                )}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge && (
                  <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-2">
            {actions}
            
            {/* Mobile menu trigger */}
            {navItems.length > 0 && (
              <Sheet open={mobileMenuOpen} onOpenChange={handleMobileMenuToggle}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold">{title}</h2>
                  </div>
                  
                  <nav className="space-y-2">
                    {navItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => handleMobileMenuToggle(false)}
                        className={cn(
                          "flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent",
                          pathname === item.href 
                            ? "bg-accent text-accent-foreground" 
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {item.icon}
                        <span className="flex-1">{item.label}</span>
                        {item.badge && (
                          <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    ))}
                  </nav>
                </SheetContent>
              </Sheet>
            )}
          </div>
        </div>
      </Container>
    </header>
  )
}

// Responsive sidebar layout
export interface SidebarLayoutProps {
  sidebar: React.ReactNode
  children: React.ReactNode
  sidebarWidth?: string
  collapsible?: boolean
  defaultCollapsed?: boolean
  className?: string
}

export function SidebarLayout({
  sidebar,
  children,
  sidebarWidth = "w-64",
  collapsible = false,
  defaultCollapsed = false,
  className
}: SidebarLayoutProps) {
  const [collapsed, setCollapsed] = React.useState(defaultCollapsed)
  const [mobileOpen, setMobileOpen] = React.useState(false)

  return (
    <div className={cn("flex h-screen bg-background", className)}>
      {/* Mobile sidebar */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-80 p-0">
          {sidebar}
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <aside className={cn(
        "hidden lg:flex flex-col border-r bg-background/95 backdrop-blur transition-all duration-300",
        collapsed ? "w-16" : sidebarWidth
      )}>
        {collapsible && (
          <div className="p-4 border-b">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCollapsed(!collapsed)}
              className="w-full"
            >
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        )}
        <div className="flex-1 overflow-auto">
          {sidebar}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header with menu trigger */}
        <div className="lg:hidden border-b p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
        
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

// Responsive card grid
export interface CardGridProps {
  children: React.ReactNode
  cols?: number
  gap?: number
  className?: string
}

export function CardGrid({ 
  children, 
  cols = 3, 
  gap = 6, 
  className 
}: CardGridProps) {
  return (
    <div className={cn(
      "grid gap-6",
      `grid-cols-1`,
      cols >= 2 && "sm:grid-cols-2",
      cols >= 3 && "lg:grid-cols-3", 
      cols >= 4 && "xl:grid-cols-4",
      className
    )}>
      {children}
    </div>
  )
}

// Breakpoint utilities hook
export function useBreakpoint() {
  const [breakpoint, setBreakpoint] = React.useState<string>("sm")

  React.useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth
      if (width >= 1536) setBreakpoint("2xl")
      else if (width >= 1280) setBreakpoint("xl") 
      else if (width >= 1024) setBreakpoint("lg")
      else if (width >= 768) setBreakpoint("md")
      else if (width >= 640) setBreakpoint("sm")
      else setBreakpoint("xs")
    }

    updateBreakpoint()
    window.addEventListener("resize", updateBreakpoint)
    return () => window.removeEventListener("resize", updateBreakpoint)
  }, [])

  return {
    breakpoint,
    isXs: breakpoint === "xs",
    isSm: breakpoint === "sm", 
    isMd: breakpoint === "md",
    isLg: breakpoint === "lg",
    isXl: breakpoint === "xl",
    is2Xl: breakpoint === "2xl",
    isMobile: ["xs", "sm"].includes(breakpoint),
    isTablet: breakpoint === "md",
    isDesktop: ["lg", "xl", "2xl"].includes(breakpoint)
  }
}