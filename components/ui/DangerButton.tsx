import * as React from "react"
import { cn } from "@/lib/utils"

interface DangerButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean
  icon?: React.ReactNode
}

const DangerButton = React.forwardRef<HTMLButtonElement, DangerButtonProps>(
  ({ className, isLoading, icon, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      className={cn(
        "inline-flex items-center justify-center gap-2",
        "px-4 py-2.5 h-10 rounded-lg",
        "bg-red-600 text-white font-semibold text-sm",
        "transition-all duration-200",
        "hover:bg-red-700 hover:shadow-md",
        "active:scale-95",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
      {...props}
    >
      {isLoading ? (
        <>
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          Loading...
        </>
      ) : (
        <>
          {icon && icon}
          {children}
        </>
      )}
    </button>
  )
)
DangerButton.displayName = "DangerButton"

export { DangerButton }
