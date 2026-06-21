"use client"

import React, { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import {
  User as UserIcon,
  LogOut,
  Settings,
  Bell,
  Search,
  ChevronDown,
  Moon,
  Sun,
  Monitor,
  Command
} from 'lucide-react'

import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'

const AppHeader: React.FC = () => {
  const { data: session } = useSession()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const { data: notificationsData, mutate } = useSWR('/api/notifications?unread=1', fetcher, {
    refreshInterval: 30000 // refresh every 30 seconds
  })

  const unreadNotifications = notificationsData?.data || []
  const unreadCount = unreadNotifications.length

  // Handle mounting state to avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Handle Search ⌘K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        const searchInput = document.getElementById("global-search")
        searchInput?.focus()
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  useEffect(() => {
    const handleScroll = (e: any) => {
      const mainContent = e.target
      if (mainContent) {
        setScrolled(mainContent.scrollTop > 10)
      }
    }
    
    const mainContent = document.querySelector('main')
    if (mainContent) {
      mainContent.addEventListener('scroll', handleScroll)
    }
    return () => {
      if (mainContent) {
        mainContent.removeEventListener('scroll', handleScroll)
      }
    }
  }, [])

  return (
    <header
      className={cn(
        'fixed top-0 right-0 left-0 h-20 transition-all duration-300 z-40',
        'md:left-72',
        scrolled 
          ? 'bg-[#0B1220]/80 backdrop-blur-xl border-b border-white/5 shadow-2xl shadow-black/20 h-16' 
          : 'bg-transparent border-b border-transparent'
      )}
    >
      <div className="h-full px-6 md:px-10 flex items-center justify-between gap-8">
        {/* Search Section */}
        <div className="flex-1 max-w-xl hidden lg:flex items-center group">
          <div className={cn(
            "w-full flex items-center gap-3 px-5 py-2.5 rounded-2xl transition-all duration-300",
            "bg-white/5 border border-white/5 group-focus-within:bg-white/10 group-focus-within:border-primary/30 group-focus-within:ring-4 group-focus-within:ring-primary/10"
          )}>
            <Search size={18} className="text-slate-500 group-focus-within:text-primary transition-colors" />
            <input
              id="global-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search analytics, patients, or reports..."
              className="bg-transparent outline-none text-sm w-full placeholder-slate-500 text-white font-medium"
            />
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 border border-white/5 text-[10px] font-bold text-slate-500">
              <Command size={10} />
              <span>K</span>
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <button 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all"
          >
            {!mounted ? <div className="w-[18px] h-[18px]" /> : theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => {
                setIsNotificationsOpen(!isNotificationsOpen)
                setIsUserMenuOpen(false)
              }}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all relative group"
              aria-label="Open notifications"
            >
              <Bell size={18} className="group-hover:animate-ring" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white ring-2 ring-[#0B1220]">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {isNotificationsOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsNotificationsOpen(false)} />
                <div className="absolute right-0 mt-3 w-80 rounded-3xl border border-white/10 bg-[#111827] shadow-2xl shadow-black/40 z-50 overflow-hidden">
                  <div className="px-4 py-4 border-b border-white/5 bg-slate-950">
                    <p className="text-sm font-bold text-white">Notifikasi</p>
                    <p className="text-xs text-slate-500">{unreadCount} pesan baru</p>
                  </div>
                  <div className="space-y-1 p-3 max-h-[400px] overflow-y-auto">
                    {unreadNotifications.length > 0 ? (
                      unreadNotifications.map((notif: any) => (
                        <button
                          key={notif.id}
                          className="w-full text-left rounded-2xl px-3 py-3 hover:bg-white/5 transition-colors border border-transparent hover:border-white/5"
                          onClick={() => { 
                            setIsNotificationsOpen(false); 
                            if (notif.relatedEntityType === 'PenggunaanAntibiotik') {
                              router.push(`/ipcln/antibiotik?abId=${notif.relatedEntityId}`);
                            } else {
                              router.push('/notifications');
                            }
                          }}
                        >
                          <p className="text-sm text-white font-semibold line-clamp-1">{notif.title}</p>
                          <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{notif.message}</p>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-8 text-center">
                        <p className="text-sm text-slate-500 italic">Tidak ada notifikasi baru</p>
                      </div>
                    )}
                  </div>
                  <div className="border-t border-white/5 bg-slate-950 px-4 py-3 text-right">
                    <button
                      className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 hover:text-white"
                      onClick={() => { setIsNotificationsOpen(false); router.push('/notifications') }}
                    >
                      Lihat semua
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Vertical Divider */}
          <div className="w-px h-6 bg-white/5 mx-2" />

          {/* User Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className={cn(
                'flex items-center gap-3 p-1.5 pr-4 rounded-2xl transition-all duration-300',
                'bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 group',
                isUserMenuOpen && 'bg-white/10 border-primary/20 ring-4 ring-primary/5'
              )}
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-blue-700 flex items-center justify-center text-white shadow-lg shadow-primary/20 overflow-hidden">
                {session?.user?.name ? (
                  <span className="font-bold text-sm tracking-tighter">
                    {session.user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </span>
                ) : (
                  <UserIcon size={18} />
                )}
              </div>
              <div className="hidden sm:flex flex-col items-start text-left">
                <span className="text-sm font-bold text-white leading-none mb-1">
                  {session?.user?.name || 'User'}
                </span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">
                  Online
                </span>
              </div>
              <ChevronDown size={14} className={cn("text-slate-500 transition-transform duration-300", isUserMenuOpen && "rotate-180")} />
            </button>

            {/* Dropdown Menu */}
            {isUserMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsUserMenuOpen(false)} />
                <div className={cn(
                  'absolute right-0 mt-3 w-64 bg-[#111827] border border-white/5 rounded-3xl p-2 z-50 shadow-2xl animate-fade-in-up'
                )}>
                  <div className="px-4 py-4 border-b border-white/5">
                    <p className="text-sm font-bold text-white truncate">
                      {session?.user?.name}
                    </p>
                    <p className="text-xs font-medium text-slate-500 truncate mt-0.5">
                      {session?.user?.email}
                    </p>
                  </div>
                  <div className="p-2 space-y-1">
                    <Link
                      href="/profile"
                      className="flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-400 hover:text-white hover:bg-white/5 text-sm font-medium transition-all group"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <UserIcon size={16} className="group-hover:scale-110 transition-transform" />
                      Account Settings
                    </Link>
                    <Link
                      href="/settings"
                      className="flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-400 hover:text-white hover:bg-white/5 text-sm font-medium transition-all group"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <Settings size={16} className="group-hover:scale-110 transition-transform" />
                      Preferences
                    </Link>
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false)
                        signOut({ callbackUrl: '/auth/login' })
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-red-400 hover:text-red-300 hover:bg-red-500/10 text-sm font-bold transition-all group"
                    >
                      <LogOut size={16} className="group-hover:translate-x-1 transition-transform" />
                      Sign Out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export { AppHeader }
