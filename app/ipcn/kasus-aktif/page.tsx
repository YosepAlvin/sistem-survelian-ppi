"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { PageHeader } from "@/components/ui/PageHeader"
import { DataTable } from "@/components/ui/DataTable"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { useToast } from "@/components/ui/Toast"
import axios from "axios"
import { AlertCircle } from 'lucide-react'
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

export default function KasusAktifPage() {
  const { showToast } = useToast()
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true)
      const res = await axios.get("/api/verifikasi")
      // Filter only ACTIVE cases
      const activeCases = res.data.filter((r: Report) => r.caseStatus === 'AKTIF')
      setReports(activeCases)
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
        <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs font-bold uppercase">{value}</span>
      ),
    },
  ]

  return (
    <>
      <PageHeader 
        title="Daftar Kasus Aktif" 
        description="Daftar seluruh pasien dengan infeksi yang masih aktif saat ini."
      />

      <Card>
        <CardHeader>
          <CardTitle>Kasus Infeksi Aktif</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable 
            columns={columns} 
            data={reports} 
            loading={loading} 
            emptyMessage="Tidak ada kasus infeksi aktif saat ini."
            searchable
            searchPlaceholder="Cari nama pasien atau No. RM..."
          />
        </CardContent>
      </Card>
    </>
  )
}
