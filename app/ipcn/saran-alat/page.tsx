"use client"

import React, { useState, useEffect, Suspense, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/ui/PageHeader"
import { DataTable } from "@/components/ui/DataTable"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { useToast } from "@/components/ui/Toast"
import axios from "axios"
import { useSearchParams } from "next/navigation"

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

function SaranAlatContent() {
  const { showToast } = useToast()
  const searchParams = useSearchParams()
  const alatIdFromQuery = searchParams.get("alatId")
  
  const [suggestions, setSuggestions] = useState<SaranAlat[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAlat, setSelectedAlat] = useState<AlatTerpasang | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [selectedSaran, setSelectedSaran] = useState<SaranAlat | null>(null)
  const [newStatus, setNewStatus] = useState("SELESAI")
  const [tanggapan, setTanggapan] = useState("")
  const [jenisSaran, setJenisSaran] = useState("GANTI_ALAT")
  const [catatan, setCatatan] = useState("")
  const [activeAlat, setActiveAlat] = useState<AlatTerpasang[]>([])
  const [ruanganList, setRuanganList] = useState<Ruangan[]>([])
  const [selectedRuanganId, setSelectedRuanganId] = useState<string>("")

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [saranRes, alatRes, ruanganRes] = await Promise.all([
        axios.get("/api/alat-saran"),
        axios.get("/api/monitoring/pasien-aktif"),
        axios.get("/api/ruangan")
      ])
      console.log("Saran Res:", saranRes.data)
      console.log("Alat Res:", alatRes.data)
      console.log("Ruangan Res:", ruanganRes.data)
      setSuggestions(saranRes.data)
      setRuanganList(ruanganRes.data)
      
      const alatList: AlatTerpasang[] = []
      if (Array.isArray(alatRes.data)) {
        alatRes.data.forEach((rawatInap: any) => {
          if (Array.isArray(rawatInap.alat_terpasang)) {
            rawatInap.alat_terpasang.forEach((alat: any) => {
              if (alat.masih_terpasang) {
                alatList.push({
                  ...alat,
                  rawat_inap: {
                    id: rawatInap.rawat_inap?.id || rawatInap.id,
                    pasien: rawatInap.rawat_inap?.pasien || {
                      id: rawatInap.id,
                      nama: rawatInap.nama,
                      no_rm: rawatInap.no_rm,
                    },
                    ruangan: rawatInap.rawat_inap?.ruangan || rawatInap.ruanganObj
                  }
                })
              }
            })
          }
        })
      }
      setActiveAlat(alatList)
      console.log("Active Alat:", alatList)
      console.log("Ruangan List:", ruanganRes.data)

      if (alatIdFromQuery) {
        const preselectedAlat = alatList.find(a => a.id === parseInt(alatIdFromQuery))
        if (preselectedAlat) {
          setSelectedAlat(preselectedAlat)
          setSelectedRuanganId(preselectedAlat.rawat_inap.ruangan.id.toString())
        }
      }
    } catch (err) {
      console.error("Gagal mengambil data:", err)
    } finally {
      setLoading(false)
    }
  }, [alatIdFromQuery])

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

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (alatIdFromQuery && !loading) {
      setShowModal(true)
    }
  }, [alatIdFromQuery, loading])

  const filteredAlat = activeAlat.filter(alat => {
    const matches = alat.rawat_inap.ruangan.id.toString() === selectedRuanganId
    console.log("Checking alat:", alat, "Matches:", matches, "Ruangan ID:", alat.rawat_inap.ruangan.id, "Selected ID:", selectedRuanganId)
    return matches
  })

  const handleSubmitSaran = async () => {
    if (!selectedAlat || !catatan) {
      showToast({ type: "error", title: "Gagal", message: "Pilih alat dan isi catatan!" })
      return
    }

    try {
      await axios.post("/api/alat-saran", {
        alatTerpasangId: selectedAlat.id,
        jenisSaran,
        catatan,
      })
      showToast({ type: "success", title: "Berhasil", message: "Saran berhasil dikirim!" })
      setShowModal(false)
      setCatatan("")
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
          Ubah Status
        </Button>
      ),
    },
  ]

  return (
    <>
      <PageHeader title="Saran Alat Kesehatan" description="Berikan saran ke IPCLN tentang alat yang perlu diganti atau dilepas" />

      <div className="flex justify-end mb-4">
        <Button onClick={() => setShowModal(true)} className="bg-blue-600 hover:bg-blue-700">
          Berikan Saran
        </Button>
      </div>

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

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
            <div className="bg-blue-600 p-4 text-white flex justify-between items-center">
              <h2 className="text-xl font-bold">Berikan Saran Alat</h2>
              <button onClick={() => setShowModal(false)} className="text-white hover:text-gray-200 text-2xl">&times;</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Pilih Ruangan</label>
                <select
                  value={selectedRuanganId}
                  onChange={(e) => {
                    setSelectedRuanganId(e.target.value)
                    setSelectedAlat(null)
                  }}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="">-- Pilih Ruangan --</option>
                  {ruanganList.map((ruangan) => (
                    <option key={ruangan.id} value={ruangan.id}>
                      {ruangan.nama}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Pilih Alat</label>
                <select
                  value={selectedAlat?.id || ""}
                  onChange={(e) => {
                    const alat = filteredAlat.find(a => a.id === parseInt(e.target.value))
                    setSelectedAlat(alat || null)
                  }}
                  className="w-full p-2 border rounded-lg"
                  disabled={!selectedRuanganId}
                >
                  <option value="">-- Pilih Alat --</option>
                  {filteredAlat.map((alat) => (
                    <option key={alat.id} value={alat.id}>
                      {alat.jenis_alat} - {alat.rawat_inap.pasien.nama} (RM {alat.rawat_inap.pasien.no_rm})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Jenis Saran</label>
                <select
                  value={jenisSaran}
                  onChange={(e) => setJenisSaran(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="GANTI_ALAT">Ganti Alat</option>
                  <option value="LEPAS_ALAT">Lepas Alat</option>
                  <option value="CATATAN">Catatan</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Catatan</label>
                <textarea
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                  rows={4}
                  placeholder="Jelaskan alasan saran ini..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowModal(false)}>Batal</Button>
                <Button onClick={handleSubmitSaran} className="bg-blue-600 hover:bg-blue-700">Kirim Saran</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showStatusModal && selectedSaran && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
            <div className="bg-green-600 p-4 text-white flex justify-between items-center">
              <h2 className="text-xl font-bold">Ubah Status Saran</h2>
              <button onClick={() => setShowStatusModal(false)} className="text-white hover:text-gray-200 text-2xl">&times;</button>
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
                <label className="block text-sm font-semibold mb-1">Tanggapan (opsional)</label>
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
                <Button onClick={handleUpdateStatus} className="bg-green-600 hover:bg-green-700">Simpan</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default function SaranAlatPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <SaranAlatContent />
    </Suspense>
  )
}
