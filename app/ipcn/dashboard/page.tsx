"use client"

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import axios from "axios"
import { PageHeader } from "@/components/ui/PageHeader"
import { StatCard } from "@/components/ui/StatCard"
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card"
import { AlertCircle, Users, Activity, BarChart3, FileText, ArrowRight, ShieldCheck, TrendingUp } from 'lucide-react'
import { Button } from "@/components/ui/button"

import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'

import { exportToExcel } from "@/lib/excel-export"

export default function IPCNDashboard() {
  const { data: session } = useSession()
  const router = useRouter()
  const [isExporting, setIsExporting] = useState(false)

  const handleExportStats = async () => {
    try {
      setIsExporting(true)
      const res = await axios.get('/api/ipcn/stats')
      if (res.data.success) {
        await exportToExcel(
          [res.data.data], 
          `Statistik_PPI_IPCN_${new Date().toISOString().split('T')[0]}`,
          "LAPORAN STATISTIK SURVEILANS PPI RSU BUDI RAHAYU"
        )
      }
    } catch (err) {
      alert("Gagal mengekspor data")
    } finally {
      setIsExporting(false)
    }
  }
  
  const { data: statsData, error: statsError, isLoading: statsLoading } = useSWR('/api/ipcn/stats', fetcher, {
    refreshInterval: 30000, // Refresh every 30 seconds
    revalidateOnFocus: true
  })

  const { data: activityData, isLoading: activityLoading } = useSWR('/api/ipcn/nurse-activity', fetcher, {
    refreshInterval: 60000, // Refresh every minute
  })

  const nurseActivity = activityData?.success ? activityData.data : []

  const stats = statsData?.success ? statsData.data : {
    pendingVerifikasi: 0,
    pasienAktif: 0,
    deviceDay: 0,
    kasusAktifHariIni: 0,
    kasusDitutupHariIni: 0,
    deviceAlertHariIni: 0,
    pendingNotifications: 0,
    pendingClosure: 0,
  }
  const loading = statsLoading

  return (
    <div className="space-y-12 pb-20">
      <PageHeader
        title="Command Center"
        description="Real-time infection prevention & control surveillance system."
        actions={
          <div className="flex gap-3">
            <Button 
              variant="ghost" 
              onClick={() => router.push("/ipcn/laporan/bulanan")}
              className="text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-emerald-400"
            >
              View All Modules
            </Button>
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={handleExportStats}
              disabled={isExporting}
            >
              <FileText size={18} />
              {isExporting ? "Exporting..." : "Export Report"}
            </Button>
            <Button 
              variant="success" 
              className="gap-2"
              onClick={() => router.push('/ipcn/security-audit')}
            >
              <ShieldCheck size={18} />
              Security Audit
            </Button>
          </div>
        }
      />

      {/* Welcome & Quick Info */}
      <div className="relative overflow-hidden p-8 md:p-12 rounded-[2.5rem] bg-[#172033] border border-white/5 shadow-2xl">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-emerald-500/10 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
              </span>
              System Active
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
              Welcome back, <span className="text-emerald-400">{session?.user?.name?.split(' ')[0]}</span>.
            </h2>
            <p className="text-slate-400 font-medium max-lg">
              IPCN sedang memantau <span className="text-white font-bold">{stats.kasusAktifHariIni} kasus aktif</span>, <span className="text-white font-bold">{stats.pendingVerifikasi} laporan</span> menunggu verifikasi, dan <span className="text-white font-bold">{stats.deviceAlertHariIni} alert alat</span> hari ini.
            </p>
          </div>
          <div className="flex gap-4">
            <Button onClick={() => router.push("/ipcn/verifikasi")} variant="success" size="lg" className="rounded-2xl gap-2 group">
              Start Verification
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {loading ? (
          <LoadingSkeleton count={5} rows={4} />
        ) : (
          <>
            <StatCard
              title="Kasus Aktif"
              value={stats.kasusAktifHariIni}
              description="Infeksi aktif saat ini"
              icon={<AlertCircle />}
              color="red"
              onClick={() => router.push("/ipcn/kasus-aktif")}
            />

            <StatCard
              title="Menunggu Verifikasi"
              value={stats.pendingVerifikasi}
              description="Laporan baru"
              icon={<Activity />}
              color="amber"
              onClick={() => router.push("/ipcn/verifikasi")}
            />

            <StatCard
              title="Pending Closure"
              value={stats.pendingClosure}
              description="Menunggu tutup kasus"
              icon={<ShieldCheck className="text-purple-400" />}
              color="purple"
              onClick={() => router.push("/ipcn/pending-closure")}
            />

            <StatCard
              title="Kasus Ditutup"
              value={stats.kasusDitutupHariIni}
              description="Total kasus selesai"
              icon={<ShieldCheck />}
              color="green"
              onClick={() => router.push("/ipcn/kasus-ditutup")}
            />

            <StatCard
              title="Device Alert"
              value={stats.deviceAlertHariIni}
              description="Total alert alat"
              icon={<BarChart3 />}
              color="red"
              onClick={() => router.push("/ipcn/device-alert")}
            />
          </>
        )}
      </div>

      {/* Analytical Modules */}
      <div className="space-y-8">
        <div className="flex items-end justify-between">
          <div className="space-y-1">
            <h3 className="text-2xl font-black text-white tracking-tight">Analytical Modules</h3>
            <p className="text-slate-500 text-sm font-medium">Deep dive into infection trends and reporting.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { 
              title: "Monthly Reports", 
              desc: "Automated monthly infection rate calculations and distribution.", 
              icon: <FileText className="text-emerald-400" />,
              href: "/ipcn/laporan/bulanan",
              color: "emerald"
            },
            { 
              title: "Infection Trends", 
              desc: "Visual representation of cross-departmental infection data.", 
              icon: <TrendingUp className="text-emerald-400" />,
              href: "/ipcn/grafik/bulanan",
              color: "emerald"
            },
            { 
              title: "IDO Specialized", 
              desc: "Deep analysis of surgical site infection surveillance data.", 
              icon: <ShieldCheck className="text-emerald-400" />,
              href: "/ipcn/laporan/ido",
              color: "emerald"
            }
          ].map((mod, i) => (
            <Link href={mod.href} key={i}>
              <Card variant="premium" hoverable className="h-full group">
                <CardHeader>
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-white/10 transition-all duration-500">
                    {mod.icon}
                  </div>
                  <CardTitle className="text-xl">{mod.title}</CardTitle>
                  <CardDescription className="pt-2">{mod.desc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-[-10px] group-hover:translate-x-0">
                    Access Module <ArrowRight size={14} />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* IPCLN Activity Report */}
      <div className="space-y-8">
        <div className="flex items-end justify-between">
          <div className="space-y-1">
            <h3 className="text-2xl font-black text-white tracking-tight">Aktivitas Surveilans IPCLN</h3>
            <p className="text-slate-500 text-sm font-medium">Detail pengunggahan hasil survei harian oleh perawat ruangan.</p>
          </div>
        </div>

        <Card className="bg-[#111827] border-white/5 overflow-hidden rounded-[2rem]">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-950/50 text-slate-400 text-left border-b border-white/5">
                    <th className="px-8 py-5 font-bold uppercase tracking-wider">Nama Perawat (IPCLN)</th>
                    <th className="px-8 py-5 font-bold uppercase tracking-wider">Unit / Ruangan</th>
                    <th className="px-8 py-5 font-bold uppercase tracking-wider text-center">Upload Hari Ini</th>
                    <th className="px-8 py-5 font-bold uppercase tracking-wider text-center">Total Riwayat</th>
                    <th className="px-8 py-5 font-bold uppercase tracking-wider">Terakhir Upload</th>
                    <th className="px-8 py-5 font-bold uppercase tracking-wider text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {activityLoading ? (
                    <tr>
                      <td colSpan={6} className="px-8 py-12 text-center text-slate-500 italic">Memuat data aktivitas...</td>
                    </tr>
                  ) : nurseActivity.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-8 py-12 text-center text-slate-500 italic">Belum ada aktivitas tercatat hari ini.</td>
                    </tr>
                  ) : (
                    nurseActivity.map((activity: any) => (
                      <tr key={activity.id} className="hover:bg-white/5 transition-colors group">
                        <td className="px-8 py-5 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-bold text-xs">
                              {activity.name.substring(0, 2).toUpperCase()}
                            </div>
                            <span className="text-white font-semibold">{activity.name}</span>
                          </div>
                        </td>
                        <td className="px-8 py-5 whitespace-nowrap">
                          <span className="px-3 py-1 rounded-lg bg-white/5 border border-white/5 text-slate-300 font-medium">
                            {activity.ruangan}
                          </span>
                        </td>
                        <td className="px-8 py-5 whitespace-nowrap text-center">
                          <span className={`text-lg font-black ${activity.uploadsToday > 0 ? 'text-emerald-400' : 'text-slate-600'}`}>
                            {activity.uploadsToday}
                          </span>
                        </td>
                        <td className="px-8 py-5 whitespace-nowrap text-center text-slate-400 font-medium">
                          {activity.totalUploads}
                        </td>
                        <td className="px-8 py-5 whitespace-nowrap text-slate-400">
                          {activity.lastUpload ? new Date(activity.lastUpload).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                        </td>
                        <td className="px-8 py-5 whitespace-nowrap text-right">
                          {activity.uploadsToday > 0 ? (
                            <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-full border border-emerald-400/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              Completed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-rose-400 bg-rose-400/10 px-2.5 py-1 rounded-full border border-rose-400/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                              Pending
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
