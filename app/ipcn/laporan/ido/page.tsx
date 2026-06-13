"use client"

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/ui/PageHeader"
import { Card } from "@/components/ui/Card"
import { DataTable } from "@/components/ui/DataTable"
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton"
import axios from "axios"

export default function LaporanIDOPage() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))
  const [isDownloading, setIsDownloading] = useState(false)
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const res = await axios.get("/api/operasi")
        setData(res.data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleDownload = () => {
    setIsDownloading(true)
    setTimeout(() => {
      setIsDownloading(false)
      alert(`Laporan IDO periode ${selectedMonth} telah di-generate dan siap di-download.`)
    }, 1500)
  }

  const filteredData = data.filter((item: any) => {
    const itemDate = new Date(item.tanggal)
    return itemDate.toISOString().slice(0, 7) === selectedMonth
  })

  const totalOperasi = filteredData.length
  const totalIDO = filteredData.filter((item: any) => {
    const ido = item.surveilans_ido?.[0]
    return ido?.ada_infeksi === true
  }).length
  const rateIDO = totalOperasi > 0 ? ((totalIDO / totalOperasi) * 100).toFixed(2) : "0.00"

  const columns = [
    { key: 'tanggal', label: 'Tgl Operasi', sortable: true },
    { key: 'pasien', label: 'Pasien', sortable: true, render: (_: any, row: any) => (
      <div>
        <div className="font-bold">{row.pasien}</div>
        <div className="text-xs text-slate-500">RM: {row.no_rm}</div>
      </div>
    ) },
    { key: 'jenis', label: 'Tindakan', sortable: true },
    { key: 'asa', label: 'ASA Klasifikasi', className: 'text-center' },
    { key: 'skor_risiko', label: 'Skor Risiko', className: 'text-center' },
    { key: 'status_ido', label: 'Status IDO', render: (_: any, row: any) => {
      const ido = row.surveilans_ido?.[0]
      if (!ido) return <span className="px-2 py-1 bg-slate-800 text-slate-300 rounded text-xs">BELUM DIISI</span>
      if (ido.ada_infeksi) return <span className="px-2 py-1 bg-red-900/30 text-red-400 rounded text-xs font-bold border border-red-800/50">TERDETEKSI</span>
      return <span className="px-2 py-1 bg-green-900/30 text-green-400 rounded text-xs border border-green-800/50">TIDAK ADA</span>
    }},
    { key: 'kultur', label: 'Kultur', render: (_: any, row: any) => {
      const ido = row.surveilans_ido?.[0]
      return ido?.hasil_kultur || "-"
    }}
  ]

  if (loading) return <div className="p-8"><LoadingSkeleton count={5} rows={4} /></div>

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-slate-800 bg-slate-900/95 px-6 py-8 shadow-xl shadow-slate-950/40">
          <PageHeader
            title="Laporan Infeksi Daerah Operasi (IDO)"
            description="Pemantauan dan rekapitulasi kejadian IDO pasca operasi"
            backHref="/ipcn/dashboard"
            breadcrumbs={[{ label: 'Dashboard', href: '/ipcn/dashboard' }, { label: 'Laporan IDO' }]}
            actions={
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="p-2 rounded bg-slate-800 text-white border border-slate-700"
                />
                <Button onClick={handleDownload} disabled={isDownloading} className="bg-green-600 hover:bg-green-700 text-white">
                  {isDownloading ? 'Generating...' : 'Download Report'}
                </Button>
              </div>
            }
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 bg-slate-900/95 border-slate-800">
            <div className="text-sm font-bold text-slate-400 uppercase">Total Operasi</div>
            <div className="text-3xl font-bold text-white">{totalOperasi}</div>
          </Card>
          <Card className="p-6 bg-slate-900/95 border-slate-800">
            <div className="text-sm font-bold text-slate-400 uppercase">Kejadian IDO</div>
            <div className="text-3xl font-bold text-white">{totalIDO}</div>
          </Card>
          <Card className="p-6 bg-slate-900/95 border-slate-800">
            <div className="text-sm font-bold text-slate-400 uppercase">Rate IDO (%)</div>
            <div className="text-3xl font-bold text-white">{rateIDO}%</div>
          </Card>
        </div>

        <Card className="bg-slate-900/95 border-slate-800">
          <div className="p-6">
            <DataTable 
              columns={columns} 
              data={filteredData} 
              className="bg-slate-950" 
              searchable={true} 
              paginated={true} 
              pageSize={10}
              emptyMessage="Tidak ada data operasi"
            />
          </div>
        </Card>
      </div>
    </div>
  )
}
