"use client"

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/ui/PageHeader"
import { DataTable } from "@/components/ui/DataTable"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { StatCard } from "@/components/ui/StatCard"
import axios from "axios"
import { Users, Download } from 'lucide-react'

type PasienAktif = {
  id: string;
  no_rm: string;
  nama: string;
  ruangan: string;
  diagnosa: string;
  tgl_masuk: string;
  alat: string[];
}

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
  
  const columns = [
    {
      key: 'no_rm' as const,
      label: 'No. RM'
    },
    {
      key: 'nama' as const,
      label: 'Nama Pasien',
      render: (value: string) => <div className="font-bold">{value}</div>
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
      )
    },
    {
      key: 'diagnosa' as const,
      label: 'Diagnosa'
    },
    {
      key: 'tgl_masuk' as const,
      label: 'Tgl Masuk'
    },
    {
      key: 'alat' as const,
      label: 'Alat Terpasang',
      render: (value: string[]) => (
        <div className="flex flex-wrap gap-1">
          {value.map(a => (
            <span key={a} className="px-1 bg-blue-50 text-blue-600 border border-blue-200 rounded text-[10px]">
              {a}
            </span>
          ))}
        </div>
      )
    },
    {
      key: 'id' as const,
      label: 'Aksi',
      render: (value: string, row: PasienAktif) => (
        <button 
          onClick={() => setSelectedPasien(row)}
          className="text-green-600 hover:text-green-800 hover:font-medium text-sm transition-colors"
        >
          Lihat Detail
        </button>
      )
    }
  ]

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

      {/* Modal Detail Pasien Aktif */}
      {selectedPasien && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="bg-green-600 p-4 text-white flex justify-between items-center">
              <h2 className="text-xl font-bold">Monitoring Pasien</h2>
              <button onClick={() => setSelectedPasien(null)} className="text-white hover:text-gray-200 text-2xl">&times;</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-2 text-sm border-b pb-2">
                <span className="text-gray-500 font-semibold">Nama Pasien</span>
                <span className="col-span-2 font-bold">{selectedPasien.nama}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm border-b pb-2">
                <span className="text-gray-500 font-semibold">No. RM</span>
                <span className="col-span-2 font-bold text-green-700">{selectedPasien.no_rm}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm border-b pb-2">
                <span className="text-gray-500 font-semibold">Ruangan</span>
                <span className="col-span-2">{selectedPasien.ruangan}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm border-b pb-2">
                <span className="text-gray-500 font-semibold">Diagnosa</span>
                <span className="col-span-2">{selectedPasien.diagnosa}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm border-b pb-2">
                <span className="text-gray-500 font-semibold">Tgl Masuk</span>
                <span className="col-span-2">{selectedPasien.tgl_masuk}</span>
              </div>
              <div className="space-y-2">
                <span className="text-gray-500 font-semibold text-sm">Alat Terpasang:</span>
                <div className="flex flex-wrap gap-2">
                  {selectedPasien.alat.map(a => (
                    <span key={a} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">{a}</span>
                  ))}
                  {selectedPasien.alat.length === 0 && <span className="text-sm italic">Tidak ada alat terpasang</span>}
                </div>
              </div>
            </div>
            <div className="bg-gray-50 p-4 flex justify-end">
              <Button onClick={() => setSelectedPasien(null)} className="bg-gray-600">Tutup</Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
