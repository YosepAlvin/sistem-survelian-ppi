"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { PageHeader } from "@/components/ui/PageHeader"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { StatCard } from "@/components/ui/StatCard"
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton"
import { Button } from "@/components/ui/button"
import {
  Activity,
  Calendar,
  Clock,
  ChevronLeft,
  PlusCircle,
  ArrowUpDown,
  MinusCircle,
  Image as ImageIcon,
  Bell as BellIcon,
  ShieldCheck,
  ListChecks,
  Inbox as InboxIcon,
  CalendarDays,
  Filter,
  Hand,
} from "lucide-react"
import { useSession } from "next-auth/react"
import useSWR from "swr"
import { fetcher } from "@/lib/fetcher"
import { cn, getDisplayName } from "@/lib/utils"

type ActionCategory = 'CREATE' | 'UPDATE' | 'DELETE' | 'UPLOAD' | 'OTHER'

interface TrailItem {
  id: number
  action: string
  entityType: string | null
  entityId: number | null
  moduleName: string | null
  field: string | null
  previousValue: string | null
  newValue: string | null
  userName: string | null
  userId: number | null
  ipAddress: string | null
  timestamp: string | Date
}

function timeAgo(dateStr: string | Date): string {
  const date = new Date(dateStr)
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)

  const intervals: { label: string; plural: string; seconds: number }[] = [
    { label: "tahun", plural: "tahun", seconds: 31536000 },
    { label: "bulan", plural: "bulan", seconds: 2592000 },
    { label: "minggu", plural: "minggu", seconds: 604800 },
    { label: "hari", plural: "hari", seconds: 86400 },
    { label: "jam", plural: "jam", seconds: 3600 },
    { label: "menit", plural: "menit", seconds: 60 },
  ]

  for (const interval of intervals) {
    const value = Math.floor(seconds / interval.seconds)
    if (value >= 1) {
      return `${value} ${value === 1 ? interval.label : interval.plural} lalu`
    }
  }
  if (seconds < 10) return "Baru saja"
  return `${Math.floor(seconds)} detik lalu`
}

function categorizeAction(action: string): { category: ActionCategory; label: string } {
  const safe = (action ?? "UNKNOWN_ACTION").toString()
  const a = safe.toUpperCase()
  if (a.includes("CREATE") || a.includes("BUAT") || a.includes("TAMBAH") || a.includes("ADD") || a.includes("INSERT") || a.includes("DAFTAR")) {
    return { category: "CREATE", label: safe }
  }
  if (a.includes("DELETE") || a.includes("HAPUS") || a.includes("REMOVE") || a.includes("CLOSE") || a.includes("TUTUP")) {
    return { category: "DELETE", label: safe }
  }
  if (a.includes("UPLOAD") || a.includes("PROFILE_IMAGE") || a.includes("UNGGAH") || a.includes("IMAGE") || a.includes("FOTO")) {
    return { category: "UPLOAD", label: safe }
  }
  if (a.includes("UPDATE") || a.includes("UBAH") || a.includes("EDIT") || a.includes("MODIF") || a.includes("VERIF") || a.includes("REPLACE")) {
    return { category: "UPDATE", label: safe }
  }
  return { category: "OTHER", label: safe }
}

