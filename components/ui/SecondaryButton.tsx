import * as React from "react"
import { cn } from "@/lib/utils"

interface SecondaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean
  icon?: React.ReactNode
}

const SecondaryButton = React.forwardRef<HTMLButtonElement, SecondaryButtonProps>(
  ({ className, isLoading, icon, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      className={cn(
        "inline-flex items-center justify-center gap-2",
        "px-4 py-2.5 h-10 rounded-lg",
        "bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-gray-100 font-semibold text-sm",
        "border border-gray-300 dark:border-slate-300",
        "transition-all duration-200",
        "hover:bg-gray-200 dark:hover:bg-slate-600 hover:shadow-sm",
        "active:scale-95",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 dark:focus-visible:ring-gray-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
      {...props}
    >
      {isLoading ? (
        <>
          <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
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
SecondaryButton.displayName = "SecondaryButton"

export { SecondaryButton }
