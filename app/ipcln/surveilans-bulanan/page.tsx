"use client"

import React, { useMemo, useState } from 'react'
import { useSession } from "next-auth/react"
import useSWR from 'swr'
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/ui/PageHeader"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { DataTable } from "@/components/ui/DataTable"
import { StatCard } from "@/components/ui/StatCard"
import { FormField, FormInput } from "@/components/ui/FormField"
import { fetcher } from '@/lib/fetcher'

type SurveillanceData = {
  id: string;
  rm: string;
  pasien: string;
  tgl_masuk: string;
  tgl_keluar: string;
  hari_rawat: number;
  uc: number;
  ivl: number;
  vap_days: number;
  isk: number;
  plb: number;
  hap: number;
  vap: number;
  iadp: number;
}

type MonthlyRecapResponse = {
  success: boolean
  data?: {
    month: string
    roomName: string
    rows: SurveillanceData[]
    totals: {
      pasien: number
      hariRawat: number
      deviceDays: number
      infeksi: number
      uc: number
      ivl: number
      vapDays: number
      isk: number
      plb: number
      hap: number
      vap: number
      iadp: number
    }
  }
}

export default function SurveilansBulananPage() {
  const { data: session } = useSession()
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7))

  const { data, isLoading } = useSWR<MonthlyRecapResponse>(
    `/api/ipcln/surveilans-bulanan?month=${selectedMonth}`,
    fetcher,
    { revalidateOnFocus: true, refreshInterval: 60000 }
  )

  const rows = data?.success ? data.data?.rows || [] : []
  const totals = data?.success ? data.data?.totals || {
    pasien: 0,
    hariRawat: 0,
    deviceDays: 0,
    infeksi: 0,
    uc: 0,
    ivl: 0,
    vapDays: 0,
    isk: 0,
    plb: 0,
    hap: 0,
    vap: 0,
    iadp: 0,
  } : {
    pasien: 0,
    hariRawat: 0,
    deviceDays: 0,
    infeksi: 0,
    uc: 0,
    ivl: 0,
    vapDays: 0,
    isk: 0,
    plb: 0,
    hap: 0,
    vap: 0,
    iadp: 0,
  }
  const roomName = data?.success ? data.data?.roomName || 'Ruangan Anda' : 'Ruangan Anda'

  const monthLabel = selectedMonth
    ? new Date(`${selectedMonth}-01`).toLocaleString('id-ID', { month: 'long', year: 'numeric' })
    : 'Semua Bulan'

  const handleExportCsv = () => {
    const headers = [
      'No. RM', 'Pasien', 'Tgl Masuk', 'Tgl Keluar', 'Hari Rawat',
      'UC', 'IVL', 'VAP Days', 'ISK', 'PLB', 'HAP', 'VAP', 'IADP'
    ]

    const csvRows = [headers.join(',')]

    rows.forEach((row) => {
      csvRows.push([
        row.rm,
        `"${row.pasien}"`,
        row.tgl_masuk,
        row.tgl_keluar,
        row.hari_rawat,
        row.uc,
        row.ivl,
        row.vap_days,
        row.isk,
        row.plb,
        row.hap,
        row.vap,
        row.iadp
      ].join(','))
    })

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `surveilans-${selectedMonth || 'semua-bulan'}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handlePrint = () => {
    window.print()
  }

  const columns = [
    {
      key: 'rm' as const,
      label: 'No. RM / Pasien',
      render: (value: string, row: SurveillanceData) => (
        <div>
          <div className="font-bold">{value}</div>
          <div className="text-xs text-gray-500">{row.pasien}</div>
        </div>
      )
    },
    {
      key: 'tgl_masuk' as const,
      label: 'Tgl Masuk'
    },
    {
      key: 'tgl_keluar' as const,
      label: 'Tgl Keluar'
    },
    {
      key: 'hari_rawat' as const,
      label: 'Hari Rawat',
      className: 'text-center'
    },
    {
      key: 'uc' as const,
      label: 'UC',
      className: 'text-center bg-slate-800/90'
    },
    {
      key: 'ivl' as const,
      label: 'IVL',
      className: 'text-center bg-slate-800/90'
    },
    {
      key: 'vap_days' as const,
      label: 'VAP',
      className: 'text-center bg-slate-800/90'
    },
    {
      key: 'isk' as const,
      label: 'ISK',
      className: 'text-center bg-slate-800/90'
    },
    {
      key: 'plb' as const,
      label: 'PLB',
      className: 'text-center bg-slate-800/90',
      render: (value: number) => (
        <span className={value > 0 ? 'font-bold text-red-300' : 'text-slate-300'}>
          {value}
        </span>
      )
    },
    {
      key: 'hap' as const,
      label: 'HAP',
      className: 'text-center bg-slate-800/90'
    },
    {
      key: 'vap' as const,
      label: 'VAP',
      className: 'text-center bg-slate-800/90'
    },
    {
      key: 'iadp' as const,
      label: 'IADP',
      className: 'text-center bg-slate-800/90'
    }
  ]

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-slate-800 bg-slate-900/95 px-6 py-8 shadow-xl shadow-slate-950/40">
          <PageHeader
            title="Rekapitulasi Surveilans Bulanan"
            description={isLoading ? `Memuat data ${monthLabel}...` : `Periode: ${monthLabel} • ${roomName}`}
            backHref="/ipcln/dashboard"
            breadcrumbs={[
              { label: 'Dashboard', href: '/ipcln/dashboard' },
              { label: 'Surveilans Bulanan' }
            ]}
            actions={
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <FormField label="Pilih Bulan">
                  <FormInput
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-auto bg-slate-800 text-white border-slate-700"
                  />
                </FormField>
                <div className="flex gap-2">
                  <Button onClick={handleExportCsv} className="bg-slate-700 hover:bg-slate-600 text-white">
                    Export CSV
                  </Button>
                  <Button onClick={handlePrint} className="bg-slate-700 hover:bg-slate-600 text-white">
                    Print
                  </Button>
                </div>
              </div>
            }
          />
        </div>

        <div className="mb-6 rounded-3xl border border-purple-500/20 bg-purple-500/10 p-4 text-sm text-purple-200">
          Data rekap ini hanya menampilkan pasien dan kejadian yang terkait dengan ruangan {session?.user?.name ? roomName : 'Anda'}, sehingga tidak tercampur dengan ruangan lain.
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Total Pasien"
            value={totals.pasien}
            color="blue"
          />
          <StatCard
            title="Total Hari Rawat"
            value={totals.hariRawat}
            color="green"
          />
          <StatCard
            title="Total Device Days"
            value={totals.deviceDays}
            color="amber"
          />
          <StatCard
            title="Total Infeksi"
            value={totals.infeksi}
            color="red"
          />
        </div>

        {/* Data Table */}
        <Card className="bg-slate-900/95 border-slate-800">
          <CardContent className="p-0">
            <DataTable
              columns={columns}
              data={rows}
              emptyMessage="Tidak ada data surveilans bulan ini untuk ruangan ini."
              className="bg-slate-950"
            />
          </CardContent>
        </Card>

        {/* Summary Footer */}
        <Card className="mt-6 bg-slate-900/95 border-slate-800">
          <CardHeader>
            <CardTitle className="text-base">Total Akhir Bulan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 text-sm md:grid-cols-3">
              <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Total Pasien</p>
                <p className="mt-2 text-2xl font-semibold text-white">{totals.pasien}</p>
              </div>
              <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Hari Rawat</p>
                <p className="mt-2 text-2xl font-semibold text-white">{totals.hariRawat}</p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">UC + IVL</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{totals.uc + totals.ivl}</p>
                </div>
                <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Infeksi Total</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{totals.infeksi}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-2 sm:grid-cols-3 lg:grid-cols-5">
              {[
                { label: 'UC', value: totals.uc },
                { label: 'IVL', value: totals.ivl },
                { label: 'VAP Days', value: totals.vapDays },
                { label: 'ISK', value: totals.isk },
                { label: 'PLB', value: totals.plb },
                { label: 'HAP', value: totals.hap },
                { label: 'VAP', value: totals.vap },
                { label: 'IADP', value: totals.iadp }
              ].map((item) => (
                <div key={item.label} className="rounded-3xl border border-slate-800 bg-slate-950/70 p-3">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">{item.label}</p>
                  <p className="mt-2 text-lg font-semibold text-white">{item.value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}