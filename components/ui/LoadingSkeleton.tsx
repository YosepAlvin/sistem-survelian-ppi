import * as React from "react"
import { cn } from "@/lib/utils"

interface LoadingSkeletonProps {
  count?: number
  rows?: number
  className?: string
}

const LoadingSkeleton = React.forwardRef<HTMLDivElement, LoadingSkeletonProps>(
  ({ count = 1, rows = 3, className }, ref) => (
    <div ref={ref} className={cn("space-y-4", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-3">
          {Array.from({ length: rows }).map((_, j) => (
            <div
              key={j}
              className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-md animate-pulse"
              style={{
                width: j === rows - 1 ? '80%' : '100%',
                animation: `shimmer 2s infinite`,
                animationDelay: `${j * 0.1}s`
              }}
            />
          ))}
        </div>
      ))}
      <style>{`
        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }
      `}</style>
    </div>
  )
)
LoadingSkeleton.displayName = "LoadingSkeleton"

export { LoadingSkeleton }
