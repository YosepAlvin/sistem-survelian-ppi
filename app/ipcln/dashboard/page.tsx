"use client"

import React, { useState, useEffect } from 'react'
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import axios from "axios"
import { PageHeader } from "@/components/ui/PageHeader"
import { StatCard } from "@/components/ui/StatCard"
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton"
import { Users, Syringe, Pill, Activity, ArrowRight, PlusCircle, ClipboardCheck, BarChart3, Bell, X } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card"

import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'

import { exportToExcel } from "@/lib/excel-export"

export default function IPCLNDashboard() {
  const { data: session } = useSession()
  const router = useRouter()
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  const handleExportSummary = async () => {
    try {
      setIsExporting(true)
      const res = await axios.get('/api/ipcln/stats')
      if (res.data.success) {
        await exportToExcel(
          [res.data.data], 
          `Summary_PPI_IPCLN_${new Date().toISOString().split('T')[0]}`,
          "SUMMARY OPERASIONAL PPI RSU BUDI RAHAYU"
        )
      }
    } catch (err) {
      alert("Gagal mengekspor data")
    } finally {
      setIsExporting(false)
    }
  }
  
  const { data: statsData, error: statsError, isLoading: statsLoading } = useSWR('/api/ipcln/stats', fetcher, {
    refreshInterval: 60000, // Refresh every 1 minute for IPCLN
    revalidateOnFocus: true
  })

  const stats = statsData?.success ? statsData.data : {
    pasienAktif: 0,
    kejadianInfeksi: 0,
    tindakanOperasi: 0,
    antibiotics: {
      aktif: 0,
      akanSelesai: 0,
      overdue: 0,
      perluReview: 0,
      selesai: 0
    }
  }
  const loading = statsLoading

  const actions = [
    {
      title: "Patient Registry",
      desc: "Register new patients & inpatient admissions.",
      icon: <Users className="text-purple-400" />,
      href: "/ipcln/pasien",
      color: "purple",
      btnText: "New Patient"
    },
    {
      title: "Daily Surveillance",
      desc: "Input daily PPI surveillance data per patient.",
      icon: <ClipboardCheck className="text-purple-400" />,
      href: "/ipcln/surveilans-harian",
      color: "purple",
      btnText: "Input Data"
    },
    {
      title: "Catatan Operasi & IDO",
      desc: "Monitor surgical site infections (IDO).",
      icon: <Activity className="text-purple-400" />,
      href: "/ipcln/operasi",
      color: "purple",
      btnText: "Buka Halaman"
    }
  ]

  return (
    <div className="space-y-12 pb-20">
      <PageHeader
        title="Operations Hub"
        description="Point-of-care infection surveillance & data entry."
        actions={
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={handleExportSummary}
              disabled={isExporting}
            >
              <BarChart3 size={18} />
              {isExporting ? "Exporting..." : "Summary"}
            </Button>
            <Button 
              variant="purple" 
              className="gap-2" 
              onClick={() => setIsQuickAddOpen(true)}
            >
              <PlusCircle size={18} />
              Quick Add
            </Button>
          </div>
        }
      />

      {/* Hero Welcome */}
      <div className="relative overflow-hidden p-8 md:p-12 rounded-[2.5rem] bg-[#172033] border border-white/5 shadow-2xl">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-purple-500/10 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-black uppercase tracking-widest">
              Field Operations Active
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">
              Ready for shift, <span className="text-purple-400">{session?.user?.name?.split(' ')[0]}</span>?
            </h2>
            <p className="text-slate-400 font-medium max-w-lg">
              Maintaining data accuracy is key to preventing hospital-acquired infections. Ensure all device placements are updated.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="px-6 py-4 rounded-2xl bg-white/5 border border-white/5 text-center">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Active Patients</p>
              <p className="text-2xl font-black text-white tracking-tighter">{stats.pasienAktif}</p>
            </div>
            <div className="px-6 py-4 rounded-2xl bg-white/5 border border-white/5 text-center">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Today&apos;s Ops</p>
              <p className="text-2xl font-black text-white tracking-tighter">{stats.tindakanOperasi}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Action Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {actions.map((action, i) => (
          <Link href={action.href} key={i}>
            <Card variant="premium" hoverable className="h-full group">
              <CardHeader>
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-white/10 transition-all duration-500">
                  {React.cloneElement(action.icon as React.ReactElement, { size: 28 })}
                </div>
                <CardTitle className="text-2xl">{action.title}</CardTitle>
                <CardDescription className="text-base pt-2">{action.desc}</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <Button variant="outline" className="w-full justify-between rounded-xl group-hover:bg-white group-hover:text-slate-900 transition-all">
                  {action.btnText}
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Secondary Modules */}
      <div className="space-y-8 pt-8">
        <h3 className="text-xl font-black text-white tracking-tight px-2 flex items-center gap-3">
          <Activity size={20} className="text-purple-400" />
          Clinical Surveillance
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <StatCard
            title="Infection Incidents"
            value={stats.kejadianInfeksi}
            description="Reported Phlebitis, ISK, VAP, etc."
            icon={<Syringe />}
            color="red"
            onClick={() => window.location.href = '/ipcln/infeksi'}
          />
          <StatCard
            title="💊 Monitoring Antibiotik"
            value={stats.antibiotics?.aktif || 0}
            description={`Akan Selesai: ${stats.antibiotics?.akanSelesai || 0} • Overdue: ${stats.antibiotics?.overdue || 0} • Perlu Review: ${stats.antibiotics?.perluReview || 0}`}
            icon={<Pill />}
            color="amber"
            onClick={() => window.location.href = '/ipcln/antibiotik'}
          />
          <StatCard
            title="Monthly Recap"
            value="Reports"
            description="Generate room-level surveillance data."
            icon={<BarChart3 />}
            color="purple"
            onClick={() => window.location.href = '/ipcln/surveilans-bulanan'}
          />
        </div>
      </div>

      {/* Quick Add Modal Overlay */}
      {isQuickAddOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" onClick={() => setIsQuickAddOpen(false)} />
          <Card variant="premium" className="relative w-full max-w-2xl animate-fade-in-up border-white/10 shadow-3xl">
            <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 pb-6">
              <div>
                <CardTitle className="text-2xl">Quick Operations</CardTitle>
                <CardDescription>Select a fast action to perform.</CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsQuickAddOpen(false)} className="rounded-full hover:bg-white/5">
                <X size={20} className="text-slate-400" />
              </Button>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 p-8">
               <button 
                  onClick={() => router.push('/ipcln/pasien')}
                  className="group flex flex-col items-center gap-4 p-8 rounded-[2rem] bg-white/5 border border-white/5 hover:border-purple-500/50 hover:bg-purple-500/5 transition-all duration-300"
                >
                  <div className="p-4 rounded-2xl bg-purple-500/10 text-purple-400 group-hover:scale-110 transition-transform">
                    <Users size={32} />
                  </div>
                  <span className="font-bold text-white">Register Patient</span>
               </button>
               <button 
                  onClick={() => router.push('/ipcln/surveilans-harian')}
                  className="group flex flex-col items-center gap-4 p-8 rounded-[2rem] bg-white/5 border border-white/5 hover:border-purple-500/50 hover:bg-purple-500/5 transition-all duration-300"
                >
                  <div className="p-4 rounded-2xl bg-purple-500/10 text-purple-400 group-hover:scale-110 transition-transform">
                    <ClipboardCheck size={32} />
                  </div>
                  <span className="font-bold text-white">Input Surveillance</span>
               </button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
