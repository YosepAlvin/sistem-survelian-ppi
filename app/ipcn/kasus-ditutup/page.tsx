"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { PageHeader } from "@/components/ui/PageHeader"
import { DataTable } from "@/components/ui/DataTable"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { useToast } from "@/components/ui/Toast"
import axios from "axios"
import { CheckCircle } from 'lucide-react'
import { formatTanggal } from '@/lib/date-utils'

type Report = {
  id: string
  rawat_inap_id: number
  tanggal: string
  ruangan: string
  pasien: string
  no_rm: string
  jenis_infeksi: string
  detail: string
  status: string
  statusLabel: string
  caseStatus: string
}

export default function KasusDitutupPage() {
  const { showToast } = useToast()
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true)
      const res = await axios.get("/api/verifikasi")
      // Filter only SELESAI cases
      const closedCases = res.data.filter((r: Report) => r.caseStatus === 'SELESAI')
      setReports(closedCases)
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Gagal Mengambil Data',
        message: 'Tidak dapat terhubung ke server.'
      })
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  const columns = [
    {
      key: 'tanggal' as const,
      label: 'Tgl Kejadian',
      render: (value: string) => <span className="text-gray-600">{formatTanggal(value)}</span>,
    },
    {
      key: 'ruangan' as const,
      label: 'Ruangan',
      render: (value: string) => (
        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-semibold">{value}</span>
      ),
    },
    {
      key: 'pasien' as const,
      label: 'Pasien',
      render: (value: string, row: Report) => (
        <div>
          <div className="font-bold">{value}</div>
          <div className="text-xs text-gray-500">RM: {row.no_rm}</div>
        </div>
      ),
    },
    {
      key: 'jenis_infeksi' as const,
      label: 'Jenis Infeksi',
      render: (value: string) => (
        <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-bold uppercase">{value}</span>
      ),
    },
    {
      key: 'caseStatus' as const,
      label: 'Status Kasus',
      render: (value: string) => (
        <span className={`px-2 py-1 rounded text-xs font-bold ${value === 'SELESAI' ? 'bg-green-100 text-green-800' : value === 'AKTIF' ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-800'}`}>
          {value}
        </span>
      ),
    },
  ]

  return (
    <>
      <PageHeader 
        title="Daftar Kasus Ditutup" 
        description="Riwayat kasus infeksi yang telah dinyatakan selesai/sembuh."
      />

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Kasus Selesai</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable 
            columns={columns} 
            data={reports} 
            loading={loading} 
            emptyMessage="Belum ada kasus yang ditutup."
            searchable
            searchPlaceholder="Cari nama pasien atau No. RM..."
          />
        </CardContent>
      </Card>
    </>
  )
}
