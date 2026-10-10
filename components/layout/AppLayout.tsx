"use client"

import React, { useState } from 'react'
import { cn } from '@/lib/utils'
import { AppSidebar } from './AppSidebar'
import { AppHeader } from './AppHeader'

interface AppLayoutProps {
  children: React.ReactNode
  className?: string
}

const AppLayout: React.FC<AppLayoutProps> = ({ children, className }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  
  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-primary/30 selection:text-slate-900 flex">
      <AppSidebar isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />
      
      <div className="flex-1 flex flex-col min-h-screen">
        <AppHeader isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />

        {/* Main Content Area */}
        <main className={cn(
          'flex-1 pt-20 transition-all duration-500 ease-in-out',
          'md:pl-72'
        )}>
          <div className={cn(
            'p-4 sm:p-6 md:p-10 max-w-[1600px] mx-auto animate-fade-in-up'
          )}>
            {children}
          </div>
        </main>
      </div>

      {/* Decorative Background Elements */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -z-10 pointer-events-none" />
      <div className="fixed bottom-0 left-72 w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[100px] -z-10 pointer-events-none" />
    </div>
  )
}

export { AppLayout }
