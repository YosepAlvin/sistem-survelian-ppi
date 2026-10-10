"use client"

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/ui/PageHeader"
import { DataTable } from "@/components/ui/DataTable"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { StatCard } from "@/components/ui/StatCard"
import axios from "axios"
import { Users, Download, Pill } from 'lucide-react'
import { STATUS_TOOLTIP } from "@/lib/antibiotik-status"

// -- Types --------------------------------------------------------------------

type AntibiotikInfo = {
  nama: string
  dosis: string
  tgl_mulai: string
  hari_ke: number
  status: string
  efek_samping: string | null
  catatan_ipcn: string | null
  rekomendasi_ipcn: string | null
}

type PasienAktif = {
  id: string
  no_rm: string
  nama: string
  ruangan: string
  diagnosa: string
  tgl_masuk: string
  alat: string[]
  antibiotik: AntibiotikInfo | null
}

// -- Helpers ------------------------------------------------------------------

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'AKTIF':        return 'bg-green-50 text-green-700 border border-green-200'
    case 'AKAN_SELESAI': return 'bg-yellow-50 text-yellow-700 border border-yellow-200'
    case 'OVERDUE':      return 'bg-red-50 text-red-700 border border-red-200'
    case 'PERLU_REVIEW': return 'bg-purple-50 text-purple-700 border border-purple-200'
    case 'SELESAI':      return 'bg-gray-100 text-gray-700 border border-gray-200'
    default:             return 'bg-gray-100 text-gray-700 border border-gray-200'
  }
}

function statusLabelId(status: string): string {
  switch (status) {
    case 'AKTIF':        return 'Aktif'
    case 'AKAN_SELESAI': return 'Akan Selesai'
    case 'OVERDUE':      return 'Overdue'
    case 'PERLU_REVIEW': return 'Perlu Review'
    case 'SELESAI':      return 'Selesai'
    default:             return status
  }
}

// -- Page Component ------------------------------------------------------------

