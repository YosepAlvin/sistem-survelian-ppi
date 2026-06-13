import * as React from "react"
import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown, ArrowUpRight } from 'lucide-react'

interface StatCardProps {
  title: string
  value: number | string
  description?: string
  icon?: React.ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  color?: 'blue' | 'green' | 'purple' | 'red' | 'amber'
  className?: string
  onClick?: () => void
}

const colorThemes = {
  blue: {
    gradient: 'from-blue-600/20 to-blue-600/5',
    border: 'border-blue-500/20 hover:border-blue-500/40',
    icon: 'text-blue-400 bg-blue-500/10',
    trend: 'text-blue-400 bg-blue-500/10',
    glow: 'group-hover:shadow-blue-500/10'
  },
  green: {
    gradient: 'from-emerald-600/20 to-emerald-600/5',
    border: 'border-emerald-500/20 hover:border-emerald-500/40',
    icon: 'text-emerald-400 bg-emerald-500/10',
    trend: 'text-emerald-400 bg-emerald-500/10',
    glow: 'group-hover:shadow-emerald-500/10'
  },
  purple: {
    gradient: 'from-purple-600/20 to-purple-600/5',
    border: 'border-purple-500/20 hover:border-purple-500/40',
    icon: 'text-purple-400 bg-purple-500/10',
    trend: 'text-purple-400 bg-purple-500/10',
    glow: 'group-hover:shadow-purple-500/10'
  },
  red: {
    gradient: 'from-red-600/20 to-red-600/5',
    border: 'border-red-500/20 hover:border-red-500/40',
    icon: 'text-red-400 bg-red-500/10',
    trend: 'text-red-400 bg-red-500/10',
    glow: 'group-hover:shadow-red-500/10'
  },
  amber: {
    gradient: 'from-amber-600/20 to-amber-600/5',
    border: 'border-amber-500/20 hover:border-amber-500/40',
    icon: 'text-amber-400 bg-amber-500/10',
    trend: 'text-amber-400 bg-amber-500/10',
    glow: 'group-hover:shadow-amber-500/10'
  }
}

const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  ({
    title,
    value,
    description,
    icon,
    trend,
    color = 'blue',
    className,
    onClick
  }, ref) => {
    const theme = colorThemes[color]

    return (
      <div
        ref={ref}
        onClick={onClick}
        className={cn(
          'relative overflow-hidden group p-6 rounded-[2rem] border transition-all duration-500',
          'bg-[#172033]/50 backdrop-blur-xl',
          theme.border,
          theme.glow,
          onClick && 'cursor-pointer hover:translate-y-[-8px]',
          className
        )}
      >
        {/* Decorative Background Gradient */}
        <div className={cn(
          'absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-700',
          theme.gradient
        )} />

        <div className="relative z-10">
          <div className="flex items-start justify-between mb-6">
            {icon && (
              <div className={cn('p-3 rounded-2xl transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3', theme.icon)}>
                {React.cloneElement(icon as React.ReactElement, { size: 24 })}
              </div>
            )}
            
            {onClick && (
              <div className="p-2 rounded-full bg-white/5 opacity-0 group-hover:opacity-100 transition-all duration-300">
                <ArrowUpRight size={16} className="text-slate-400" />
              </div>
            )}
          </div>

          <div className="space-y-1">
            <h3 className="text-slate-400 text-sm font-bold tracking-tight uppercase group-hover:text-slate-200 transition-colors">
              {title}
            </h3>
            
            <div className="flex items-end justify-between gap-2">
              <p className="text-white text-4xl font-black tracking-tighter">
                {typeof value === 'number' ? value.toLocaleString('id-ID') : value}
              </p>
              
              {trend && (
                <div className={cn(
                  'flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-black transition-all duration-500 group-hover:scale-105',
                  trend.isPositive ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'
                )}>
                  {trend.isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {Math.abs(trend.value)}%
                </div>
              )}
            </div>
          </div>

          {description && (
            <p className="text-slate-500 text-xs font-medium mt-4 group-hover:text-slate-400 transition-colors">
              {description}
            </p>
          )}
        </div>

        {/* Shine effect */}
        <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-[-20deg]" />
      </div>
    )
  }
)
StatCard.displayName = "StatCard"

export { StatCard }
