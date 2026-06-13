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

type PasienPulang = {
  id: string
  no_rm: string
  nama: string
  diagnosa: string
  tgl_masuk: string
  ruangan: string
}

export default function VerifikasiPulangPage() {
  const { showToast } = useToast()
  const [pasienList, setPasienList] = useState<PasienPulang[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    try {
      setLoading(true)
      const allPasien = await axios.get('/api/pasien')
      const pendingPulang = allPasien.data.filter((p: any) => p.status_pulang === 'PENDING')
      setPasienList(pendingPulang)
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
      await axios.put(`/api/rawat-inap/${id}`, {
        action: 'VERIFY_PULANG',
        kondisi_keluar: 'Sembuh'
      })
      showToast({
        type: 'success',
        title: 'Berhasil',
        message: 'Pasien telah diverifikasi dan dipulangkan.'
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
      await axios.put(`/api/rawat-inap/${id}`, {
        action: 'REJECT_PULANG'
      })
      showToast({
        type: 'success',
        title: 'Berhasil',
        message: 'Permintaan pulang pasien telah ditolak.'
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
          title="Verifikasi Pulang Pasien"
          description="Verifikasi permintaan pulang dari IPCLN"
          backHref="/ipcn/dashboard"
          breadcrumbs={[
            { label: 'Dashboard', href: '/ipcn/dashboard' },
            { label: 'Verifikasi Pulang' }
          ]}
        />

        <Card className="mt-6 bg-slate-900/95 border-slate-800">
          <CardHeader>
            <CardTitle>Daftar Permintaan Pulang</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <LoadingSkeleton count={5} rows={1} />
            ) : (
              <DataTable
                columns={[
                  {
                    key: 'no_rm',
                    label: 'No. RM',
                    sortable: true,
                    className: 'font-medium'
                  },
                  {
                    key: 'nama',
                    label: 'Nama Pasien',
                    sortable: true,
                    className: 'font-semibold'
                  },
                  {
                    key: 'diagnosa',
                    label: 'Diagnosa',
                    sortable: true
                  },
                  {
                    key: 'ruangan',
                    label: 'Ruangan',
                    sortable: true
                  },
                  {
                    key: 'tgl_masuk',
                    label: 'Tgl Masuk',
                    sortable: true,
                    render: (value: string) => formatTanggal(value)
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
                data={pasienList}
                loading={loading}
                emptyMessage="Tidak ada permintaan pulang yang menunggu verifikasi"
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
