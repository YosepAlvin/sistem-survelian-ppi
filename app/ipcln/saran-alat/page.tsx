"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/ui/PageHeader"
import { DataTable } from "@/components/ui/DataTable"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { useToast } from "@/components/ui/Toast"
import axios from "axios"

interface Pasien {
  id: number
  no_rm: string
  nama: string
}

interface Ruangan {
  id: number
  nama: string
}

interface RawatInap {
  id: number
  pasien: Pasien
  ruangan: Ruangan
}

interface AlatTerpasang {
  id: number
  jenis_alat: string
  tanggal_pasang: string
  tanggal_lepas: string | null
  masih_terpasang: boolean
  rawat_inap: RawatInap
}

interface SaranAlat {
  id: number
  jenis_saran: string
  catatan: string
  status: string
  created_at: string
  alatTerpasang: AlatTerpasang
  creator?: { id: number; name: string }
  tanggapan?: string | null
}

export default function IPCLNSaranAlatPage() {
  const { showToast } = useToast()
  const [suggestions, setSuggestions] = useState<SaranAlat[]>([])
  const [loading, setLoading] = useState(true)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [selectedSaran, setSelectedSaran] = useState<SaranAlat | null>(null)
  const [newStatus, setNewStatus] = useState("SELESAI")
  const [tanggapan, setTanggapan] = useState("")

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const res = await axios.get("/api/alat-saran")
      setSuggestions(res.data)
    } catch (err) {
      console.error("Gagal mengambil data:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleUpdateStatus = async () => {
    if (!selectedSaran) return
    try {
      await axios.put("/api/alat-saran", {
        id: selectedSaran.id,
        status: newStatus,
        tanggapan: tanggapan || null
      })
      showToast({ type: "success", title: "Berhasil", message: "Status berhasil diperbarui!" })
      setShowStatusModal(false)
      setSelectedSaran(null)
      setTanggapan("")
      fetchData()
    } catch (err: any) {
      showToast({ type: "error", title: "Gagal", message: err.response?.data?.error || err.message })
    }
  }

  const columns = [
    {
      key: "created_at" as const,
      label: "Tanggal",
      render: (value: string) => new Date(value).toLocaleDateString("id-ID"),
    },
    {
      key: "alatTerpasang" as const,
      label: "Pasien & Alat",
      render: (value: AlatTerpasang) => (
        <div>
          <div className="font-semibold">{value.rawat_inap.pasien.nama}</div>
          <div className="text-xs text-gray-500">RM: {value.rawat_inap.pasien.no_rm} - {value.jenis_alat}</div>
        </div>
      ),
    },
    {
      key: "jenis_saran" as const,
      label: "Jenis Saran",
      render: (value: string) => {
        const label = value === "GANTI_ALAT" ? "Ganti Alat" : value === "LEPAS_ALAT" ? "Lepas Alat" : "Catatan"
        const color = value === "GANTI_ALAT" ? "bg-yellow-100 text-yellow-800" : value === "LEPAS_ALAT" ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"
        return <span className={`px-2 py-1 rounded text-xs font-semibold ${color}`}>{label}</span>
      },
    },
    {
      key: "catatan" as const,
      label: "Catatan",
      render: (value: string) => <span className="text-sm">{value}</span>,
    },
    {
      key: "tanggapan" as const,
      label: "Tanggapan",
      render: (value: string) => value || "-",
    },
    {
      key: "status" as const,
      label: "Status",
      render: (value: string) => {
        let color = "bg-gray-100 text-gray-800"
        if (value === "PENDING") color = "bg-orange-100 text-orange-800"
        if (value === "SELESAI") color = "bg-green-100 text-green-800"
        if (value === "DITOLAK") color = "bg-red-100 text-red-800"
        return <span className={`px-2 py-1 rounded text-xs font-semibold ${color}`}>{value}</span>
      },
    },
    {
      key: "creator" as const,
      label: "Diberikan Oleh",
      render: (value: { name: string }) => value?.name || "-",
    },
    {
      key: "actions" as const,
      label: "Aksi",
      render: (_: any, row: SaranAlat) => (
        <Button
          onClick={() => {
            setSelectedSaran(row)
            setNewStatus(row.status)
            setTanggapan(row.tanggapan || "")
            setShowStatusModal(true)
          }}
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 text-xs"
        >
          Beri Tanggapan
        </Button>
      ),
    },
  ]

  return (
    <>
      <PageHeader title="Saran Alat dari IPCN" description="Lihat dan tanggapi saran alat dari IPCN" />

      <Card>
        <CardHeader>
          <CardTitle>Daftar Saran Alat</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={suggestions}
            loading={loading}
            emptyMessage="Belum ada saran alat"
            searchable
            searchPlaceholder="Cari pasien atau alat..."
          />
        </CardContent>
      </Card>

      {showStatusModal && selectedSaran && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
            <div className="bg-purple-600 p-4 text-slate-900 flex justify-between items-center">
              <h2 className="text-xl font-bold">Beri Tanggapan</h2>
              <button onClick={() => setShowStatusModal(false)} className="text-slate-900 hover:text-gray-200 text-2xl">&times;</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <div className="text-sm text-gray-600"><span className="font-semibold">Pasien:</span> {selectedSaran.alatTerpasang.rawat_inap.pasien.nama} (RM {selectedSaran.alatTerpasang.rawat_inap.pasien.no_rm})</div>
                <div className="text-sm text-gray-600"><span className="font-semibold">Alat:</span> {selectedSaran.alatTerpasang.jenis_alat}</div>
                <div className="text-sm text-gray-600"><span className="font-semibold">Jenis Saran:</span> {selectedSaran.jenis_saran}</div>
                <div className="text-sm text-gray-600"><span className="font-semibold">Catatan:</span> {selectedSaran.catatan}</div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold mb-1">Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="PENDING">PENDING</option>
                  <option value="SELESAI">SELESAI</option>
                  <option value="DITOLAK">DITOLAK</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Tanggapan</label>
                <textarea
                  value={tanggapan}
                  onChange={(e) => setTanggapan(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                  rows={4}
                  placeholder="Tambahkan tanggapan..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowStatusModal(false)}>Batal</Button>
                <Button onClick={handleUpdateStatus} className="bg-purple-600 hover:bg-purple-700">Simpan</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
