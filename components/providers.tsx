"use client"

import { SessionProvider, useSession } from "next-auth/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { ToastProvider } from "@/components/ui/Toast"

function SessionLoadingWrapper({ children }: { children: React.ReactNode }) {
  const { status } = useSession()

  if (status === "loading") {
    return (
      <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex items-center justify-center">
        {/* Background Effects */}
        <div className="pointer-events-none fixed inset-0">
          <div className="absolute -top-[20%] -left-[10%] h-[600px] w-[600px] rounded-full bg-blue-600/20 blur-[120px]" />
          <div className="absolute -bottom-[20%] -right-[10%] h-[600px] w-[600px] rounded-full bg-indigo-600/20 blur-[120px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[800px] w-[800px] rounded-full bg-slate-800/30 blur-[150px]" />
        </div>

        <div className="relative z-10 flex flex-col items-center gap-6">
          {/* Logo with Pulse Animation */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-24 w-24 rounded-full bg-blue-500/30 animate-ping" />
            </div>
            <div className="relative flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-full bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl shadow-blue-900/30">
              <img src="/logo.png" alt="Logo RS Budi Rahayu" className="h-14 w-14 sm:h-16 sm:w-16 object-contain" />
            </div>
          </div>

          {/* Spinner */}
          <div className="flex flex-col items-center gap-4">
            <div className="flex gap-2">
              <div className="h-3 w-3 rounded-full bg-blue-400 animate-bounce [animation-delay:-0.3s]" />
              <div className="h-3 w-3 rounded-full bg-blue-400 animate-bounce [animation-delay:-0.15s]" />
              <div className="h-3 w-3 rounded-full bg-blue-400 animate-bounce" />
            </div>
            <p className="text-sm sm:text-base text-white/80 font-medium">
              Memuat sistem...
            </p>
          </div>
        </div>
      </main>
    )
  }

  return <>{children}</>
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 10, // 10 minutes
      },
    },
  }))

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <ToastProvider>
            <SessionLoadingWrapper>
              {children}
            </SessionLoadingWrapper>
          </ToastProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </SessionProvider>
  )
}