function actionMeta(cat: ActionCategory) {
  switch (cat) {
    case "CREATE":
      return {
        icon: <PlusCircle size={18} />,
        iconBg: "bg-emerald-500/15 text-emerald-500 group-hover:bg-emerald-500/25",
        badge: "bg-emerald-500/15 text-emerald-600 border border-emerald-500/20",
        dot: "bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.15)]",
        line: "from-emerald-500/60 via-emerald-500/30 to-transparent",
      }
    case "UPDATE":
      return {
        icon: <ArrowUpDown size={18} />,
        iconBg: "bg-amber-500/15 text-amber-500 group-hover:bg-amber-500/25",
        badge: "bg-amber-500/15 text-amber-700 border border-amber-500/20",
        dot: "bg-amber-500 shadow-[0_0_0_4px_rgba(245,158,11,0.15)]",
        line: "from-amber-500/60 via-amber-500/30 to-transparent",
      }
    case "DELETE":
      return {
        icon: <MinusCircle size={18} />,
        iconBg: "bg-rose-500/15 text-rose-500 group-hover:bg-rose-500/25",
        badge: "bg-rose-500/15 text-rose-600 border border-rose-500/20",
        dot: "bg-rose-500 shadow-[0_0_0_4px_rgba(244,63,94,0.15)]",
        line: "from-rose-500/60 via-rose-500/30 to-transparent",
      }
    case "UPLOAD":
      return {
        icon: <ImageIcon size={18} />,
        iconBg: "bg-sky-500/15 text-sky-500 group-hover:bg-sky-500/25",
        badge: "bg-sky-500/15 text-sky-700 border border-sky-500/20",
        dot: "bg-sky-500 shadow-[0_0_0_4px_rgba(14,165,233,0.15)]",
        line: "from-sky-500/60 via-sky-500/30 to-transparent",
      }
    default:
      return {
        icon: <ListChecks size={18} />,
        iconBg: "bg-slate-500/15 text-slate-500 group-hover:bg-slate-500/25",
        badge: "bg-slate-500/15 text-slate-700 border border-slate-500/20",
        dot: "bg-slate-500 shadow-[0_0_0_4px_rgba(100,116,139,0.15)]",
        line: "from-slate-500/60 via-slate-500/30 to-transparent",
      }
  }
}

type FilterType = "ALL" | ActionCategory

