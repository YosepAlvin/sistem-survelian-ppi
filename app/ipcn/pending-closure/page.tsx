"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { PageHeader } from "@/components/ui/PageHeader"
import { DataTable } from "@/components/ui/DataTable"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { useToast } from "@/components/ui/Toast"
import { Button } from "@/components/ui/button"
import axios from "axios"
import { ShieldCheck } from 'lucide-react'
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

export default function PendingClosurePage() {
  const { showToast } = useToast()
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true)
      const res = await axios.get("/api/verifikasi")
      // Filter only PENDING_CLOSURE cases
      const pendingClosure = res.data.filter((r: Report) => r.caseStatus === 'PENDING_CLOSURE')
      setReports(pendingClosure)
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

  const handleCloseCase = async (id: string) => {
    try {
      await axios.put("/api/verifikasi", { id, action: 'CLOSE_CASE' })
      showToast({
        type: 'success',
        title: 'Kasus Ditutup',
        message: 'Kasus infeksi telah ditutup (pasien dinyatakan sembuh).'
      })
      fetchReports()
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Gagal Menutup Kasus',
        message: err.response?.data?.error || err.message
      })
    }
  }

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
        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-bold uppercase">{value}</span>
      ),
    },
    {
      key: 'id' as const,
      label: 'Aksi',
      render: (value: string) => (
        <Button onClick={() => handleCloseCase(value)} size="sm" className="bg-purple-600 hover:bg-purple-700 h-8 text-xs">Tutup Kasus</Button>
      ),
    },
  ]

  return (
    <>
      <PageHeader 
        title="Pending Closure" 
        description="Daftar kasus infeksi yang menunggu untuk ditutup oleh IPCN."
      />

      <Card>
        <CardHeader>
          <CardTitle>Kasus Menunggu Penutupan</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable 
            columns={columns} 
            data={reports} 
            loading={loading} 
            emptyMessage="Tidak ada kasus yang menunggu penutupan saat ini."
            searchable
            searchPlaceholder="Cari nama pasien atau No. RM..."
          />
        </CardContent>
      </Card>
    </>
  )
}
