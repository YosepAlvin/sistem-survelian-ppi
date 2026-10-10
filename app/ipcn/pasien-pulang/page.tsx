"use client"

import React, { useState, useEffect } from 'react'
import { PageHeader } from "@/components/ui/PageHeader"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { DataTable } from "@/components/ui/DataTable"
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton"
import axios from "axios"
import { formatTanggal } from '@/lib/date-utils'

type PasienPulang = {
  id: string;
  no_rm: string;
  nama: string;
  diagnosa: string;
  tgl_masuk: string;
  tgl_keluar: string;
  kondisi_keluar: string;
  umur: string;
  jk: string;
  alamat: string;
  ruangan: string;
  jumlah_infeksi: number;
  jumlah_alat: number;
}

export default function PasienPulangPage() {
  const [pasienList, setPasienList] = useState<PasienPulang[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await axios.get("/api/pasien-pulang")
      setPasienList(res.data)
    } catch (err) {
      console.error("Failed to fetch data:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-slate-200 bg-white/95 px-6 py-8 shadow-xl shadow-slate-200/50">
          <PageHeader
            title="Pasien yang Sudah Pulang"
            description="Daftar pasien yang sudah selesai perawatan"
            backHref="/ipcn/dashboard"
            breadcrumbs={[
              { label: "Dashboard", href: "/ipcn/dashboard" },
              { label: "Pasien Pulang" }
            ]}
          />
        </div>

        <Card className="mt-6 bg-white/95 border-slate-200">
          <CardHeader>
            <CardTitle>Daftar Pasien Pulang</CardTitle>
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
                    key: 'tgl_keluar',
                    label: 'Tgl Keluar',
                    sortable: true,
                    render: (value: string) => formatTanggal(value)
                  },
                  {
                    key: 'jumlah_infeksi',
                    label: 'Jumlah Infeksi',
                    sortable: true
                  },
                  {
                    key: 'jumlah_alat',
                    label: 'Jumlah Alat',
                    sortable: true
                  }
                ]}
                data={pasienList}
                loading={loading}
                emptyMessage="Belum ada pasien yang pulang"
                searchable
                searchPlaceholder="Cari Nama, No. RM..."
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
