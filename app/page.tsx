"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { fetcher } from "@/lib/fetcher"
import { SystemStats } from "@/lib/stats"
import { 
  ShieldCheck, 
  Activity, 
  Pill, 
  Monitor, 
  FileText, 
  Bell, 
  ArrowRight, 
  Clock, 
  CheckCircle2, 
  Server, 
  Database, 
  RefreshCw, 
  HardDrive, 
  Calendar, 
  Menu, 
  X 
} from "lucide-react"
import { format } from "date-fns"
import { id } from "date-fns/locale"

interface MainFeature {
  name: string
  description: string
  link: string
  icon: React.ElementType
}

const mainFeatures: MainFeature[] = [
  {
    name: "Surveilans Infeksi",
    description: "Catat dan monitor semua kejadian infeksi secara real-time",
    link: "/ipcln/infeksi",
    icon: ShieldCheck,
  },
  {
    name: "Monitoring Antibiotik",
    description: "Pantau penggunaan antibiotik dan evaluasi kepatuhan",
    link: "/ipcln/antibiotik",
    icon: Pill,
  },
  {
    name: "Device Day Monitoring",
    description: "Hitung dan laporkan device day untuk monitoring risiko",
    link: "/ipcn/monitoring/device-day",
    icon: Monitor,
  },
  {
    name: "Audit dan Evaluasi",
    description: "Audit kepatuhan dan evaluasi program PPI",
    link: "/notifications",
    icon: Activity,
  },
  {
    name: "Pelaporan Bulanan",
    description: "Penyusunan laporan PPI secara otomatis",
    link: "/ipcn/laporan/bulanan",
    icon: FileText,
  },
  {
    name: "Notifikasi & Tindak Lanjut",
    description: "Notifikasi real-time untuk hasil surveilans dan tindak lanjut",
    link: "/notifications",
    icon: Bell,
  },
]

interface AuditTrailItem {
  id: number
  action: string
  entityType: string
  entityId: number
  timestamp: string
  details?: string | null
  user?: {
    name?: string | null
  } | null
}

const systemStatusItems = [
  { name: "Database", status: "Online" },
  { name: "Sinkronisasi Data", status: "Aktif" },
  { name: "Modul Surveilans", status: "Normal" },
  { name: "Modul Antibiotik", status: "Normal" },
  { name: "Modul Device Day", status: "Normal" },
  { name: "Backup Terakhir", status: "15/06/2026 02:00" },
  { name: "Server", status: "Optimal" },
]

const StatCard = ({
  label,
  value,
  isLoading,
  icon: Icon,
  trend,
}: {
  label: string
  value: number | null
  isLoading: boolean
  icon?: React.ElementType
  trend?: { value: number; label: string }
}) => (
  <div className="relative overflow-hidden rounded-xl sm:rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-white/0 backdrop-blur-xl p-4 sm:p-6 transition-all duration-300 hover:border-white/20 hover:shadow-2xl hover:shadow-blue-900/20 hover:-translate-y-1">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-1 sm:mb-2">
          {label}
        </p>
        <p className="text-2xl sm:text-4xl font-black text-white">
          {isLoading ? "-" : value?.toLocaleString("id-ID") ?? 0}
        </p>
        {trend && (
          <div className="flex items-center gap-1 mt-1 sm:mt-2">
            <span className={`text-[11px] sm:text-xs font-semibold ${trend.value > 0 ? "text-emerald-400" : trend.value < 0 ? "text-red-400" : "text-slate-400"}`}>
              {trend.value > 0 ? `+${trend.value}%` : trend.value < 0 ? `${trend.value}%` : "Stabil"}
            </span>
            <span className="text-[11px] sm:text-xs text-slate-500">{trend.label}</span>
          </div>
        )}
      </div>
      {Icon && (
        <div className="flex h-10 w-10 sm:h-14 sm:w-14 items-center justify-center rounded-lg sm:rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/10">
          <Icon className="h-5 w-5 sm:h-7 sm:w-7 text-blue-400" />
        </div>
      )}
    </div>
    <div className="absolute -bottom-3 -right-3 h-12 w-12 sm:h-24 sm:w-24 rounded-full bg-gradient-to-br from-blue-500/10 to-transparent blur-xl sm:blur-3xl" />
  </div>
)

