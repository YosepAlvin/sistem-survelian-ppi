"use client"

import React, { useState, useEffect, useCallback } from 'react'
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/ui/PageHeader"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { DataTable } from "@/components/ui/DataTable"
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton"
import { FormField, FormInput, FormSelect, FormTextarea } from "@/components/ui/FormField"
import { StatCard } from "@/components/ui/StatCard"
import { Plus } from 'lucide-react'
import axios from "axios"
import { useToast } from "@/components/ui/Toast"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"
import { CrudModal } from "@/components/ui/CrudModal"

type OperasiData = {
  id: string;
  tanggal: string;
  pasien: string;
  no_rm: string;
  ruangan?: string;
  diagnosa: string;
  jenis: string;
  asa: string;
  t_time: number;
  skor_risiko: number;
  status_ido?: string;
  ido_id?: string | null;
  case_status?: string | null;
}

type PasienData = {
  id: string;
  no_rm: string;
  nama: string;
  ruangan: string;
}

export default function OperasiPage() {
  const { showToast } = useToast()
  const [dataList, setDataList] = useState<OperasiData[]>([])
  const [pasienList, setPasienList] = useState<PasienData[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedOperasi, setSelectedOperasi] = useState<OperasiData | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<OperasiData | null>(null)
  const [closeCaseConfirm, setCloseCaseConfirm] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    id: '',
    no_rm: '',
    pasien: '',
    tanggal: new Date().toISOString().split('T')[0],
    diagnosa: '',
    jenis: 'BERSIH',
    asa: '1',
    t_time: 1
  })

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [operasiRes, pasienRes] = await Promise.all([
        axios.get("/api/operasi"),
        axios.get("/api/pasien")
      ])
      setDataList(operasiRes.data)
      setPasienList(pasienRes.data.map((ri: any) => ({
        id: ri.id,
        no_rm: ri.no_rm,
        nama: ri.nama,
        ruangan: ri.ruangan || "-"
      })))
    } catch (error) {
      console.error("Error fetching data:", error)
      showToast({ type: "error", title: "Gagal", message: "Gagal memuat data" })
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleNoRmChange = useCallback((noRm: string) => {
    const foundPasien = pasienList.find(p => p.no_rm === noRm)
    setFormData(prev => ({
      ...prev,
      no_rm: noRm,
      pasien: foundPasien?.nama || prev.pasien
    }))
  }, [pasienList])

  const resetForm = useCallback(() => {
    setFormData({
      id: '',
      no_rm: '',
      pasien: '',
      tanggal: new Date().toISOString().split('T')[0],
      diagnosa: '',
      jenis: 'BERSIH',
      asa: '1',
      t_time: 1
    })
    setSelectedOperasi(null)
    setIsEditing(false)
  }, [])

  const handleSaveOperasi = useCallback(async () => {
    try {
      setIsSaving(true)
      if (isEditing && formData.id) {
        await axios.put(`/api/operasi/${formData.id}`, {
          no_rm: formData.no_rm,
          pasien: formData.pasien,
          dx_operasi: formData.diagnosa,
          jenis_operasi: formData.jenis,
          asa: formData.asa,
          t_time: formData.t_time,
          tanggal_operasi: formData.tanggal
        })
        showToast({ type: "success", title: "Berhasil", message: "Data operasi berhasil diperbarui" })
      } else {
        await axios.post("/api/operasi", {
          no_rm: formData.no_rm,
          pasien: formData.pasien,
          dx_operasi: formData.diagnosa,
          jenis_operasi: formData.jenis,
          asa: formData.asa,
          t_time: formData.t_time,
          tanggal_operasi: formData.tanggal
        })
        showToast({ type: "success", title: "Berhasil", message: "Data operasi berhasil disimpan" })
      }
      setShowForm(false)
      setIsEditing(false)
      resetForm()
      fetchData()
    } catch (error: any) {
      console.error("Error saving operasi:", error)
      showToast({ type: "error", title: "Gagal", message: error.response?.data?.error || error.message })
    } finally {
      setIsSaving(false)
    }
  }, [isEditing, formData, resetForm, fetchData, showToast])

  const handleEdit = useCallback((operasi: OperasiData) => {
    setSelectedOperasi(operasi)
    setIsEditing(true)
    setFormData({
      id: operasi.id,
      no_rm: operasi.no_rm,
      pasien: operasi.pasien,
      tanggal: operasi.tanggal,
      diagnosa: operasi.diagnosa,
      jenis: operasi.jenis,
      asa: operasi.asa,
      t_time: operasi.t_time
    })
    setShowForm(true)
  }, [])

  const handleDelete = useCallback((id: string) => {
    const target = dataList.find(op => op.id === id)
    if (target) {
      setDeleteConfirm(target)
    }
  }, [dataList])

  const confirmDelete = useCallback(async () => {
    if (!deleteConfirm) return
    try {
      await axios.delete(`/api/operasi/${deleteConfirm.id}`)
      showToast({ type: "success", title: "Berhasil", message: "Data operasi berhasil dihapus" })
      fetchData()
    } catch (error: any) {
      console.error("Error deleting operasi:", error)
      showToast({ type: "error", title: "Gagal", message: error.response?.data?.error || error.message })
    } finally {
      setDeleteConfirm(null)
    }
  }, [deleteConfirm, fetchData, showToast])

  const handleCloseCase = useCallback((idoId: string) => {
    setCloseCaseConfirm(idoId)
  }, [])

  const confirmCloseCase = useCallback(async () => {
    if (!closeCaseConfirm) return
    try {
      await axios.put("/api/surveilans-ido", { id: closeCaseConfirm, action: "CLOSE_CASE" })
      showToast({ type: "success", title: "Berhasil", message: "Kasus IDO ditandai selesai" })
      fetchData()
    } catch (error: any) {
      console.error("Error closing IDO case:", error)
      showToast({ type: "error", title: "Gagal", message: error.response?.data?.error || error.message })
    } finally {
      setCloseCaseConfirm(null)
    }
  }, [closeCaseConfirm, fetchData, showToast])

  const getBadgeColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-50 text-yellow-700 border border-yellow-200"
      case "VERIFIED":
      case "DISETUJUI":
        return "bg-green-50 text-green-700 border border-green-200"
      case "REJECTED":
      case "DITOLAK":
        return "bg-red-50 text-red-700 border border-red-200"
      case "AKTIF":
        return "bg-orange-50 text-orange-700 border border-orange-200"
      case "SELESAI":
        return "bg-blue-50 text-blue-700 border border-blue-200"
      case "BERSIH":
        return "bg-blue-50 text-blue-700 border border-blue-200"
      case "BERSIH_TERCEMAR":
        return "bg-cyan-50 text-cyan-700 border border-cyan-200"
      case "TERCEMAR":
        return "bg-amber-50 text-amber-700 border border-amber-200"
      case "KOTOR":
        return "bg-red-50 text-red-700 border border-red-200"
      default:
        return "bg-slate-100 text-slate-600 border border-slate-200"
    }
  }

  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  const bulanIniData = dataList.filter(op => {
    const opDate = new Date(op.tanggal)
    return opDate.getMonth() === currentMonth && opDate.getFullYear() === currentYear
  })
  const risikoTinggi = dataList.filter(op => op.skor_risiko >= 2).length
  const risikoSedang = dataList.filter(op => op.skor_risiko === 1).length
  const risikoRendah = dataList.filter(op => op.skor_risiko === 0).length

  return (
    <>
      <PageHeader
        title="Pemantauan IDO (Operasi)"
        description="Input dan pantau data tindakan operasi serta scoring risiko infeksi"
        actions={
          <Button 
            onClick={() => {
              resetForm()
              setShowForm(true)
            }}
            className="bg-purple-600 hover:bg-purple-700 flex items-center gap-2"
          >
            <Plus size={18} />
            Tambah Data Operasi
          </Button>
        }
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Operasi Bulan Ini"
          value={bulanIniData.length}
          color="blue"
        />
        <StatCard
          title="Risiko Tinggi"
          value={risikoTinggi}
          color="red"
        />
        <StatCard
          title="Risiko Sedang"
          value={risikoSedang}
          color="amber"
        />
        <StatCard
          title="Risiko Rendah"
          value={risikoRendah}
          color="green"
        />
      </div>

      {/* CRUD Modal */}
      <CrudModal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false)
          setIsEditing(false)
          resetForm()
        }}
        title={isEditing ? "Edit Data Operasi" : "Form Input Operasi Baru"}
        loading={isSaving}
        onSubmit={handleSaveOperasi}
        submitLabel={isEditing ? "Perbarui Data Operasi" : "Simpan Data Operasi"}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <FormField label="No. RM Pasien" required>
            <FormSelect
              value={formData.no_rm}
              onChange={(e) => handleNoRmChange(e.target.value)}
            >
              <option value="">Pilih Pasien...</option>
              {pasienList.map(pasien => (
                <option key={pasien.id} value={pasien.no_rm}>
                  {pasien.no_rm} - {pasien.nama} ({pasien.ruangan})
                </option>
              ))}
            </FormSelect>
          </FormField>

          <FormField label="Nama Pasien" required>
            <FormInput
              type="text"
              placeholder="Nama Pasien"
              value={formData.pasien}
              onChange={e => setFormData({...formData, pasien: e.target.value})}
            />
          </FormField>

          <FormField label="Tanggal Operasi" required>
            <FormInput
              type="date"
              value={formData.tanggal}
              onChange={e => setFormData({...formData, tanggal: e.target.value})}
            />
          </FormField>

          <FormField label="Diagnosa Operasi" required>
            <FormInput
              type="text"
              placeholder="Contoh: Appendicitis"
              value={formData.diagnosa}
              onChange={e => setFormData({...formData, diagnosa: e.target.value})}
            />
          </FormField>

          <FormField label="Jenis Operasi">
            <FormSelect value={formData.jenis} onChange={e => setFormData({...formData, jenis: e.target.value})}>
              <option value="BERSIH">Bersih (B)</option>
              <option value="BERSIH_TERCEMAR">Bersih Tercemar (BT)</option>
              <option value="TERCEMAR">Tercemar (T)</option>
              <option value="KOTOR">Kotor (K)</option>
            </FormSelect>
          </FormField>

          <FormField label="ASA Score">
            <FormSelect value={formData.asa} onChange={e => setFormData({...formData, asa: e.target.value})}>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
            </FormSelect>
          </FormField>

          <FormField label="Lama Operasi (T-Time)">
            <div className="flex items-center gap-2">
              <FormInput
                type="number"
                step="0.1"
                value={String(formData.t_time)}
                onChange={e => setFormData({...formData, t_time: parseFloat(e.target.value) || 0})}
              />
              <span className="text-sm text-slate-600">jam</span>
            </div>
          </FormField>
        </div>
      </CrudModal>
      
      {/* Data Table */}
      {loading ? (
        <LoadingSkeleton count={1} rows={5} />
      ) : (
        <Card>
          <CardContent className="p-0">
            <DataTable
              columns={[
                { key: 'tanggal' as any, label: 'Tgl Operasi', sortable: true },
                { 
                  key: 'pasien' as any, 
                  label: 'Pasien',
                  render: (_, row: OperasiData) => (
                    <div>
                      <div className="font-bold">{row.pasien}</div>
                      <div className="text-xs text-gray-500">RM: {row.no_rm} {row.ruangan ? `• ${row.ruangan}` : ''}</div>
                    </div>
                  )
                },
                { 
                  key: 'jenis' as any, 
                  label: 'Jenis',
                  render: (value: string) => (
                    <span className={`px-2 py-1 rounded text-xs font-bold ${getBadgeColor(value)}`}>
                      {value}
                    </span>
                  )
                },
                { key: 'asa' as any, label: 'ASA', className: 'text-center' },
                { key: 't_time' as any, label: 'T-Time', render: (value: number) => `${value} Jam` },
                { key: 'skor_risiko' as any, label: 'Skor Risiko', className: 'text-center font-bold' },
                {
                  key: 'status_ido' as any,
                  label: 'Status Verifikasi IDO',
                  render: (value: string) => (
                    <span className={`px-2 py-1 rounded text-xs font-semibold border ${getBadgeColor(value || "PENDING")}`}>
                      {value || "PENDING"}
                    </span>
                  )
                },
                {
                  key: 'case_status' as any,
                  label: 'Status Kasus IDO',
                  render: (value: string) => (
                    <span className={`px-2 py-1 rounded text-xs font-semibold border ${value ? getBadgeColor(value) : "bg-slate-100 text-slate-600 border-slate-200"}`}>
                      {value || "-"}
                    </span>
                  )
                },
                { 
                  key: 'id' as any, 
                  label: 'Aksi',
                  render: (_, row: OperasiData) => (
                    <div className="flex gap-2 flex-wrap">
                      <button 
                        onClick={() => setSelectedOperasi(row)}
                        className="text-purple-700 hover:text-purple-800 hover:font-medium text-sm transition-colors"
                      >
                        Detail
                      </button>
                      <button
                        onClick={() => handleEdit(row)}
                        className="text-blue-600 hover:text-blue-800 hover:font-medium text-sm transition-colors"
                      >
                        Edit Operasi
                      </button>
                      {row.ido_id ? (
                        <>
                          <Link 
                            href={`/ipcln/operasi/${row.id}/ido`}
                            className="text-green-600 hover:text-green-800 hover:font-medium text-sm transition-colors"
                          >
                            Edit IDO
                          </Link>
                          {row.case_status === 'AKTIF' && (
                            <button
                              onClick={() => handleCloseCase(row.ido_id!)}
                              className="text-blue-600 hover:text-blue-800 hover:font-medium text-sm transition-colors"
                            >
                              Tandai Selesai
                            </button>
                          )}
                        </>
                      ) : (
                        <Link 
                          href={`/ipcln/operasi/${row.id}/ido`}
                          className="text-orange-600 hover:text-orange-800 hover:font-medium text-sm transition-colors"
                        >
                          Lapor IDO
                        </Link>
                      )}
                      <button 
                        onClick={() => handleDelete(row.id)}
                        className="text-red-600 hover:text-red-800 hover:font-medium text-sm transition-colors"
                      >
                        Hapus
                      </button>
                    </div>
                  )
                }
              ]}
              data={dataList}
              emptyMessage="Belum ada data tindakan operasi"
            />
          </CardContent>
        </Card>
      )}

      {/* Detail Modal */}
      {selectedOperasi && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-lg w-full overflow-hidden">
            <CardHeader className="bg-purple-50 text-purple-700 p-4 border-b border-purple-200">
              <div className="flex justify-between items-center">
                <CardTitle className="text-purple-700">Detail Data Operasi</CardTitle>
                <button onClick={() => setSelectedOperasi(null)} className="text-purple-700 hover:text-purple-600 text-2xl">&times;</button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              <div className="grid grid-cols-3 gap-2 text-sm border-b border-slate-200 pb-2">
                <span className="text-slate-600 font-semibold">Tgl Operasi</span>
                <span className="col-span-2 font-bold text-slate-900">{selectedOperasi.tanggal}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm border-b border-slate-200 pb-2">
                <span className="text-slate-600 font-semibold">Pasien</span>
                <span className="col-span-2 font-bold text-slate-900">{selectedOperasi.pasien} (RM: {selectedOperasi.no_rm})</span>
              </div>
              {selectedOperasi.ruangan && (
                <div className="grid grid-cols-3 gap-2 text-sm border-b border-slate-200 pb-2">
                  <span className="text-slate-600 font-semibold">Ruangan</span>
                  <span className="col-span-2 text-slate-900">{selectedOperasi.ruangan}</span>
                </div>
              )}
              <div className="grid grid-cols-3 gap-2 text-sm border-b border-slate-200 pb-2">
                <span className="text-slate-600 font-semibold">Diagnosa</span>
                <span className="col-span-2 text-slate-900">{selectedOperasi.diagnosa}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm border-b border-slate-200 pb-2">
                <span className="text-slate-600 font-semibold">Jenis Operasi</span>
                <span className="col-span-2 text-slate-900">{selectedOperasi.jenis}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm border-b border-slate-200 pb-2">
                <span className="text-slate-600 font-semibold">ASA Score</span>
                <span className="col-span-2 text-slate-900">{selectedOperasi.asa}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm border-b border-slate-200 pb-2">
                <span className="text-slate-600 font-semibold">Lama (T-Time)</span>
                <span className="col-span-2 text-slate-900">{selectedOperasi.t_time} Jam</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <span className="text-slate-600 font-semibold">Skor Risiko</span>
                <span className="col-span-2 font-bold text-red-600">{selectedOperasi.skor_risiko}</span>
              </div>
            </CardContent>
            <div className="bg-slate-50 p-4 flex justify-end border-t border-slate-200">
              <Button onClick={() => setSelectedOperasi(null)} className="bg-slate-600">Tutup</Button>
            </div>
          </Card>
        </div>
      )}

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        open={!!deleteConfirm}
        onCancel={() => setDeleteConfirm(null)}
        onConfirm={confirmDelete}
        title="Konfirmasi Hapus"
        description={`Apakah Anda yakin ingin menghapus data operasi untuk pasien ${deleteConfirm?.pasien}?`}
        confirmText="Hapus"
        cancelText="Batal"
        isDestructive={true}
      />

      {/* Close Case Confirm Dialog */}
      <ConfirmDialog
        open={!!closeCaseConfirm}
        onCancel={() => setCloseCaseConfirm(null)}
        onConfirm={confirmCloseCase}
        title="Konfirmasi Tandai Selesai"
        description="Apakah Anda yakin ingin menandai kasus IDO ini sebagai selesai?"
        confirmText="Tandai Selesai"
        cancelText="Batal"
        isDestructive={false}
      />
    </>
  )
}
