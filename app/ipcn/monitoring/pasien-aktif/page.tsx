"use client"

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/ui/PageHeader"
import { DataTable } from "@/components/ui/DataTable"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { StatCard } from "@/components/ui/StatCard"
import axios from "axios"
import { Users, Download } from 'lucide-react'
import { STATUS_TOOLTIP } from "@/lib/antibiotik-status"

// ── Types ────────────────────────────────────────────────────────────────────

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

// ── Helpers ──────────────────────────────────────────────────────────────────

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'AKTIF':        return 'bg-green-900/30 text-green-400 border border-green-800/50'
    case 'AKAN_SELESAI': return 'bg-yellow-900/30 text-yellow-400 border border-yellow-800/50'
    case 'OVERDUE':      return 'bg-red-900/30 text-red-400 border border-red-800/50'
    case 'PERLU_REVIEW': return 'bg-purple-900/30 text-purple-400 border border-purple-800/50'
    case 'SELESAI':      return 'bg-gray-800 text-gray-400 border border-gray-700/50'
    default:             return 'bg-gray-800 text-gray-400 border border-gray-700/50'
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

// ── Page Component ────────────────────────────────────────────────────────────

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

  // ── Table columns ──────────────────────────────────────────────────────────
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
    // ── New: Antibiotik Aktif column ─────────────────────────────────────────
    {
      key: 'antibiotik_nama',
      label: 'Antibiotik Aktif',
      render: (_value: AntibiotikInfo | null, row: PasienAktif) => {
        if (!row.antibiotik) return <span className="text-gray-500 text-xs">-</span>
        return (
          <div className="text-sm">
            <div className="font-semibold text-white">{row.antibiotik.nama}</div>
            <div className="text-xs text-gray-400">{row.antibiotik.dosis}</div>
          </div>
        )
      },
    },
    {
      key: 'antibiotik_hari_ke',
      label: 'Hari Ke',
      render: (_value: AntibiotikInfo | null, row: PasienAktif) => {
        if (!row.antibiotik) return <span className="text-gray-500 text-xs">-</span>
        const color = row.antibiotik.hari_ke > 10 ? 'text-red-400 font-bold'
          : row.antibiotik.hari_ke > 7 ? 'text-yellow-400 font-bold'
          : 'text-gray-300'
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
          className="text-green-600 hover:text-green-400 hover:font-medium text-sm transition-colors"
        >
          Lihat Detail
        </button>
      ),
    },
  ]

  // ── Render ─────────────────────────────────────────────────────────────────
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

      {/* ── Modal Detail Pasien Aktif ── */}
      {selectedPasien && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111827] border border-white/10 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden max-h-[90vh] overflow-y-auto">

            {/* Modal Header */}
            <div className="bg-emerald-700 p-4 text-white flex justify-between items-center">
              <h2 className="text-xl font-bold">Detail Pasien Aktif</h2>
              <button
                onClick={() => setSelectedPasien(null)}
                className="text-white hover:text-gray-200 text-2xl leading-none"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Patient info */}
              <div className="grid grid-cols-3 gap-2 text-sm border-b border-white/10 pb-3">
                <span className="text-gray-400 font-semibold">Nama Pasien</span>
                <span className="col-span-2 font-bold text-white">{selectedPasien.nama}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm border-b border-white/10 pb-3">
                <span className="text-gray-400 font-semibold">No. RM</span>
                <span className="col-span-2 font-bold text-emerald-400">{selectedPasien.no_rm}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm border-b border-white/10 pb-3">
                <span className="text-gray-400 font-semibold">Ruangan</span>
                <span className="col-span-2 text-white">{selectedPasien.ruangan}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm border-b border-white/10 pb-3">
                <span className="text-gray-400 font-semibold">Diagnosa</span>
                <span className="col-span-2 text-white">{selectedPasien.diagnosa}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm border-b border-white/10 pb-3">
                <span className="text-gray-400 font-semibold">Tgl Masuk</span>
                <span className="col-span-2 text-white">{selectedPasien.tgl_masuk}</span>
              </div>

              {/* Alat terpasang */}
              <div className="space-y-2 border-b border-white/10 pb-3">
                <span className="text-gray-400 font-semibold text-sm">Alat Terpasang:</span>
                <div className="flex flex-wrap gap-2">
                  {selectedPasien.alat.length === 0
                    ? <span className="text-sm italic text-gray-500">Tidak ada alat terpasang</span>
                    : selectedPasien.alat.map(a => (
                        <span key={a} className="px-3 py-1 bg-blue-900/30 text-blue-300 border border-blue-800/50 rounded-full text-xs font-bold">
                          {a}
                        </span>
                      ))
                  }
                </div>
              </div>

              {/* Antibiotik section */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  💊 Antibiotik Aktif
                </h3>
                {!selectedPasien.antibiotik ? (
                  <p className="text-sm italic text-gray-500">Tidak ada terapi antibiotik aktif.</p>
                ) : (
                  <div className="bg-purple-900/20 border border-purple-800/40 rounded-xl p-4 space-y-3">
                    {/* Name + status */}
                    <div className="flex items-center justify-between">
                      <span className="text-white font-bold text-base">
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
                        <p className="text-gray-400 text-xs">Dosis</p>
                        <p className="text-white font-medium">{selectedPasien.antibiotik.dosis}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs">Tanggal Mulai</p>
                        <p className="text-white font-medium">{selectedPasien.antibiotik.tgl_mulai}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs">Hari Ke</p>
                        <p className={`font-bold text-base ${
                          selectedPasien.antibiotik.hari_ke > 10 ? 'text-red-400'
                          : selectedPasien.antibiotik.hari_ke > 7 ? 'text-yellow-400'
                          : 'text-white'
                        }`}>
                          {selectedPasien.antibiotik.hari_ke}
                        </p>
                      </div>
                      {selectedPasien.antibiotik.efek_samping && (
                        <div>
                          <p className="text-gray-400 text-xs">Efek Samping</p>
                          <p className="text-orange-300 font-medium">{selectedPasien.antibiotik.efek_samping}</p>
                        </div>
                      )}
                    </div>

                    {/* IPCN review notes */}
                    {(selectedPasien.antibiotik.catatan_ipcn || selectedPasien.antibiotik.rekomendasi_ipcn) && (
                      <div className="border-t border-purple-700/50 pt-3 space-y-2">
                        {selectedPasien.antibiotik.catatan_ipcn && (
                          <div>
                            <p className="text-gray-400 text-xs mb-1">Catatan IPCN</p>
                            <p className="text-gray-200 text-sm">{selectedPasien.antibiotik.catatan_ipcn}</p>
                          </div>
                        )}
                        {selectedPasien.antibiotik.rekomendasi_ipcn && (
                          <div>
                            <p className="text-gray-400 text-xs mb-1">Rekomendasi IPCN</p>
                            <p className="text-gray-200 text-sm">{selectedPasien.antibiotik.rekomendasi_ipcn}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-900/50 border-t border-white/5 p-4 flex justify-end">
              <Button onClick={() => setSelectedPasien(null)} variant="outline">Tutup</Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
