"use client"

import React, { useState } from 'react'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  BarChart3,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Home,
  Activity,
  Bell,
  Search,
  User as UserIcon,
  ShieldCheck,
  AlertCircle
} from 'lucide-react'

interface MenuItemProps {
  label: string
  href?: string
  icon: React.ReactNode
  onClick?: () => void
  isActive?: boolean
  isCollapsed?: boolean
  children?: MenuItemProps[]
}

interface MenuItemWithRoleProps extends MenuItemProps {
  roleColor?: string
  onItemClick?: () => void
}

const MenuItem: React.FC<MenuItemWithRoleProps> = ({
  label,
  href,
  icon,
  onClick,
  isActive,
  isCollapsed,
  children,
  roleColor = 'blue',
  onItemClick
}) => {
  const [isExpanded, setIsExpanded] = useState(false)

  const getActiveStyles = (color: string) => {
    const styles: { [key: string]: string } = {
      'blue': 'bg-blue-500/10 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.1)]',
      'green': 'bg-emerald-500/10 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.1)]',
      'purple': 'bg-purple-500/10 text-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.1)]',
    }
    return styles[color] || styles['blue']
  }

  const baseClasses = cn(
    'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative',
    'text-slate-400 hover:text-white hover:bg-white/5'
  )

  if (children && children.length > 0) {
    return (
      <div className="space-y-1">
        <button
          onClick={() => {
            setIsExpanded(!isExpanded)
            onItemClick?.()
          }}
          className={cn(baseClasses, isActive && getActiveStyles(roleColor))}
        >
          <span className={cn("transition-transform duration-300", isActive ? "scale-110" : "group-hover:scale-110")}>
            {icon}
          </span>
          {!isCollapsed && (
            <>
              <span className="flex-1 text-left font-medium text-sm">{label}</span>
              <ChevronDown
                size={14}
                className={cn(
                  'transition-transform duration-300 opacity-50',
                  isExpanded && 'rotate-180'
                )}
              />
            </>
          )}
          {isActive && <div className={cn("absolute left-0 w-1 h-6 rounded-r-full", 
            roleColor === 'blue' ? 'bg-blue-500' : roleColor === 'green' ? 'bg-emerald-500' : 'bg-purple-500'
          )} />}
        </button>
        {isExpanded && !isCollapsed && (
          <div className="pl-4 mt-1 space-y-1 animate-fade-in-up">
            <div className="absolute left-6 top-0 bottom-0 w-px bg-white/5" />
            {children.map((child, idx) => (
              <MenuItem
                key={idx}
                {...child}
                isCollapsed={isCollapsed}
                roleColor={roleColor}
                onItemClick={onItemClick}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  const content = (
    <>
      <span className={cn("transition-transform duration-300", isActive ? "scale-110" : "group-hover:scale-110")}>
        {icon}
      </span>
      {!isCollapsed && <span className="font-medium text-sm">{label}</span>}
      {isActive && <div className={cn("absolute left-0 w-1 h-6 rounded-r-full", 
        roleColor === 'blue' ? 'bg-blue-500' : roleColor === 'green' ? 'bg-emerald-500' : 'bg-purple-500'
      )} />}
    </>
  )

  if (onClick) {
    return (
      <button
        onClick={() => {
          onClick()
          onItemClick?.()
        }}
        className={cn(baseClasses, 'hover:bg-red-500/10 hover:text-red-400')}
      >
        {content}
      </button>
    )
  }

  return (
    <Link href={href || '#'} onClick={onItemClick}>
      <span className={cn(baseClasses, isActive && getActiveStyles(roleColor))}>
        {content}
      </span>
    </Link>
  )
}

interface AppSidebarProps {
  isMobileOpen: boolean
  setIsMobileOpen: (open: boolean) => void
}

const AppSidebar: React.FC<AppSidebarProps> = ({ isMobileOpen, setIsMobileOpen }) => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const pathname = usePathname()
  const { data: session } = useSession()

  const userRole = (session?.user as any)?.role?.toUpperCase()

  const getRoleTheme = (role: string) => {
    const themes: { [key: string]: { color: string; label: string } } = {
      'ADMIN': { color: 'blue', label: 'Administrator' },
      'IPCN': { color: 'green', label: 'IPCN Specialist' },
      'IPCLN': { color: 'purple', label: 'IPCLN Officer' },
    }
    return themes[role] || themes['ADMIN']
  }

  const theme = getRoleTheme(userRole)

  const isActive = (path: string) => {
    return pathname?.startsWith(path)
  }

  const getMenuItems = (): MenuItemProps[] => {
    const baseItems: MenuItemProps[] = [
      {
        label: 'Dashboard Overview',
        href: '/',
        icon: <LayoutDashboard size={20} />,
        isActive: pathname === '/' || pathname?.includes('/dashboard')
      }
    ]

    if (userRole === 'ADMIN') {
      return [
        ...baseItems,
        {
          label: 'IPCN Modules',
          icon: <Activity size={20} />,
          children: [
            { label: 'Dashboard IPCN', href: '/ipcn/dashboard', icon: <LayoutDashboard size={18} />, isActive: isActive('/ipcn/dashboard') },
            { 
              label: 'Verifikasi', 
              icon: <ShieldCheck size={18} />,
              isActive: isActive('/ipcn/verifikasi') || isActive('/ipcn/verifikasi-pulang') || isActive('/ipcn/verifikasi-transfer'),
              children: [
                { label: 'Verifikasi Laporan', href: '/ipcn/verifikasi', icon: <ShieldCheck size={16} />, isActive: isActive('/ipcn/verifikasi') },
                { label: 'Verifikasi Pulang', href: '/ipcn/verifikasi-pulang', icon: <ShieldCheck size={16} />, isActive: isActive('/ipcn/verifikasi-pulang') },
                { label: 'Verifikasi Transfer', href: '/ipcn/verifikasi-transfer', icon: <ShieldCheck size={16} />, isActive: isActive('/ipcn/verifikasi-transfer') },
              ]
            },
            { label: 'Saran Alat Kesehatan', href: '/ipcn/saran-alat', icon: <Activity size={18} />, isActive: isActive('/ipcn/saran-alat') },
            { label: 'Monitoring Pasien', href: '/ipcn/monitoring/pasien-aktif', icon: <Users size={18} />, isActive: isActive('/ipcn/monitoring/pasien-aktif') },
            { label: 'Audit Device Days', href: '/ipcn/monitoring/device-day', icon: <Activity size={18} />, isActive: isActive('/ipcn/monitoring/device-day') },
            { label: 'Laporan Bulanan', href: '/ipcn/laporan/bulanan', icon: <BarChart3 size={18} />, isActive: isActive('/ipcn/laporan/bulanan') },
            { label: 'Surveilans IDO', href: '/ipcn/laporan/ido', icon: <Activity size={18} />, isActive: isActive('/ipcn/laporan/ido') },
            { label: 'Grafik Tren PPI', href: '/ipcn/grafik/bulanan', icon: <BarChart3 size={18} />, isActive: isActive('/ipcn/grafik') },
          ]
        },
        {
          label: 'IPCLN Modules',
          icon: <Activity size={20} />,
          children: [
            { label: 'Dashboard IPCLN', href: '/ipcln/dashboard', icon: <LayoutDashboard size={18} />, isActive: isActive('/ipcln/dashboard') },
            { label: 'Registrasi Pasien', href: '/ipcln/pasien', icon: <Users size={18} />, isActive: isActive('/ipcln/pasien') },
            { label: 'Input Harian', href: '/ipcln/surveilans-harian', icon: <Activity size={18} />, isActive: isActive('/ipcln/surveilans-harian') },
            { label: 'Lapor Infeksi', href: '/ipcln/infeksi', icon: <Bell size={18} />, isActive: isActive('/ipcln/infeksi') },
            { label: 'Tindakan Operasi', href: '/ipcln/operasi', icon: <Activity size={18} />, isActive: isActive('/ipcln/operasi') },
            { label: 'Penggunaan Antibiotik', href: '/ipcln/antibiotik', icon: <FileText size={18} />, isActive: isActive('/ipcln/antibiotik') },
            { label: 'Saran Alat dari IPCN', href: '/ipcln/saran-alat', icon: <Activity size={18} />, isActive: isActive('/ipcln/saran-alat') },
            { label: 'Rekap Laporan', href: '/ipcln/surveilans-bulanan', icon: <BarChart3 size={18} />, isActive: isActive('/ipcln/surveilans-bulanan') },
          ]
        },
        {
          label: 'Data Master',
          icon: <Settings size={20} />,
          children: [
            { label: 'User Management', href: '/admin/users', icon: <Users size={18} />, isActive: isActive('/admin/users') },
            { label: 'Master Pasien', href: '/admin/pasien', icon: <Users size={18} />, isActive: isActive('/admin/pasien') },
            { label: 'Ruangan Unit', href: '/admin/ruangan', icon: <Home size={18} />, isActive: isActive('/admin/ruangan') },
            { label: 'Dokter Spesialis', href: '/admin/dokter', icon: <UserIcon size={18} />, isActive: isActive('/admin/dokter') },
            { label: 'Master Diagnosa', href: '/admin/diagnosa', icon: <FileText size={18} />, isActive: isActive('/admin/diagnosa') },
            { label: 'Master Antibiotik', href: '/admin/antibiotik', icon: <FileText size={18} />, isActive: isActive('/admin/antibiotik') }
          ]
        },
        { label: 'System Settings', href: '/admin/settings', icon: <Settings size={20} />, isActive: isActive('/admin/settings') },
        { label: 'Sign Out', icon: <LogOut size={20} />, onClick: () => signOut({ callbackUrl: '/auth/login' }) }
      ]
    } else if (userRole === 'IPCN') {
      return [
        ...baseItems,
        { 
          label: 'Verifikasi', 
          icon: <ShieldCheck size={20} />,
          isActive: isActive('/ipcn/verifikasi') || isActive('/ipcn/verifikasi-pulang') || isActive('/ipcn/verifikasi-transfer'),
          children: [
            { label: 'Verifikasi Laporan', href: '/ipcn/verifikasi', icon: <ShieldCheck size={18} />, isActive: isActive('/ipcn/verifikasi') },
            { label: 'Verifikasi Pulang', href: '/ipcn/verifikasi-pulang', icon: <ShieldCheck size={18} />, isActive: isActive('/ipcn/verifikasi-pulang') },
            { label: 'Verifikasi Transfer', href: '/ipcn/verifikasi-transfer', icon: <ShieldCheck size={18} />, isActive: isActive('/ipcn/verifikasi-transfer') },
          ]
        },
        { label: 'Saran Alat Kesehatan', href: '/ipcn/saran-alat', icon: <Activity size={20} />, isActive: isActive('/ipcn/saran-alat') },
        { 
          label: 'Monitoring Kasus', 
          icon: <Activity size={20} />,
          children: [
            { label: 'Kasus Aktif', href: '/ipcn/kasus-aktif', icon: <AlertCircle size={18} />, isActive: isActive('/ipcn/kasus-aktif') },
            { label: 'Pending Closure', href: '/ipcn/pending-closure', icon: <ShieldCheck size={18} />, isActive: isActive('/ipcn/pending-closure') },
            { label: 'Kasus Ditutup', href: '/ipcn/kasus-ditutup', icon: <ShieldCheck size={18} />, isActive: isActive('/ipcn/kasus-ditutup') },
            { label: 'Device Alerts', href: '/ipcn/device-alert', icon: <BarChart3 size={18} />, isActive: isActive('/ipcn/device-alert') },
          ]
        },
        { 
          label: 'Monitoring Antibiotik', 
          href: '/ipcln/antibiotik', 
          icon: <FileText size={20} />, isActive: isActive('/ipcln/antibiotik') 
        },
        { label: 'Monitoring Pasien', href: '/ipcn/monitoring/pasien-aktif', icon: <Users size={20} />, isActive: isActive('/ipcn/monitoring/pasien-aktif') },
        { label: 'Pasien Pulang', href: '/ipcn/pasien-pulang', icon: <Users size={20} />, isActive: isActive('/ipcn/pasien-pulang') },
        { label: 'Audit Device Days', href: '/ipcn/monitoring/device-day', icon: <Activity size={20} />, isActive: isActive('/ipcn/monitoring/device-day') },
        {
          label: 'Laporan Analitik',
          icon: <FileText size={20} />,
          children: [
            { label: 'Laporan Bulanan', href: '/ipcn/laporan/bulanan', icon: <BarChart3 size={18} />, isActive: isActive('/ipcn/laporan/bulanan') },
            { label: 'Surveilans IDO', href: '/ipcn/laporan/ido', icon: <Activity size={18} />, isActive: isActive('/ipcn/laporan/ido') }
          ]
        },
        { label: 'Grafik Tren PPI', href: '/ipcn/grafik/bulanan', icon: <BarChart3 size={20} />, isActive: isActive('/ipcn/grafik') },
        { label: 'Sign Out', icon: <LogOut size={20} />, onClick: () => signOut({ callbackUrl: '/auth/login' }) }
      ]
    } else if (userRole === 'IPCLN') {
      return [
        ...baseItems,
        { label: 'Registrasi Pasien', href: '/ipcln/pasien', icon: <Users size={20} />, isActive: isActive('/ipcln/pasien') },
        { label: 'Input Harian', href: '/ipcln/surveilans-harian', icon: <Activity size={20} />, isActive: isActive('/ipcln/surveilans-harian') },
        { label: 'Lapor Infeksi', href: '/ipcln/infeksi', icon: <Bell size={20} />, isActive: isActive('/ipcln/infeksi') },
        { label: 'Tindakan Operasi', href: '/ipcln/operasi', icon: <Activity size={20} />, isActive: isActive('/ipcln/operasi') },
        { label: 'Penggunaan Antibiotik', href: '/ipcln/antibiotik', icon: <FileText size={20} />, isActive: isActive('/ipcln/antibiotik') },
        { label: 'Saran Alat dari IPCN', href: '/ipcln/saran-alat', icon: <Activity size={20} />, isActive: isActive('/ipcln/saran-alat') },
        { label: 'Rekap Laporan', href: '/ipcln/surveilans-bulanan', icon: <BarChart3 size={20} />, isActive: isActive('/ipcln/surveilans-bulanan') },
        { label: 'Sign Out', icon: <LogOut size={20} />, onClick: () => signOut({ callbackUrl: '/auth/login' }) }
      ]
    }
    return baseItems
  }

  const handleMenuItemClick = () => {
    setIsMobileOpen(false)
  }

  return (
    <>
      {isMobileOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-30 md:hidden" onClick={() => setIsMobileOpen(false)} />
      )}

      <aside className={cn(
        'fixed left-0 top-0 h-full bg-[#0B1220] border-r border-white/5 transition-all duration-500 z-50 flex flex-col',
        isCollapsed ? 'w-20' : 'w-72',
        isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      )}>
        <div className="h-20 flex items-center justify-between px-6 border-b border-white/5">
          {!isCollapsed && (
            <div className="flex items-center gap-3">
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", 
                theme.color === 'blue' ? 'bg-blue-600' : theme.color === 'green' ? 'bg-emerald-600' : 'bg-purple-600'
              )}>
                <Activity size={18} className="text-white" />
              </div>
              <span className="font-black text-xl tracking-tighter text-white">BUDI RAHAYU</span>
            </div>
          )}
          <button onClick={() => setIsCollapsed(!isCollapsed)} className="p-2 hover:bg-white/5 rounded-xl transition-colors text-slate-400">
            {isCollapsed ? <Menu size={20} /> : <X size={20} />}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-8 scrollbar-hide">
          <div className="space-y-1">
            {!isCollapsed && <p className="px-4 text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Main Navigation</p>}
            {getMenuItems().map((item, idx) => (
              <MenuItem key={idx} {...item} isCollapsed={isCollapsed} roleColor={theme.color} onItemClick={handleMenuItemClick} />
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-white/5">
          {!isCollapsed && (
            <div className="bg-white/5 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center border border-white/10">
                <UserIcon size={20} className="text-slate-300" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">{session?.user?.name || 'User'}</p>
                <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">{theme.label}</p>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}

export { AppSidebar }
