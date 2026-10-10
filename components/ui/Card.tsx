import * as React from "react"
import { cn } from "@/lib/utils"

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean
  variant?: 'default' | 'glass' | 'premium'
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, hoverable = false, variant = 'default', ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-2xl border transition-all duration-300",
        // Light theme (default)
        "bg-white border-slate-200 text-slate-950 shadow-sm",
        // Dark theme & Variants
        variant === 'default' && "dark:bg-slate-50 dark:border-slate-200 dark:text-slate-50",
        variant === 'glass' && "dark:bg-white/40 dark:backdrop-blur-xl dark:border-slate-200",
        variant === 'premium' && "dark:bg-white dark:border-slate-200 dark:shadow-2xl",
        
        hoverable && "hover:shadow-lg dark:hover:shadow-blue-500/5 hover:border-slate-300 dark:hover:border-slate-200 hover:translate-y-[-4px]",
        className
      )}
      {...props}
    />
  )
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref as any}
    className={cn(
      "text-lg font-bold leading-none tracking-tight dark:text-slate-900 text-slate-900",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm dark:text-slate-600 text-slate-500 font-medium", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0 border-t border-slate-100 dark:border-slate-200/50 mt-4", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter }
