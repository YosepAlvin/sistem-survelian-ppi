"use client"

import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { DataTable } from '@/components/ui/DataTable'
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/Toast'
import { CheckCircle, XCircle } from 'lucide-react'
import { formatTanggal } from '@/lib/date-utils'

type TransferRequest = {
  id: string
  rawat_inap: {
    pasien: {
      no_rm: string
      nama: string
    }
  }
  ruangan_asal: {
    nama: string
  }
  ruangan_tujuan: {
    nama: string
  }
  tanggal_transfer: string
  alasan: string | null
  dokter_baru: {
    nama: string
  } | null
}

export default function VerifikasiTransferPage() {
  const { showToast } = useToast()
  const [transferList, setTransferList] = useState<TransferRequest[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await axios.get('/api/transfer')
      const pendingTransfers = res.data.filter((t: any) => t.status === 'PENDING')
      setTransferList(pendingTransfers)
    } catch (err) {
      console.error('Failed to fetch data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleVerify = async (id: string) => {
    try {
      await axios.put(`/api/transfer/${id}`, {
        action: 'VERIFY'
      })
      showToast({
        type: 'success',
        title: 'Berhasil',
        message: 'Transfer pasien telah diverifikasi.'
      })
      fetchData()
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Gagal',
        message: err.response?.data?.error || 'Terjadi kesalahan sistem.'
      })
    }
  }

  const handleReject = async (id: string) => {
    try {
      await axios.put(`/api/transfer/${id}`, {
        action: 'REJECT'
      })
      showToast({
        type: 'success',
        title: 'Berhasil',
        message: 'Permintaan transfer pasien telah ditolak.'
      })
      fetchData()
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Gagal',
        message: err.response?.data?.error || 'Terjadi kesalahan sistem.'
      })
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <PageHeader
          title="Verifikasi Transfer Pasien"
          description="Verifikasi permintaan transfer dari IPCLN"
          backHref="/ipcn/dashboard"
          breadcrumbs={[
            { label: 'Dashboard', href: '/ipcn/dashboard' },
            { label: 'Verifikasi Transfer' }
          ]}
        />

        <Card className="mt-6 bg-slate-900/95 border-slate-800">
          <CardHeader>
            <CardTitle>Daftar Permintaan Transfer</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <LoadingSkeleton count={5} rows={1} />
            ) : (
              <DataTable
                columns={[
                  {
                    key: 'rawat_inap.pasien.no_rm',
                    label: 'No. RM',
                    sortable: true,
                    className: 'font-medium',
                    render: (_: string, row: TransferRequest) => row.rawat_inap.pasien.no_rm
                  },
                  {
                    key: 'rawat_inap.pasien.nama',
                    label: 'Nama Pasien',
                    sortable: true,
                    className: 'font-semibold',
                    render: (_: string, row: TransferRequest) => row.rawat_inap.pasien.nama
                  },
                  {
                    key: 'ruangan_asal.nama',
                    label: 'Ruangan Asal',
                    sortable: true,
                    render: (_: string, row: TransferRequest) => row.ruangan_asal.nama
                  },
                  {
                    key: 'ruangan_tujuan.nama',
                    label: 'Ruangan Tujuan',
                    sortable: true,
                    render: (_: string, row: TransferRequest) => row.ruangan_tujuan.nama
                  },
                  {
                    key: 'tanggal_transfer',
                    label: 'Tgl Transfer',
                    sortable: true,
                    render: (value: string) => formatTanggal(value)
                  },
                  {
                    key: 'alasan',
                    label: 'Alasan',
                    render: (value: string | null) => value || '-'
                  },
                  {
                    key: 'id',
                    label: 'Aksi',
                    render: (value: string) => (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleVerify(value)}
                          className="bg-emerald-600 hover:bg-emerald-700 h-8 text-xs"
                        >
                          <CheckCircle size={14} className="mr-1" />
                          Verifikasi
                        </Button>
                        <Button
                          onClick={() => handleReject(value)}
                          className="bg-rose-600 hover:bg-rose-700 h-8 text-xs"
                        >
                          <XCircle size={14} className="mr-1" />
                          Tolak
                        </Button>
                      </div>
                    )
                  }
                ]}
                data={transferList}
                loading={loading}
                emptyMessage="Tidak ada permintaan transfer yang menunggu verifikasi"
                searchable
                searchPlaceholder="Cari nama atau no. RM"
                paginated
                pageSize={10}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
