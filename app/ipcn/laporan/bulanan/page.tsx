"use client"

import React, { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/ui/PageHeader"
import { Card, CardContent } from "@/components/ui/Card"
import { DataTable } from "@/components/ui/DataTable"
import { exportToExcel } from "@/lib/excel-export"

type MonthlyRow = {
  ruangan: string
  pasien: number
  total_infeksi: number
  active_events: number
  closed_events: number
  infeksi: {
    phlebitis: number
    isk: number
    vap: number
    iadp: number
    hap: number
    ilo: number
  }
  rates: Record<string, string | number>
  infus_day: number
  kateter_day: number
  ventilator_day: number
  ett_day: number
  trakeostomi_day: number
  ngt_day: number
  drain_operasi_day: number
  chest_tube_day: number
}

export default function LaporanBulananIPCNPage() {
  const [selectedMonth, setSelectedMonth] = useState("2026-06")
  const [rows, setRows] = useState<MonthlyRow[]>([])
  const [isExporting, setIsExporting] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const [year, month] = selectedMonth.split('-')
    const fetchData = async () => {
      try {
        setLoading(true)
        const res = await axios.get(`/api/laporan/bulanan?bulan=${Number(month)}&tahun=${Number(year)}`)
        setRows(res.data?.data || [])
      } catch (error) {
        console.error('Gagal memuat laporan bulanan', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [selectedMonth])

  const summary = useMemo(() => {
    const totalPasienDisurveilans = rows.reduce((sum, row) => sum + Number(row.pasien || 0), 0)
    const totalDeviceDays = rows.reduce((sum, row) => 
      sum + Number(row.infus_day || 0) + 
      Number(row.kateter_day || 0) + 
      Number(row.ventilator_day || 0) + 
      Number(row.ett_day || 0) + 
      Number(row.trakeostomi_day || 0) + 
      Number(row.ngt_day || 0) + 
      Number(row.drain_operasi_day || 0) + 
      Number(row.chest_tube_day || 0), 
    0)
    const totalEventHAIs = rows.reduce((sum, row) => sum + Number(row.total_infeksi || 0), 0)
    const totalEventAktif = rows.reduce((sum, row) => sum + Number(row.active_events || 0), 0)
    const totalEventSelesai = rows.reduce((sum, row) => sum + Number(row.closed_events || 0), 0)
    const infectionStats = rows.reduce((acc, row) => ({
      VAP: acc.VAP + Number(row.infeksi?.vap || 0),
      CAUTI: acc.CAUTI + Number(row.infeksi?.isk || 0),
      CLABSI: acc.CLABSI + Number(row.infeksi?.ilo || 0),
      ILO: acc.ILO + Number(row.infeksi?.ilo || 0),
      HAP: acc.HAP + Number(row.infeksi?.hap || 0),
      PLEBITIS: acc.PLEBITIS + Number(row.infeksi?.phlebitis || 0),
    }), { VAP: 0, CAUTI: 0, CLABSI: 0, ILO: 0, HAP: 0, PLEBITIS: 0 })

    return { totalPasienDisurveilans, totalDeviceDays, totalEventHAIs, totalEventAktif, totalEventSelesai, infectionStats }
  }, [rows])

  const handleExport = async () => {
    try {
      setIsExporting(true)
      await exportToExcel(rows, `Laporan_Bulanan_${selectedMonth}`, 'LAPORAN BULANAN PPI')
      alert(`Laporan Bulanan periode ${selectedMonth} berhasil di-export ke Excel.`)
    } catch (error) {
      alert('Gagal mengekspor laporan')
    } finally {
      setIsExporting(false)
    }
  }

  const columns = [
    { key: 'ruangan', label: 'Ruangan', render: (value: any) => <span className="font-bold">{value}</span> },
    { key: 'pasien', label: 'Pasien', render: (v: any) => <div className="text-center">{v}</div> },
    { key: 'infus_day', label: 'Infus Days', render: (v: any) => <div className="text-center">{v}</div> },
    { key: 'kateter_day', label: 'Kateter Days', render: (v: any) => <div className="text-center">{v}</div> },
    { key: 'ventilator_day', label: 'Ventilator Days', render: (v: any) => <div className="text-center">{v}</div> },
    { key: 'ett_day', label: 'ETT Days', render: (v: any) => <div className="text-center">{v}</div> },
    { key: 'trakeostomi_day', label: 'Trakeostomi Days', render: (v: any) => <div className="text-center">{v}</div> },
    { key: 'ngt_day', label: 'NGT Days', render: (v: any) => <div className="text-center">{v}</div> },
    { key: 'drain_operasi_day', label: 'Drain Operasi Days', render: (v: any) => <div className="text-center">{v}</div> },
    { key: 'chest_tube_day', label: 'Chest Tube Days', render: (v: any) => <div className="text-center">{v}</div> },
    { key: 'total_infeksi', label: 'Total HAIs', render: (v: any) => <div className="text-center">{v}</div> },
    { key: 'active_events', label: 'Aktif', render: (v: any) => <div className="text-center">{v}</div> },
    { key: 'closed_events', label: 'Selesai', render: (v: any) => <div className="text-center">{v}</div> },
  ]

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-slate-800 bg-slate-900/95 px-6 py-8 shadow-xl shadow-slate-950/40">
          <PageHeader
            title="Laporan Bulanan & Permil"
            description="Rekapitulasi seluruh rumah sakit per bulan"
            backHref="/ipcn/dashboard"
            breadcrumbs={[
              { label: 'Dashboard', href: '/ipcn/dashboard' },
              { label: 'Laporan', href: '/ipcn/laporan' },
              { label: 'Bulanan' },
            ]}
            actions={
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="px-3 py-2 rounded-lg bg-slate-800 text-white border border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <Button onClick={handleExport} disabled={isExporting} className="bg-green-600 hover:bg-green-700 text-white">{isExporting ? 'Memproses...' : 'Export Excel'}</Button>
                <Button onClick={() => window.print()} variant="outline" className="border-slate-700 text-slate-200">Print Friendly</Button>
              </div>
            }
          />

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4">
            <Card className="bg-slate-950 border-slate-800"><CardContent className="p-4"><p className="text-slate-400 text-sm">Total Pasien Disurveilans</p><p className="text-2xl font-bold text-white">{summary.totalPasienDisurveilans}</p></CardContent></Card>
            <Card className="bg-slate-950 border-slate-800"><CardContent className="p-4"><p className="text-slate-400 text-sm">Total Device Days</p><p className="text-2xl font-bold text-white">{summary.totalDeviceDays}</p></CardContent></Card>
            <Card className="bg-slate-950 border-slate-800"><CardContent className="p-4"><p className="text-slate-400 text-sm">Total Patient Days</p><p className="text-2xl font-bold text-white">{summary.totalPasienDisurveilans}</p></CardContent></Card>
            <Card className="bg-slate-950 border-slate-800"><CardContent className="p-4"><p className="text-slate-400 text-sm">Total Event HAIs</p><p className="text-2xl font-bold text-white">{summary.totalEventHAIs}</p></CardContent></Card>
            <Card className="bg-slate-950 border-slate-800"><CardContent className="p-4"><p className="text-slate-400 text-sm">Total Event Aktif</p><p className="text-2xl font-bold text-white">{summary.totalEventAktif}</p></CardContent></Card>
            <Card className="bg-slate-950 border-slate-800"><CardContent className="p-4"><p className="text-slate-400 text-sm">Total Event Selesai</p><p className="text-2xl font-bold text-white">{summary.totalEventSelesai}</p></CardContent></Card>
          </div>

          <div className="mt-8 grid grid-cols-1 xl:grid-cols-3 gap-6">
            <Card className="bg-slate-950 border-slate-800"><CardContent className="p-4"><h3 className="font-semibold text-white mb-3">Statistik per Jenis Infeksi</h3>{Object.entries(summary.infectionStats).map(([name, value]) => <div key={name} className="flex justify-between text-sm text-slate-300 py-1"><span>{name}</span><span className="font-semibold text-white">{value} kasus</span></div>)}</CardContent></Card>
            <Card className="bg-slate-950 border-slate-800"><CardContent className="p-4"><h3 className="font-semibold text-white mb-3">Statistik per Ruangan</h3>{rows.map((row) => <div key={row.ruangan} className="flex justify-between text-sm text-slate-300 py-1"><span>{row.ruangan}</span><span className="font-semibold text-white">{row.total_infeksi} HAIs</span></div>)}</CardContent></Card>
            <Card className="bg-slate-950 border-slate-800"><CardContent className="p-4"><h3 className="font-semibold text-white mb-3">Top Device Utilization</h3><div className="flex justify-between text-sm text-slate-300 py-1"><span>Urine Kateter</span><span className="font-semibold text-white">{rows.reduce((sum, row) => sum + Number(row.kateter_day || 0), 0)} Device Days</span></div><div className="flex justify-between text-sm text-slate-300 py-1"><span>Ventilator</span><span className="font-semibold text-white">{rows.reduce((sum, row) => sum + Number(row.ventilator_day || 0), 0)} Device Days</span></div><div className="flex justify-between text-sm text-slate-300 py-1"><span>CVC</span><span className="font-semibold text-white">{rows.reduce((sum, row) => sum + Number(row.infus_day || 0), 0)} Device Days</span></div><div className="flex justify-between text-sm text-slate-300 py-1"><span>ETT</span><span className="font-semibold text-white">{rows.reduce((sum, row) => sum + Number(row.ett_day || 0), 0)} Device Days</span></div><div className="flex justify-between text-sm text-slate-300 py-1"><span>Trakeostomi</span><span className="font-semibold text-white">{rows.reduce((sum, row) => sum + Number(row.trakeostomi_day || 0), 0)} Device Days</span></div><div className="flex justify-between text-sm text-slate-300 py-1"><span>NGT</span><span className="font-semibold text-white">{rows.reduce((sum, row) => sum + Number(row.ngt_day || 0), 0)} Device Days</span></div><div className="flex justify-between text-sm text-slate-300 py-1"><span>Drain Operasi</span><span className="font-semibold text-white">{rows.reduce((sum, row) => sum + Number(row.drain_operasi_day || 0), 0)} Device Days</span></div><div className="flex justify-between text-sm text-slate-300 py-1"><span>Chest Tube (WSD)</span><span className="font-semibold text-white">{rows.reduce((sum, row) => sum + Number(row.chest_tube_day || 0), 0)} Device Days</span></div></CardContent></Card>
          </div>

          <Card className="mt-8 bg-slate-950 border-slate-800">
            <CardContent className="pt-6 overflow-x-auto">
              <DataTable columns={columns} data={rows} loading={loading} emptyMessage="Tidak ada data laporan" className="min-w-[1000px] bg-slate-950" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}