const ActivityItem = ({ item }: { item: AuditTrailItem }) => {
  const getActivityIcon = (action: string) => {
    if (action.toLowerCase().includes("review")) return <CheckCircle2 className="h-5 w-5 sm:h-5 sm:w-5 text-emerald-400" />
    if (action.toLowerCase().includes("verifikasi")) return <ShieldCheck className="h-5 w-5 sm:h-5 sm:w-5 text-purple-400" />
    if (action.toLowerCase().includes("perbarui") || action.toLowerCase().includes("update")) return <RefreshCw className="h-5 w-5 sm:h-5 sm:w-5 text-amber-400" />
    if (action.toLowerCase().includes("tambah") || action.toLowerCase().includes("create")) return <Activity className="h-5 w-5 sm:h-5 sm:w-5 text-blue-400" />
    return <Activity className="h-5 w-5 sm:h-5 sm:w-5 text-slate-400" />
  }

  return (
    <div className="flex items-start gap-3 p-4 sm:p-4 rounded-xl sm:rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 transition-colors">
      <div className="flex h-10 w-10 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-white/10">
        {getActivityIcon(item.action)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm sm:text-sm font-semibold text-white truncate">
          {item.action}
        </p>
        <p className="text-[11px] sm:text-xs text-slate-400">
          {item.user?.name || "Sistem"} • {format(new Date(item.timestamp), "d MMM yyyy, HH:mm", { locale: id })}
        </p>
      </div>
    </div>
  )
}

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const { data: statsData, error: statsError } = useSWR<{
    success: boolean
    data: SystemStats
  }>("/api/stats", fetcher, {
    refreshInterval: 10000,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  })

  const { data: auditTrailData } = useSWR<{ data: AuditTrailItem[] }>("/api/audit-trail?limit=5", fetcher)

  const { data: healthData } = useSWR<{ database: string }>("/api/health", fetcher, {
    refreshInterval: 30000,
  })

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (session?.user) {
      const userRole = (session.user as any)?.role?.toUpperCase()
      switch (userRole) {
        case "ADMIN":
          router.push("/admin/dashboard")
          break
        case "IPCN":
          router.push("/ipcn/dashboard")
          break
        case "IPCLN":
          router.push("/ipcln/dashboard")
          break
        default:
          break
      }
    }
  }, [session, router])

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
              Memuat Sistem...
            </p>
          </div>
        </div>
      </main>
    )
  }

  const stats = statsData?.success ? statsData.data : null
  const isStatsLoading = !statsData && !statsError

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950">
      {/* Background Effects */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-[20%] -left-[10%] h-[600px] w-[600px] rounded-full bg-blue-600/20 blur-[120px]" />
        <div className="absolute -bottom-[20%] -right-[10%] h-[600px] w-[600px] rounded-full bg-indigo-600/20 blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[800px] w-[800px] rounded-full bg-slate-800/30 blur-[150px]" />
      </div>

      {/* Top Navigation */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-white/5 backdrop-blur-2xl">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-16 w-16 sm:h-24 sm:w-24 items-center justify-center rounded-2xl">
                <img src="/logo.png" alt="Logo RS Budi Rahayu" className="h-full w-full object-contain" />
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-bold text-white">Sistem Surveilans PPI</p>
                <p className="text-xs text-slate-400">Rumah Sakit Budi Rahayu</p>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-medium text-emerald-300">Sistem Operasional Normal</span>
              </div>
              <div className="h-6 w-px bg-white/10" />
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <Calendar className="h-4 w-4" />
                <span>{format(currentTime, "d MMMM yyyy", { locale: id })}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <Clock className="h-4 w-4" />
                <span>{format(currentTime, "HH:mm:ss", { locale: id })} WIB</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link href="/auth/login">
                <Button className="hidden sm:flex bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-6 py-5 rounded-xl shadow-lg shadow-blue-900/20 transition-all hover:scale-[1.02]">
                  Masuk ke Sistem
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/auth/login" className="sm:hidden">
                <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-4 py-2 rounded-xl shadow-lg shadow-blue-900/20 transition-all hover:scale-[1.02] text-xs">
                  Masuk
                </Button>
              </Link>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="sm:hidden p-2 text-white"
              >
                {mobileMenuOpen ? <X /> : <Menu />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="mt-4 border-t border-white/10 pt-4 md:hidden">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-emerald-300">Sistem Operasional Normal</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <Calendar className="h-4 w-4" />
                  <span>{format(currentTime, "d MMMM yyyy HH:mm:ss", { locale: id })} WIB</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="container mx-auto px-4 pt-10 pb-12 lg:pt-24 lg:pb-32">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div className="space-y-5">
              <div className="space-y-3">
                <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.3em] text-blue-300/80">
                  Rumah Sakit Budi Rahayu
                </p>
                <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight">
                  SISTEM SURVEILANS <span className="text-blue-400">PPI</span>
                </h1>
                <p className="text-base sm:text-xl md:text-2xl text-slate-300 font-medium">
                  Pencegahan dan Pengendalian Infeksi
                </p>
                <p className="text-sm sm:text-lg text-slate-400 max-w-xl">
                  Sistem terintegrasi untuk monitoring surveilans infeksi, penggunaan antibiotik, device day, audit kepatuhan, dan pelaporan PPI secara terpusat dan real-time.
                </p>
              </div>
              <div className="flex flex-wrap gap-4">
                <Link href="/auth/login" className="w-full sm:w-auto">
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-6 py-4 sm:px-8 sm:py-6 rounded-xl shadow-lg shadow-blue-900/30 transition-all hover:scale-[1.03] text-sm sm:text-lg">
                    Masuk ke Sistem
                    <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative hidden lg:block">
              <div className="relative">
                <img 
                  src="/rs-budi-rahayu.jpg.png" 
                  alt="Rumah Sakit Budi Rahayu"
                  className="w-full h-[500px] object-cover rounded-3xl shadow-2xl shadow-slate-950/50"
                />
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                <div className="absolute bottom-8 left-8 right-8">
                  <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
                    <p className="text-white font-bold text-2xl">RS BUDI RAHAYU</p>
                    <p className="text-slate-300 text-sm mt-1">Pelayanan Kesehatan Terpadu</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Live Statistics Section */}
        <section className="container mx-auto px-4 pb-12">
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-2 sm:gap-4">
            <StatCard
              label="Total Pasien Dipantau"
              value={stats?.totalPasien ?? null}
              isLoading={isStatsLoading}
              icon={Activity}
              trend={{ value: 12, label: "dari kemarin" }}
            />
            <StatCard
              label="Total Surveilans Aktif"
              value={stats?.totalSurveilansAktif ?? null}
              isLoading={isStatsLoading}
              icon={ShieldCheck}
              trend={{ value: 0, label: "stabil" }}
            />
            <StatCard
              label="Kasus Infeksi Terverifikasi"
              value={stats?.totalKasusInfeksiTerverifikasi ?? null}
              isLoading={isStatsLoading}
              icon={CheckCircle2}
              trend={{ value: -5, label: "dari kemarin" }}
            />
            <StatCard
              label="Antibiotik Aktif"
              value={stats?.totalAntibiotikAktif ?? null}
              isLoading={isStatsLoading}
              icon={Pill}
              trend={{ value: 3, label: "perlu review" }}
            />
            <StatCard
              label="Device Day Bulan Ini"
              value={stats?.totalDeviceDayBulanIni ?? null}
              isLoading={isStatsLoading}
              icon={Monitor}
              trend={{ value: 8, label: "dari bulan lalu" }}
            />
            <StatCard
              label="Notifikasi Aktif"
              value={stats?.totalNotifikasiAktif ?? null}
              isLoading={isStatsLoading}
              icon={Bell}
              trend={{ value: 0, label: "perlu tindak lanjut" }}
            />
            <StatCard
              label="Laporan Bulanan"
              value={stats?.totalLaporanBulanan ?? null}
              isLoading={isStatsLoading}
              icon={FileText}
              trend={{ value: 0, label: "Mei 2026" }}
            />
          </div>
        </section>

        {/* Recent Activities & System Modules */}
        <section className="container mx-auto px-4 pb-12">
          <div className="grid gap-4 lg:gap-6 lg:grid-cols-3">
            {/* Recent Activities */}
            <div className="lg:col-span-1">
              <div className="rounded-2xl sm:rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <h3 className="text-base sm:text-lg font-bold text-white">Aktivitas Terbaru</h3>
                  <span className="text-[10px] sm:text-xs text-slate-400">Lihat semua</span>
                </div>
                <div className="space-y-2 sm:space-y-3">
                  {auditTrailData?.data?.slice(0, 5).map((item, i) => (
                    <ActivityItem key={item.id} item={item} />
                  ))}
                  {!auditTrailData?.data?.length && (
                    <div className="text-center py-6 sm:py-8 text-slate-500 text-xs sm:text-sm">
                      <Activity className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 opacity-50" />
                      Belum ada aktivitas
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* System Modules */}
            <div className="lg:col-span-2">
              <div className="rounded-2xl sm:rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-bold text-white mb-4 sm:mb-6">Modul Sistem</h3>
                <div className="grid gap-2 sm:gap-4 grid-cols-2 lg:grid-cols-3">
                  {mainFeatures.map((feature, i) => {
                    const Icon = feature.icon
                    return (
                      <Link
                        href={feature.link}
                        key={i}
                        className="group relative overflow-hidden rounded-xl sm:rounded-2xl border border-white/10 bg-white/5 p-3 sm:p-5 transition-all hover:border-white/20 hover:bg-white/10 hover:-translate-y-1 hover:shadow-xl"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/10">
                            <Icon className="h-3 w-3 sm:h-5 sm:w-5 text-blue-400" />
                          </div>
                          <h4 className="text-[10px] sm:text-sm font-bold text-white">{feature.name}</h4>
                        </div>
                        <p className="text-[9px] sm:text-xs text-slate-400 mb-2">{feature.description}</p>
                        <div className="flex items-center gap-2 text-[9px] sm:text-xs font-medium text-blue-300 group-hover:text-blue-200">
                          Akses Modul
                          <ArrowRight className="h-2 w-2 sm:h-3 sm:w-3 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* System Status */}
        <section className="container mx-auto px-4 pb-12">
          <div className="rounded-2xl sm:rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-bold text-white mb-4 sm:mb-6">Status Sistem</h3>
            <div className="grid gap-2 sm:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
              {systemStatusItems.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-2 sm:p-4 rounded-xl sm:rounded-2xl border border-white/5 bg-white/5">
                  <div className="flex items-center gap-2 sm:gap-3">
                    {i === 0 && <Database className="h-3 w-3 sm:h-5 sm:w-5 text-slate-400" />}
                    {i === 1 && <RefreshCw className="h-3 w-3 sm:h-5 sm:w-5 text-slate-400" />}
                    {i === 2 && <ShieldCheck className="h-3 w-3 sm:h-5 sm:w-5 text-slate-400" />}
                    {i === 3 && <Pill className="h-3 w-3 sm:h-5 sm:w-5 text-slate-400" />}
                    {i === 4 && <Monitor className="h-3 w-3 sm:h-5 sm:w-5 text-slate-400" />}
                    {i === 5 && <HardDrive className="h-3 w-3 sm:h-5 sm:w-5 text-slate-400" />}
                    {i === 6 && <Server className="h-3 w-3 sm:h-5 sm:w-5 text-slate-400" />}
                    <span className="text-[10px] sm:text-sm text-slate-300">{item.name}</span>
                  </div>
                  <span className={`text-[9px] sm:text-xs font-bold ${
                    item.status === "Online" || item.status === "Aktif" || item.status === "Normal" || item.status === "Optimal"
                      ? "text-emerald-400"
                      : "text-amber-400"
                  }`}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 bg-white/5 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-6 sm:py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 sm:h-20 sm:w-20 items-center justify-center rounded-xl">
                <img src="/logo.png" alt="Logo RS Budi Rahayu" className="h-full w-full object-contain" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-white">Sistem Surveilans PPI</p>
                <p className="text-[10px] sm:text-xs text-slate-400">Rumah Sakit Budi Rahayu</p>
              </div>
            </div>
            <div className="text-[10px] sm:text-xs text-slate-400 text-center md:text-right">
              <p>Sistem terintegrasi untuk pencegahan dan pengendalian infeksi di rumah sakit.</p>
              <p className="mt-1">
                <span className="mr-0 md:mr-4">Versi Sistem: v2.1.0</span>
                <span>Hak Akses Terproteksi</span>
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 mb-4">
            <Link href="/help" className="text-[10px] sm:text-xs text-blue-400 hover:text-blue-300">
              Pusat Bantuan
            </Link>
            <Link href="/status" className="text-[10px] sm:text-xs text-blue-400 hover:text-blue-300">
              Status Sistem
            </Link>
          </div>
          <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-white/5 text-center">
            <p className="text-[10px] sm:text-xs text-slate-500">
              © {new Date().getFullYear()} Rumah Sakit Budi Rahayu. Semua hak dilindungi.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