export default function PasienAktifMonitoringPage() {
  const [pasienList, setPasienList] = useState<PasienAktif[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRuangan, setSelectedRuangan] = useState("")
  const [isExporting, setIsExporting] = useState(false)
  const [selectedPasien, setSelectedPasien] = useState<PasienAktif | null>(null)

  useEffect(() => {
    fetchPasien()
  }, [])

  const fetchPasien = async () => {
    try {
      setLoading(true)
      const res = await axios.get("/api/monitoring/pasien-aktif")
      setPasienList(res.data)
    } catch (err) {
      console.error("Gagal mengambil data monitoring:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleExportExcel = () => {
    setIsExporting(true)
    setTimeout(() => {
      alert("Seluruh data pasien aktif berhasil di-export ke Excel.")
      setIsExporting(false)
    }, 1500)
  }

  const filteredPasien = selectedRuangan
    ? pasienList.filter(p => p.ruangan.trim().toLowerCase() === selectedRuangan.trim().toLowerCase())
    : pasienList

  const ruanganOptions = Array.from(new Set(pasienList.map(p => p.ruangan.trim())))

  // -- Table columns ----------------------------------------------------------
  const columns = [
    {
      key: 'no_rm' as const,
      label: 'No. RM',
    },
    {
      key: 'nama' as const,
      label: 'Nama Pasien',
      render: (value: string) => <div className="font-bold">{value}</div>,
    },
    {
      key: 'ruangan' as const,
      label: 'Ruangan',
      render: (value: string) => (
        <span className={`px-2 py-1 rounded text-xs font-semibold ${
          value === 'ICU' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
        }`}>
          {value}
        </span>
      ),
    },
    {
      key: 'diagnosa' as const,
      label: 'Diagnosa',
    },
    {
      key: 'tgl_masuk' as const,
      label: 'Tgl Masuk',
    },
    {
      key: 'alat' as const,
      label: 'Alat Terpasang',
      render: (value: string[]) => (
        <div className="flex flex-wrap gap-1">
          {value.length === 0
            ? <span className="text-gray-500 text-xs">-</span>
            : value.map(a => (
                <span key={a} className="px-1 bg-blue-50 text-blue-600 border border-blue-200 rounded text-[10px]">
                  {a}
                </span>
              ))
          }
        </div>
      ),
    },
    // -- New: Antibiotik Aktif column -----------------------------------------
    {
      key: 'antibiotik_nama',
      label: 'Antibiotik Aktif',
      render: (_value: AntibiotikInfo | null, row: PasienAktif) => {
        if (!row.antibiotik) return <span className="text-gray-500 text-xs">-</span>
        return (
          <div className="text-sm">
            <div className="font-semibold text-slate-900">{row.antibiotik.nama}</div>
            <div className="text-xs text-slate-600">{row.antibiotik.dosis}</div>
          </div>
        )
      },
    },
    {
      key: 'antibiotik_hari_ke',
      label: 'Hari Ke',
      render: (_value: AntibiotikInfo | null, row: PasienAktif) => {
        if (!row.antibiotik) return <span className="text-gray-500 text-xs">-</span>
        const color = row.antibiotik.hari_ke > 10 ? 'text-red-600 font-bold'
          : row.antibiotik.hari_ke > 7 ? 'text-yellow-600 font-bold'
          : 'text-slate-700'
        return <span className={`text-sm ${color}`}>{row.antibiotik.hari_ke}</span>
      },
    },
    {
      key: 'antibiotik_status',
      label: 'Status Antibiotik',
      render: (_value: AntibiotikInfo | null, row: PasienAktif) => {
        if (!row.antibiotik) return <span className="text-gray-500 text-xs">-</span>
        const tooltip = STATUS_TOOLTIP[row.antibiotik.status as keyof typeof STATUS_TOOLTIP] || ''
        return (
          <span
            title={tooltip}
            className={`px-2 py-1 rounded-full text-xs font-semibold cursor-default ${getStatusBadgeClass(row.antibiotik.status)}`}
          >
            {statusLabelId(row.antibiotik.status)}
          </span>
        )
      },
    },
    {
      key: 'id' as const,
      label: 'Aksi',
      render: (_value: string, row: PasienAktif) => (
        <button
          onClick={() => setSelectedPasien(row)}
          className="text-green-600 hover:text-green-800 hover:font-medium text-sm transition-colors"
        >
          Lihat Detail
        </button>
      ),
    },
  ]

  // -- Render -----------------------------------------------------------------
  return (
    <>
      <PageHeader
        title="Monitoring Pasien Aktif"
        description="Pantau data pasien yang sedang dirawat dan perangkat yang terpasang"
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <StatCard
          title="Total Pasien Aktif"
          value={pasienList.length}
          icon={<Users size={20} className="text-blue-600" />}
          description=""
          color="blue"
        />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Download size={20} className="text-green-600" />
              Export Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleExportExcel}
              disabled={isExporting}
              className="bg-green-600 hover:bg-green-700 w-full"
            >
              {isExporting ? "Memproses..." : "Export ke Excel"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Data Table Card */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Daftar Pasien Aktif</CardTitle>
            <select
              value={selectedRuangan}
              onChange={(e) => setSelectedRuangan(e.target.value)}
              className="p-2 border rounded text-sm"
            >
              <option value="">Semua Ruangan ({pasienList.length})</option>
              {ruanganOptions.map(ruangan => (
                <option key={ruangan} value={ruangan}>
                  {ruangan} ({pasienList.filter(p => p.ruangan === ruangan).length})
                </option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={filteredPasien}
            loading={loading}
            emptyMessage="Tidak ada pasien aktif di ruangan ini."
          />
        </CardContent>
      </Card>

      {/* -- Modal Detail Pasien Aktif -- */}
      {selectedPasien && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden max-h-[90vh] overflow-y-auto">

            {/* Modal Header */}
            <div className="bg-emerald-50 p-4 text-emerald-800 flex justify-between items-center border-b border-emerald-200">
              <h2 className="text-xl font-bold">Detail Pasien Aktif</h2>
              <button
                onClick={() => setSelectedPasien(null)}
                className="text-emerald-800 hover:text-emerald-600 text-2xl leading-none"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Patient info */}
              <div className="grid grid-cols-3 gap-2 text-sm border-b border-slate-200 pb-3">
                <span className="text-slate-600 font-semibold">Nama Pasien</span>
                <span className="col-span-2 font-bold text-slate-900">{selectedPasien.nama}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm border-b border-slate-200 pb-3">
                <span className="text-slate-600 font-semibold">No. RM</span>
                <span className="col-span-2 font-bold text-emerald-700">{selectedPasien.no_rm}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm border-b border-slate-200 pb-3">
                <span className="text-slate-600 font-semibold">Ruangan</span>
                <span className="col-span-2 text-slate-900">{selectedPasien.ruangan}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm border-b border-slate-200 pb-3">
                <span className="text-slate-600 font-semibold">Diagnosa</span>
                <span className="col-span-2 text-slate-900">{selectedPasien.diagnosa}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm border-b border-slate-200 pb-3">
                <span className="text-slate-600 font-semibold">Tgl Masuk</span>
                <span className="col-span-2 text-slate-900">{selectedPasien.tgl_masuk}</span>
              </div>

              {/* Alat terpasang */}
              <div className="space-y-2 border-b border-slate-200 pb-3">
                <span className="text-slate-600 font-semibold text-sm">Alat Terpasang:</span>
                <div className="flex flex-wrap gap-2">
                  {selectedPasien.alat.length === 0
                    ? <span className="text-sm italic text-gray-500">Tidak ada alat terpasang</span>
                    : selectedPasien.alat.map(a => (
                        <span key={a} className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-bold">
                          {a}
                        </span>
                      ))
                  }
                </div>
              </div>

              {/* Antibiotik section */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Pill size={15} className="text-purple-600" />
                  Antibiotik Aktif
                </h3>
                {!selectedPasien.antibiotik ? (
                  <p className="text-sm italic text-gray-500">Tidak ada terapi antibiotik aktif.</p>
                ) : (
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 space-y-3">
                    {/* Name + status */}
                    <div className="flex items-center justify-between">
                      <span className="text-slate-900 font-bold text-base">
                        {selectedPasien.antibiotik.nama}
                      </span>
                      <span
                        title={STATUS_TOOLTIP[selectedPasien.antibiotik.status as keyof typeof STATUS_TOOLTIP] || ''}
                        className={`px-2 py-1 rounded-full text-xs font-semibold cursor-default ${getStatusBadgeClass(selectedPasien.antibiotik.status)}`}
                      >
                        {statusLabelId(selectedPasien.antibiotik.status)}
                      </span>
                    </div>

                    {/* Details grid */}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-slate-600 text-xs">Dosis</p>
                        <p className="text-slate-900 font-medium">{selectedPasien.antibiotik.dosis}</p>
                      </div>
                      <div>
                        <p className="text-slate-600 text-xs">Tanggal Mulai</p>
                        <p className="text-slate-900 font-medium">{selectedPasien.antibiotik.tgl_mulai}</p>
                      </div>
                      <div>
                        <p className="text-slate-600 text-xs">Hari Ke</p>
                        <p className={`font-bold text-base ${
                          selectedPasien.antibiotik.hari_ke > 10 ? 'text-red-600'
                          : selectedPasien.antibiotik.hari_ke > 7 ? 'text-yellow-600'
                          : 'text-slate-900'
                        }`}>
                          {selectedPasien.antibiotik.hari_ke}
                        </p>
                      </div>
                      {selectedPasien.antibiotik.efek_samping && (
                        <div>
                          <p className="text-slate-600 text-xs">Efek Samping</p>
                          <p className="text-orange-700 font-medium">{selectedPasien.antibiotik.efek_samping}</p>
                        </div>
                      )}
                    </div>

                    {/* IPCN review notes */}
                    {(selectedPasien.antibiotik.catatan_ipcn || selectedPasien.antibiotik.rekomendasi_ipcn) && (
                      <div className="border-t border-purple-200 pt-3 space-y-2">
                        {selectedPasien.antibiotik.catatan_ipcn && (
                          <div>
                            <p className="text-slate-600 text-xs mb-1">Catatan IPCN</p>
                            <p className="text-slate-800 text-sm">{selectedPasien.antibiotik.catatan_ipcn}</p>
                          </div>
                        )}
                        {selectedPasien.antibiotik.rekomendasi_ipcn && (
                          <div>
                            <p className="text-slate-600 text-xs mb-1">Rekomendasi IPCN</p>
                            <p className="text-slate-800 text-sm">{selectedPasien.antibiotik.rekomendasi_ipcn}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-50 border-t border-slate-200 p-4 flex justify-end">
              <Button onClick={() => setSelectedPasien(null)} variant="outline">Tutup</Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
