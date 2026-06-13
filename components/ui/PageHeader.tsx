import * as React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { ChevronLeft } from 'lucide-react'

interface PageHeaderProps {
  title: string
  description?: string
  breadcrumbs?: Array<{ label: string; href?: string }>
  actions?: React.ReactNode
  backHref?: string
  backLabel?: string
  className?: string
}

const PageHeader = React.forwardRef<HTMLDivElement, PageHeaderProps>(
  ({ title, description, breadcrumbs, actions, backHref, backLabel, className }, ref) => (
    <div ref={ref} className={cn("mb-10 space-y-6 animate-fade-in-up", className)}>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-4">
          {/* Back Button & Breadcrumbs Row */}
          <div className="flex items-center gap-4">
            {backHref && (
              <Link href={backHref} className="group flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all text-xs font-bold">
                <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                {backLabel || 'Back'}
              </Link>
            )}

            {breadcrumbs && breadcrumbs.length > 0 && (
              <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                {breadcrumbs.map((crumb, index) => (
                  <React.Fragment key={index}>
                    {crumb.href ? (
                      <Link href={crumb.href} className="hover:text-primary transition-colors">
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className="text-slate-300">{crumb.label}</span>
                    )}
                    {index < breadcrumbs.length - 1 && (
                      <span className="opacity-30">/</span>
                    )}
                  </React.Fragment>
                ))}
              </nav>
            )}
          </div>

          <div className="space-y-2">
            <h1 className="text-white text-4xl md:text-5xl font-black tracking-tighter">
              {title}
            </h1>
            {description && (
              <p className="text-slate-400 text-lg font-medium max-w-2xl">
                {description}
              </p>
            )}
          </div>
        </div>
        
        {/* Actions Container */}
        {actions && (
          <div className="flex items-center gap-3 flex-wrap">
            {actions}
          </div>
        )}
      </div>

      {/* Decorative Line */}
      <div className="h-px w-full bg-gradient-to-r from-white/10 via-white/5 to-transparent" />
    </div>
  )
)
PageHeader.displayName = "PageHeader"

export { PageHeader }
