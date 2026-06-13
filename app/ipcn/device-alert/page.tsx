"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { PageHeader } from "@/components/ui/PageHeader"
import { DataTable } from "@/components/ui/DataTable"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { useToast } from "@/components/ui/Toast"
import { Button } from "@/components/ui/button"
import axios from "axios"
import { ArrowRight } from 'lucide-react'
import { useRouter } from "next/navigation"
import { formatTanggal } from '@/lib/date-utils'

type DeviceNotification = {
  id: number
  title: string
  message: string
  createdAt: string
  pasien?: {
    nama: string
    no_rm: string
  }
}

export default function DeviceAlertPage() {
  const { showToast } = useToast()
  const router = useRouter()
  const [alerts, setAlerts] = useState<DeviceNotification[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true)
      const res = await axios.get("/api/notifications")
      // Filter only DEVICE_ALERT notifications
      if (res.data.success) {
        const deviceAlerts = res.data.data.filter((n: any) => n.type === 'DEVICE_ALERT')
        setAlerts(deviceAlerts)
      }
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
    fetchAlerts()
  }, [fetchAlerts])

  const columns = [
    {
      key: 'createdAt' as const,
      label: 'Tanggal Alert',
      render: (value: string) => <span className="text-gray-600">{formatTanggal(value)}</span>,
    },
    {
      key: 'pasien' as const,
      label: 'Pasien',
      render: (value: any) => (
        <div>
          <div className="font-bold">{value?.nama || 'N/A'}</div>
          <div className="text-xs text-gray-500">RM: {value?.no_rm || 'N/A'}</div>
        </div>
      ),
    },
    {
      key: 'title' as const,
      label: 'Judul Alert',
      render: (value: string) => <span className="font-semibold text-red-600">{value}</span>,
    },
    {
      key: 'message' as const,
      label: 'Pesan',
      render: (value: string) => <span className="text-sm text-slate-600">{value}</span>,
    },
    {
      key: 'relatedEntityId' as const,
      label: 'Aksi',
      render: (_: any, row: any) => (
        <Button 
          onClick={() => router.push(`/ipcn/saran-alat?alatId=${row.relatedEntityId}`)} 
          size="sm" 
          className="bg-blue-600 hover:bg-blue-700 h-8 text-xs gap-1"
        >
          Beri Saran <ArrowRight size={14} />
        </Button>
      ),
    },
  ]

  return (
    <>
      <PageHeader 
        title="Device Alert" 
        description="Evaluasi penggunaan alat kesehatan yang melebihi batas waktu (threshold)."
      />

      <Card>
        <CardHeader>
          <CardTitle>Daftar Alert Alat</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable 
            columns={columns} 
            data={alerts} 
            loading={loading} 
            emptyMessage="Tidak ada alert alat saat ini."
            searchable
            searchPlaceholder="Cari nama pasien..."
          />
        </CardContent>
      </Card>
    </>
  )
}