export default function ProfileActivityPage() {
  const { data: session } = useSession()
  const [filter, setFilter] = useState<FilterType>("ALL")

  const { data: auditData, isLoading } = useSWR("/api/user/audit-trails", fetcher)
  const trails: TrailItem[] = useMemo(() => auditData?.data || [], [auditData])

  const stats = useMemo(() => {
    let create = 0, update = 0, del = 0, upload = 0
    for (const t of trails) {
      const { category } = categorizeAction(t.action)
      if (category === "CREATE") create++
      else if (category === "UPDATE") update++
      else if (category === "DELETE") del++
      else if (category === "UPLOAD") upload++
    }
    return { total: trails.length, create, update, delete: del, upload }
  }, [trails])

  const filteredTrails = useMemo(() => {
    if (filter === "ALL") return trails
    return trails.filter(t => categorizeAction(t.action).category === filter)
  }, [trails, filter])

  return (
    <div className="space-y-10 pb-16">
      <PageHeader
        title="Riwayat Aktivitas Akun"
        description={`Jejak aktivitas lengkap ${session?.user?.name || 'Anda'} di dalam sistem PPI`}
        backHref="/profile"
        backLabel="Kembali ke Pengaturan Profil"
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Profil", href: "/profile" },
          { label: "Aktivitas" },
        ]}
        actions={
          <Link href="/profile">
            <Button variant="outline" className="gap-2">
              <ChevronLeft size={16} />
              Kembali
            </Button>
          </Link>
        }
      />

      {/* HERO / WELCOME + STATS ROW */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-slate-50 via-white to-slate-100 border border-slate-200 shadow-xl shadow-slate-200/60">
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-gradient-to-br from-indigo-500/20 via-sky-400/10 to-transparent blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-gradient-to-tr from-emerald-400/20 via-transparent to-transparent blur-3xl pointer-events-none" />

        <div className="relative z-10 p-8 md:p-10 space-y-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/5 border border-slate-900/10 text-slate-700 text-[10px] font-black uppercase tracking-[0.18em]">
                <Activity size={12} className="text-indigo-600" />
                Activity Monitor
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-slate-950 tracking-tight leading-tight">
                Halo, <span className="inline-flex items-center gap-3"><span className="bg-gradient-to-r from-indigo-600 via-sky-600 to-emerald-600 bg-clip-text text-transparent">{getDisplayName(session?.user?.name ?? null)}</span><Hand size={28} strokeWidth={2} className="text-amber-500 -rotate-[18deg] origin-bottom-right inline-block" /></span>
              </h2>
              <p className="text-slate-600 font-medium max-w-2xl text-sm md:text-base leading-relaxed">
                Di bawah ini adalah catatan setiap aksi yang Anda lakukan di sistem, termasuk pembuatan data, perubahan, penghapusan, dan pengunggahan berkas. Semua perubahan tercatat otomatis untuk keperluan audit jejak medis.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 md:gap-4 min-w-[280px]">
              <div className="rounded-2xl bg-white/80 backdrop-blur border border-slate-200 px-5 py-4 shadow-sm">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Aksi</p>
                <p className="text-3xl font-black text-slate-950 tracking-tighter">{stats.total}</p>
              </div>
              <div className="rounded-2xl bg-white/80 backdrop-blur border border-slate-200 px-5 py-4 shadow-sm">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Sesi Hari Ini</p>
                <p className="text-3xl font-black text-slate-950 tracking-tighter">
                  {trails.filter(t => {
                    const today = new Date(); const d = new Date(t.timestamp)
                    return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear()
                  }).length}
                </p>
              </div>
            </div>
          </div>

          {/* StatCards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard
              title="Buat Data Baru"
              value={stats.create}
              description={`Total ${stats.create} entri dibuat.`}
              icon={<PlusCircle />}
              color="green"
            />
            <StatCard
              title="Perubahan Data"
              value={stats.update}
              description={`${stats.update} kali edit/update data.`}
              icon={<ArrowUpDown />}
              color="amber"
            />
            <StatCard
              title="Hapus / Tutup"
              value={stats.delete}
              description={`Jumlah aksi hapus/tutup.`}
              icon={<MinusCircle />}
              color="red"
            />
            <StatCard
              title="Unggah Berkas"
              value={stats.upload}
              description={`Foto profil & dokumen.`}
              icon={<ImageIcon />}
              color="blue"
            />
          </div>
        </div>
      </div>

      {/* FILTER TABS */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-100 border border-slate-200 shadow-sm">
          <Filter size={16} className="text-slate-500" />
          <p className="text-[11px] font-black uppercase tracking-widest text-slate-600">Filter Aktivitas</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {([
            ["ALL", "Semua", stats.total],
            ["CREATE", "Buat Data", stats.create],
            ["UPDATE", "Ubah Data", stats.update],
            ["DELETE", "Hapus/Tutup", stats.delete],
            ["UPLOAD", "Unggah", stats.upload],
          ] as [FilterType, string, number][]).map(([key, label, count]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={cn(
                "group inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-sm font-bold transition-all duration-300",
                filter === key
                  ? "bg-slate-950 text-white border-slate-950 shadow-xl shadow-slate-900/20 scale-[1.02]"
                  : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50 hover:shadow-md"
              )}
            >
              <span>{label}</span>
              <span className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-black",
                filter === key ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600 group-hover:bg-slate-200"
              )}>
                {count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* TIMELINE */}
      <div className="relative">
        {isLoading ? (
          <Card variant="premium">
            <CardContent className="pt-10">
              <LoadingSkeleton count={5} rows={4} />
            </CardContent>
          </Card>
        ) : filteredTrails.length === 0 ? (
          <Card variant="premium" className="overflow-hidden">
            <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500" />
            <CardContent className="pt-14 pb-16 px-10">
              <div className="flex flex-col items-center justify-center text-center space-y-5 max-w-xl mx-auto">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/30 to-emerald-500/30 rounded-full blur-2xl scale-150 opacity-60" />
                  <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-200 flex items-center justify-center text-slate-500 shadow-inner">
                    <InboxIcon size={34} strokeWidth={1.7} />
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-slate-950 tracking-tight">
                    {filter === "ALL" ? "Belum ada aktivitas apapun" : "Tidak ada data untuk filter ini"}
                  </h3>
                  <p className="text-slate-500 font-medium leading-relaxed text-sm">
                    {filter === "ALL"
                      ? "Segala aksi yang Anda lakukan di sistem (menambah data, mengubah, unggah foto, dll) akan muncul di sini sebagai catatan audit yang rapi dan terstruktur."
                      : `Tidak ada jejak dengan kategori ${filter} untuk akun ini. Coba pilih kategori filter lain atau buka modul surveilans untuk mulai beraktivitas.`}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3 pt-2 justify-center">
                  <Link href="/profile">
                    <Button variant="outline" className="gap-2">
                      <ChevronLeft size={16} />
                      Kembali ke Profil
                    </Button>
                  </Link>
                  <Link href="/">
                    <Button className="gap-2 bg-slate-950 hover:bg-slate-800 text-white">
                      <ShieldCheck size={16} />
                      Kembali ke Dashboard
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="relative">
            {/* Central Timeline Guide Line */}
            <div
              aria-hidden
              className="hidden md:block absolute top-4 bottom-4 left-5 md:left-1/2 md:-translate-x-[1px] w-0.5 bg-gradient-to-b from-indigo-500/30 via-sky-500/30 to-emerald-500/30 rounded-full"
            />

            <div className="space-y-8 md:space-y-12">
              {filteredTrails.map((trail, idx) => {
                const rawAction = (trail.action ?? "UNKNOWN_ACTION") as string
                const { category, label: actionLabel } = categorizeAction(rawAction)
                const meta = actionMeta(category)
                const safeTimestamp = trail.timestamp ?? new Date().toISOString()
                const date = new Date(safeTimestamp)
                const dateId = date.toISOString().split("T")[0]
                const isEven = idx % 2 === 0

                return (
                  <div key={trail.id} className="relative group">
                    {/* Timeline Dot */}
                    <div className="absolute md:left-1/2 left-5 -translate-x-1/2 top-5 z-10">
                      <div className={cn("w-5 h-5 rounded-full ring-4 ring-white", meta.dot)} />
                    </div>

                    <div className={cn(
                      "md:grid md:grid-cols-2 md:gap-10 pl-14 md:pl-0",
                      !isEven && "md:[&>*:first-child]:col-start-2"
                    )}>
                      {/* Side meta / spacer */}
                      <div className={cn(
                        "hidden md:flex flex-col gap-3 pt-1",
                        isEven ? "items-end pr-8" : "col-start-2 pl-8 items-start order-2"
                      )}>
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm">
                          <CalendarDays size={13} className="text-indigo-600" />
                          <p className="text-[11px] font-black tracking-wider uppercase text-slate-700">
                            {date.toLocaleDateString('id-ID', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-950 text-white shadow-md">
                          <Clock size={13} />
                          <p className="text-[11px] font-black tracking-widest uppercase">
                            {date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </p>
                        </div>
                        <p className="text-xs font-bold text-slate-500 tracking-wide">
                          <span className="text-slate-700">{timeAgo(safeTimestamp)}</span>
                        </p>
                      </div>

                      {/* Main Card */}
                      <div className={cn(isEven ? "md:pl-2" : "md:pr-2 md:col-start-1 md:row-start-1", "relative")}>
                        <Card
                          variant="premium"
                          hoverable
                          className="overflow-hidden group/card border-slate-200"
                        >
                          {/* Top color accent bar */}
                          <div className={cn("h-1.5 w-full bg-gradient-to-r opacity-80", meta.line)} />

                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between gap-4 flex-wrap">
                              <div className="flex items-center gap-3.5">
                                <div className={cn(
                                  "w-11 h-11 rounded-2xl border border-white shadow-md flex items-center justify-center shrink-0 transition-transform duration-500 group-hover/card:scale-110 group-hover/card:-rotate-3",
                                  meta.iconBg
                                )}>
                                  {meta.icon}
                                </div>
                                <div className="space-y-1.5 min-w-0">
                                  <CardTitle className="text-xl text-slate-950 break-words">
                                    {(actionLabel ?? "UNKNOWN_ACTION").replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                                  </CardTitle>
                                  {/* Mobile time + date */}
                                  <div className="flex md:hidden items-center gap-2 text-xs text-slate-500 font-semibold">
                                    <Calendar size={13} />
                                    {date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    <span className="text-slate-300">•</span>
                                    <Clock size={13} />
                                    {date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                    <span className="text-slate-300">•</span>
                                    <span className="text-slate-700">{timeAgo(safeTimestamp)}</span>
                                  </div>
                                  {/* Desktop module inline tag */}
                                  <div className="hidden md:flex items-center gap-2 flex-wrap">
                                    {trail.moduleName && (
                                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-black uppercase tracking-widest">
                                        <Activity size={11} />
                                        {trail.moduleName}
                                      </span>
                                    )}
                                    {trail.field && (
                                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-black uppercase tracking-widest">
                                        field: {trail.field}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                                <span className={cn("px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.14em]", meta.badge)}>
                                  {category}
                                </span>
                                {trail.entityType && (
                                  <span className="px-3 py-1.5 rounded-full bg-slate-950 text-white text-[10px] font-black uppercase tracking-widest shadow-sm">
                                    {trail.entityType}
                                    {trail.entityId != null && ` #${trail.entityId}`}
                                  </span>
                                )}
                              </div>
                            </div>
                          </CardHeader>

                          <CardContent className="pt-2 pb-6 space-y-5">
                            {/* Mobile module tags */}
                            <div className="flex md:hidden items-center gap-2 flex-wrap">
                              {trail.moduleName && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-black uppercase tracking-widest">
                                  <Activity size={11} />
                                  {trail.moduleName}
                                </span>
                              )}
                              {trail.field && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-black uppercase tracking-widest">
                                  field: {trail.field}
                                </span>
                              )}
                            </div>

                            {(trail.previousValue || trail.newValue) && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                                {trail.previousValue && (
                                  <div className="group/prev relative rounded-2xl overflow-hidden border border-rose-200 bg-gradient-to-br from-rose-50 via-white to-rose-50/40 shadow-sm">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-rose-500/80 via-rose-400/70 to-rose-200" />
                                    <div className="px-5 py-4 pl-6 space-y-2">
                                      <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-rose-700">
                                        <MinusCircle size={13} />
                                        Nilai Sebelumnya
                                      </div>
                                      <pre className="text-xs text-rose-800 whitespace-pre-wrap break-all font-mono leading-relaxed max-h-36 overflow-y-auto pr-1">
                                        {trail.previousValue}
                                      </pre>
                                    </div>
                                  </div>
                                )}
                                {trail.newValue && (
                                  <div className="group/next relative rounded-2xl overflow-hidden border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/40 shadow-sm">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-emerald-500/80 via-emerald-400/70 to-emerald-200" />
                                    <div className="px-5 py-4 pl-6 space-y-2">
                                      <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-emerald-700">
                                        <PlusCircle size={13} />
                                        Nilai Setelahnya
                                      </div>
                                      <pre className="text-xs text-emerald-800 whitespace-pre-wrap break-all font-mono leading-relaxed max-h-36 overflow-y-auto pr-1">
                                        {trail.newValue}
                                      </pre>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Footer meta */}
                            {(trail.ipAddress || trail.id != null) && (
                              <div className="pt-3 border-t border-dashed border-slate-200 flex flex-wrap items-center justify-between gap-3">
                                <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                  {trail.id != null && (
                                    <span className="px-2 py-1 rounded-md bg-slate-100">
                                      <span className="text-slate-400">AUDIT-#{String(trail.id).padStart(5, '0')}</span>
                                    </span>
                                  )}
                                  {trail.ipAddress && (
                                    <span className="px-2 py-1 rounded-md bg-slate-100">
                                      IP: <span className="font-mono text-slate-700">{trail.ipAddress}</span>
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                  • Tercatat otomatis oleh sistem
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* End of timeline cap */}
              <div className="relative pl-14 md:pl-0 flex justify-center">
                <div className="hidden md:flex items-center gap-3 px-5 py-3 rounded-full bg-white border border-slate-200 shadow-sm">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_0_4px_rgba(16,185,129,0.2)]" />
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-600">
                    Akhir dari {filteredTrails.length} entri{filter === "ALL" ? " (20 terbaru)" : ""}
                  </p>
                  <BellIcon size={13} className="text-slate-400" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
