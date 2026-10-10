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
import { AlertCircle, Users, Activity, BarChart3, FileText, ArrowRight, ShieldCheck, TrendingUp, Bell, AlertTriangle, PartyPopper } from 'lucide-react'
import { Button } from "@/components/ui/button"

import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'

import { exportToExcel } from "@/lib/excel-export"
import { getDisplayName } from "@/lib/utils"

export default function IPCNDashboard() {
  const { data: session } = useSession()
  const router = useRouter()
  const [isExporting, setIsExporting] = useState(false)
  const [isGeneratingNotifications, setIsGeneratingNotifications] = useState(false)
  const [notificationStats, setNotificationStats] = useState({ overdue: 0, perluReview: 0, akanSelesai: 0 })
  const [antibioticNotifications, setAntibioticNotifications] = useState<any[]>([])

  // Auto-generate notifications on mount
  useEffect(() => {
    const generateNotifications = async () => {
      try {
        await axios.post('/api/antibiotik/notifications')
      } catch (error) {
        console.error('Failed to auto-generate notifications:', error)
      }
    }
    generateNotifications()
  }, [])

  // Fetch antibiotic notifications on mount
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await axios.get('/api/antibiotik/notifications')
        if (res.data.success) {
          const notifications = res.data.data || []
          setAntibioticNotifications(notifications)
          const stats = { overdue: 0, perluReview: 0, akanSelesai: 0 }
          notifications.forEach((n: any) => {
            if (n.type === 'ANTIBIOTIK_OVERDUE') stats.overdue++
            if (n.type === 'ANTIBIOTIK_PERLU_REVIEW') stats.perluReview++
            if (n.type === 'ANTIBIOTIK_AKAN_SELESAI') stats.akanSelesai++
          })
          setNotificationStats(stats)
        }
      } catch (error) {
        console.error('Failed to fetch notifications:', error)
      }
    }
    fetchNotifications()
  }, [])

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

  const handleRefreshNotifications = async () => {
    try {
      setIsGeneratingNotifications(true)
      await axios.post('/api/antibiotik/notifications')
      const res = await axios.get('/api/antibiotik/notifications')
      if (res.data.success) {
        const notifications = res.data.data || []
        setAntibioticNotifications(notifications)
        const stats = { overdue: 0, perluReview: 0, akanSelesai: 0 }
        notifications.forEach((n: any) => {
          if (n.type === 'ANTIBIOTIK_OVERDUE') stats.overdue++
          if (n.type === 'ANTIBIOTIK_PERLU_REVIEW') stats.perluReview++
          if (n.type === 'ANTIBIOTIK_AKAN_SELESAI') stats.akanSelesai++
        })
        setNotificationStats(stats)
      }
    } catch (error) {
      console.error('Failed to refresh notifications:', error)
    } finally {
      setIsGeneratingNotifications(false)
    }
  }

  const { data: statsData, error: statsError, isLoading: statsLoading } = useSWR('/api/ipcn/stats', fetcher, {
    refreshInterval: 30000,
    revalidateOnFocus: true
  })

  const { data: activityData, isLoading: activityLoading } = useSWR('/api/ipcn/nurse-activity', fetcher, {
    refreshInterval: 60000,
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
              className="text-slate-600 font-bold text-xs uppercase tracking-widest hover:text-emerald-700"
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
      <div className="relative overflow-hidden p-8 md:p-12 rounded-[2.5rem] bg-white border border-slate-200 shadow-2xl">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-emerald-500/10 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-[10px] font-black uppercase tracking-widest">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
              </span>
              System Active
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
              Welcome back, <span className="text-emerald-700">{getDisplayName(session?.user?.name ?? null)}</span>.
            </h2>
            <p className="text-slate-600 font-medium max-lg">
              IPCN sedang memantau <span className="text-slate-900 font-bold">{stats.kasusAktifHariIni} kasus aktif</span>, <span className="text-slate-900 font-bold">{stats.pendingVerifikasi} laporan</span> menunggu verifikasi, dan <span className="text-slate-900 font-bold">{stats.deviceAlertHariIni} alert alat</span> hari ini.
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
              icon={<ShieldCheck className="text-purple-600" />}
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
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Analytical Modules</h3>
            <p className="text-slate-500 text-sm font-medium">Deep dive into infection trends and reporting.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { 
              title: "Monthly Reports", 
              desc: "Automated monthly infection rate calculations and distribution.", 
              icon: <FileText className="text-emerald-700" />,
              href: "/ipcn/laporan/bulanan",
              color: "emerald"
            },
            { 
              title: "Infection Trends", 
              desc: "Visual representation of cross-departmental infection data.", 
              icon: <TrendingUp className="text-emerald-700" />,
              href: "/ipcn/grafik/bulanan",
              color: "emerald"
            },
            { 
              title: "IDO Specialized", 
              desc: "Deep analysis of surgical site infection surveillance data.", 
              icon: <ShieldCheck className="text-emerald-700" />,
              href: "/ipcn/laporan/ido",
              color: "emerald"
            }
          ].map((mod, i) => (
            <Link href={mod.href} key={i}>
              <Card variant="premium" hoverable className="h-full group">
                <CardHeader>
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-slate-100 transition-all duration-500">
                    {mod.icon}
                  </div>
                  <CardTitle className="text-xl">{mod.title}</CardTitle>
                  <CardDescription className="pt-2">{mod.desc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-[-10px] group-hover:translate-x-0">
                    Access Module <ArrowRight size={14} />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Alert Monitoring Antibiotik Panel */}
      <div className="space-y-4">
        <div className="flex items-end justify-between">
          <div className="space-y-1">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <span className="relative">
                <Bell size={22} className="text-rose-500" />
                <AlertTriangle size={11} className="text-rose-600 absolute -top-1 -right-1 fill-rose-100" strokeWidth={2.4} />
              </span>
              Alert Monitoring Antibiotik
            </h3>
            <p className="text-slate-500 text-sm font-medium">
              Notifikasi otomatis untuk terapi antibiotik yang perlu perhatian IPCN.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshNotifications}
              disabled={isGeneratingNotifications}
              className="gap-2"
            >
              <Bell size={16} className={isGeneratingNotifications ? 'animate-spin' : ''} />
              {isGeneratingNotifications ? "Refreshing..." : "Refresh Notifikasi"}
            </Button>
            <Button
              variant="success"
              size="sm"
              onClick={() => router.push('/ipcln/antibiotik')}
              className="gap-2"
            >
              <ArrowRight size={16} />
              Lihat Semua
            </Button>
          </div>
        </div>

        {isGeneratingNotifications ? (
          <LoadingSkeleton count={1} rows={3} />
        ) : (
          <Card className="bg-white border-slate-200 rounded-[2rem]">
            <CardContent className="p-6">
              {notificationStats.overdue === 0 && 
               notificationStats.perluReview === 0 && 
               notificationStats.akanSelesai === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
                    <PartyPopper size={30} className="text-emerald-600" />
                  </div>
                  <p className="text-emerald-700 font-medium flex items-center gap-2"><PartyPopper size={15} /> Tidak ada alert antibiotik saat ini.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Overdue */}
                  {notificationStats.overdue > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-rose-600">
                        <AlertCircle size={18} />
                        <span className="font-bold text-sm uppercase tracking-wider">
                          {notificationStats.overdue} Antibiotik Overdue
                        </span>
                      </div>
                      <div className="space-y-2 pl-4 border-l-2 border-rose-300">
                        {antibioticNotifications.filter((n: any) => n.type === 'ANTIBIOTIK_OVERDUE').map((n: any) => (
                          <div 
                            key={n.id} 
                            className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer group"
                            onClick={() => router.push(`/ipcln/antibiotik`)}
                          >
                            <div className="space-y-1">
                              <p className="text-sm text-slate-900 font-medium">{n.message}</p>
                              <p className="text-xs text-slate-600">
                                {n.pasien?.nama} • {n.pasien?.no_rm}
                              </p>
                            </div>
                            <ArrowRight size={14} className="text-slate-500 group-hover:text-rose-500 transition-colors" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Perlu Review */}
                  {notificationStats.perluReview > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-purple-600">
                        <Activity size={18} />
                        <span className="font-bold text-sm uppercase tracking-wider">
                          {notificationStats.perluReview} Perlu Review IPCN
                        </span>
                      </div>
                      <div className="space-y-2 pl-4 border-l-2 border-purple-300">
                        {antibioticNotifications.filter((n: any) => n.type === 'ANTIBIOTIK_PERLU_REVIEW').map((n: any) => (
                          <div 
                            key={n.id} 
                            className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer group"
                            onClick={() => router.push(`/ipcln/antibiotik`)}
                          >
                            <div className="space-y-1">
                              <p className="text-sm text-slate-900 font-medium">{n.message}</p>
                              <p className="text-xs text-slate-600">
                                {n.pasien?.nama} • {n.pasien?.no_rm}
                              </p>
                            </div>
                            <ArrowRight size={14} className="text-slate-500 group-hover:text-purple-500 transition-colors" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Akan Selesai */}
                  {notificationStats.akanSelesai > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-amber-600">
                        <Bell size={18} />
                        <span className="font-bold text-sm uppercase tracking-wider">
                          {notificationStats.akanSelesai} Akan Selesai
                        </span>
                      </div>
                      <div className="space-y-2 pl-4 border-l-2 border-amber-300">
                        {antibioticNotifications.filter((n: any) => n.type === 'ANTIBIOTIK_AKAN_SELESAI').map((n: any) => (
                          <div 
                            key={n.id} 
                            className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer group"
                            onClick={() => router.push(`/ipcln/antibiotik`)}
                          >
                            <div className="space-y-1">
                              <p className="text-sm text-slate-900 font-medium">{n.message}</p>
                              <p className="text-xs text-slate-600">
                                {n.pasien?.nama} • {n.pasien?.no_rm}
                              </p>
                            </div>
                            <ArrowRight size={14} className="text-slate-500 group-hover:text-amber-500 transition-colors" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* IPCLN Activity Report */}
      <div className="space-y-8">
        <div className="flex items-end justify-between">
          <div className="space-y-1">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Aktivitas Surveilans IPCLN</h3>
            <p className="text-slate-500 text-sm font-medium">Detail pengunggahan hasil survei harian oleh perawat ruangan.</p>
          </div>
        </div>

        <Card className="bg-white border-slate-200 overflow-hidden rounded-[2rem]">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 text-left border-b border-slate-200">
                    <th className="px-8 py-5 font-bold uppercase tracking-wider">Nama Perawat (IPCLN)</th>
                    <th className="px-8 py-5 font-bold uppercase tracking-wider">Unit / Ruangan</th>
                    <th className="px-8 py-5 font-bold uppercase tracking-wider text-center">Upload Hari Ini</th>
                    <th className="px-8 py-5 font-bold uppercase tracking-wider text-center">Total Riwayat</th>
                    <th className="px-8 py-5 font-bold uppercase tracking-wider">Terakhir Upload</th>
                    <th className="px-8 py-5 font-bold uppercase tracking-wider text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
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
                      <tr key={activity.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-8 py-5 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-700 font-bold text-xs">
                              {activity.name.substring(0, 2).toUpperCase()}
                            </div>
                            <span className="text-slate-900 font-semibold">{activity.name}</span>
                          </div>
                        </td>
                        <td className="px-8 py-5 whitespace-nowrap">
                          <span className="px-3 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 font-medium">
                            {activity.ruangan}
                          </span>
                        </td>
                        <td className="px-8 py-5 whitespace-nowrap text-center">
                          <span className={`text-lg font-black ${activity.uploadsToday > 0 ? 'text-emerald-700' : 'text-slate-600'}`}>
                            {activity.uploadsToday}
                          </span>
                        </td>
                        <td className="px-8 py-5 whitespace-nowrap text-center text-slate-600 font-medium">
                          {activity.totalUploads}
                        </td>
                        <td className="px-8 py-5 whitespace-nowrap text-slate-600">
                          {activity.lastUpload ? new Date(activity.lastUpload).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                        </td>
                        <td className="px-8 py-5 whitespace-nowrap text-right">
                          {activity.uploadsToday > 0 ? (
                            <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-400/10 px-2.5 py-1 rounded-full border border-emerald-400/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              Completed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-rose-600 bg-rose-400/10 px-2.5 py-1 rounded-full border border-rose-400/20">
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
