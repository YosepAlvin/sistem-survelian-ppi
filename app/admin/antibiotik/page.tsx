"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { PageHeader } from "@/components/ui/PageHeader"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { PrimaryButton } from "@/components/ui/PrimaryButton"
import { SecondaryButton } from "@/components/ui/SecondaryButton"
import { DangerButton } from "@/components/ui/DangerButton"
import { FormField, FormInput, FormSelect } from "@/components/ui/FormField"
import { DataTable } from "@/components/ui/DataTable"
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton"
import { EmptyState } from "@/components/ui/EmptyState"
import { Plus, Eye, Trash2, Edit2, Download, Upload } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/Toast"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"
import axios from "axios"
import { readExcelFile, generateTemplate } from "@/lib/excel-import"

type Antibiotik = {
  id: string;
  nama: string;
  kode: string;
  golongan: string;
  is_restriksi: boolean;
  durasi_maks_hari: number;
}

export default function AntibiotikPage() {
  const { showToast } = useToast()
  const [antibiotikList, setAntibiotikList] = useState<Antibiotik[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selectedAntibiotik, setSelectedAntibiotik] = useState<Antibiotik | null>(null)
  const [editingAntibiotik, setEditingAntibiotik] = useState<Antibiotik | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [antibiotikToDelete, setAntibiotikToDelete] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    nama: '',
    kode: '',
    golongan: 'Umum',
    is_restriksi: false,
    durasi_maks_hari: 7
  })

  const fetchAntibiotik = useCallback(async () => {
    try {
      setLoading(true)
      const res = await axios.get("/api/admin/antibiotik")
      setAntibiotikList(res.data)
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Gagal Memuat Antibiotik',
        message: 'Tidak dapat terhubung ke database.'
      })
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    fetchAntibiotik()
  }, [fetchAntibiotik])

  const handleSaveAntibiotik = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingAntibiotik) {
        await axios.put("/api/admin/antibiotik", {
          id: editingAntibiotik.id,
          ...formData
        })
        showToast({
          type: 'success',
          title: 'Antibiotik Diperbarui',
          message: `Antibiotik ${formData.nama} berhasil diperbarui.`
        })
      } else {
        await axios.post("/api/admin/antibiotik", formData)
        showToast({
          type: 'success',
          title: 'Antibiotik Tersimpan',
          message: `Antibiotik ${formData.nama} berhasil ditambahkan.`
        })
      }
      setShowForm(false)
      setEditingAntibiotik(null)
      setFormData({ nama: '', kode: '', golongan: 'Umum', is_restriksi: false, durasi_maks_hari:7 })
      fetchAntibiotik()
    } catch (err: any) {
      showToast({
        type: 'error',
        title: editingAntibiotik ? 'Gagal Memperbarui' : 'Gagal Menyimpan',
        message: err.response?.data?.error || err.message
      })
    }
  }

  const handleEditAntibiotik = (antibiotik: Antibiotik) => {
    setEditingAntibiotik(antibiotik)
    setFormData({
      nama: antibiotik.nama,
      kode: antibiotik.kode,
      golongan: antibiotik.golongan,
      is_restriksi: antibiotik.is_restriksi,
      durasi_maks_hari: antibiotik.durasi_maks_hari
    })
    setShowForm(true)
  }

  const handleDelete = async () => {
    if (!antibiotikToDelete) return

    try {
      setIsDeleting(true)
      await axios.delete("/api/admin/antibiotik", { params: { id: antibiotikToDelete } })
      showToast({
        type: 'success',
        title: 'Berhasil Dihapus',
        message: 'Master data antibiotik telah dihapus.'
      })
      setAntibiotikToDelete(null)
      fetchAntibiotik()
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Gagal Menghapus',
        message: err.response?.data?.error || err.message
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDownloadTemplate = () => {
    generateTemplate(
      ['nama', 'kode', 'golongan', 'is_restriksi', 'durasi_maks_hari'],
      'template_antibiotik'
    )
    showToast({
      type: 'success',
      title: 'Template Downloaded',
      message: 'Template Excel untuk import telah diunduh.'
    })
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const data = await readExcelFile(file)
      const res = await axios.post("/api/admin/antibiotik/import", data)
      
      if (res.data.errorCount > 0) {
        showToast({
          type: 'warning',
          title: 'Import Sebagian Berhasil',
          message: `${res.data.processedCount} data berhasil diproses, ${res.data.errorCount} data gagal. Lihat console untuk detail error.`
        })
        console.error("Import errors:", res.data.errors)
      } else {
        showToast({
          type: 'success',
          title: 'Import Berhasil',
          message: `${res.data.processedCount} data antibiotik berhasil diimport.`
        })
      }
      
      fetchAntibiotik()
    } catch (err: any) {
      console.error("Import error:", err)
      showToast({
        type: 'error',
        title: 'Gagal Import',
        message: err.response?.data?.error || err.message
      })
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-slate-800 bg-slate-900/95 px-6 py-8 shadow-xl shadow-slate-950/40">
          <PageHeader
            title="Master Data Antibiotik"
            description="Kelola data master antibiotik dan kategori restriksi"
            actions={
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleDownloadTemplate}
                  className="flex items-center gap-2"
                >
                  <Download size={16} />
                  Download Template
                </Button>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept=".xlsx, .xls"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <Button
                    variant="outline"
                    className="flex items-center gap-2"
                    asChild
                  >
                    <span>
                      <Upload size={16} />
                      Import Excel
                    </span>
                  </Button>
                </label>
                <PrimaryButton
                  onClick={() => {
                    setEditingAntibiotik(null)
                    setFormData({ nama: '', kode: '', golongan: 'Umum', is_restriksi: false, durasi_maks_hari:7 })
                    setShowForm(!showForm)
                  }}
                  icon={<Plus size={18} />}
                >
                  {showForm ? "Batal" : "Tambah Antibiotik"}
                </PrimaryButton>
              </div>
            }
          />

          {showForm && (
            <Card className="mb-8 border-purple-800 bg-purple-950/30 mt-6">
              <CardHeader>
                <CardTitle className="text-white">{editingAntibiotik ? "Edit Antibiotik" : "Tambah Antibiotik Baru"}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveAntibiotik} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="Nama Antibiotik" required>
                      <FormInput
                        type="text"
                        placeholder="Contoh: Amoksisilin"
                        value={formData.nama}
                        onChange={e => setFormData({...formData, nama: e.target.value})}
                        required
                        className="bg-slate-950 border-slate-700 text-white placeholder-slate-400"
                      />
                    </FormField>

                    <FormField label="Kode Antibiotik" required>
                      <FormInput
                        type="text"
                        placeholder="Contoh: AMX"
                        value={formData.kode}
                        onChange={e => setFormData({...formData, kode: e.target.value})}
                        required
                        className="bg-slate-950 border-slate-700 text-white placeholder-slate-400"
                      />
                    </FormField>

                    <FormField label="Golongan" required>
                      <FormSelect
                        value={formData.golongan}
                        onChange={e => setFormData({...formData, golongan: e.target.value})}
                        className="bg-slate-950 border-slate-700 text-white"
                      >
                        <option value="Umum">Umum</option>
                        <option value="Penisilin">Penisilin</option>
                        <option value="Sefalosporin">Sefalosporin</option>
                        <option value="Makrolid">Makrolid</option>
                        <option value="Kuinolon">Kuinolon</option>
                        <option value="Lainnya">Lainnya</option>
                      </FormSelect>
                    </FormField>

                    <FormField label="Durasi Maks (hari)" required>
                      <FormInput
                        type="number"
                        placeholder="7"
                        value={formData.durasi_maks_hari}
                        onChange={e => setFormData({...formData, durasi_maks_hari: parseInt(e.target.value)})}
                        required
                        min={1}
                        className="bg-slate-950 border-slate-700 text-white placeholder-slate-400"
                      />
                    </FormField>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="is_restriksi"
                        checked={formData.is_restriksi}
                        onChange={e => setFormData({...formData, is_restriksi: e.target.checked})}
                        className="w-4 h-4 rounded"
                      />
                      <label htmlFor="is_restriksi" className="text-sm text-slate-300">
                        Antibiotik Restriksi
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <SecondaryButton onClick={() => {
                      setShowForm(false)
                      setEditingAntibiotik(null)
                    }} className="bg-slate-700 hover:bg-slate-600">
                      Batal
                    </SecondaryButton>
                    <PrimaryButton type="submit" className="bg-purple-600 hover:bg-purple-700">
                      {editingAntibiotik ? "Perbarui Antibiotik" : "Simpan Antibiotik"}
                    </PrimaryButton>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {loading ? (
            <LoadingSkeleton />
          ) : antibiotikList.length === 0 ? (
            <EmptyState
              title="Belum ada data antibiotik"
              description="Mulai dengan menambahkan antibiotik baru atau import dari file Excel"
            />
          ) : (
            <Card className="mt-6 border-slate-800 bg-slate-900/95">
              <CardHeader>
                <CardTitle className="text-white">Daftar Antibiotik ({antibiotikList.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <DataTable
                  columns={[
                    {
                      key: 'nama',
                      label: 'Nama Antibiotik',
                      sortable: true,
                      className: 'text-slate-100'
                    },
                    {
                      key: 'kode',
                      label: 'Kode',
                      render: (value) => (
                        <span className="font-mono text-sm text-purple-400">{value}</span>
                      )
                    },
                    {
                      key: 'golongan',
                      label: 'Golongan'
                    },
                    {
                      key: 'durasi_maks_hari',
                      label: 'Durasi Maks',
                      render: (value) => `${value} hari`
                    },
                    {
                      key: 'is_restriksi',
                      label: 'Restriksi',
                      render: (value) => (
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          value ? 'bg-red-900/30 text-red-300 border border-red-500/20' : 'bg-green-900/30 text-green-300 border border-green-500/20'
                        }`}>
                          {value ? 'Ya' : 'Tidak'}
                        </span>
                      )
                    },
                    {
                      key: 'id',
                      label: 'Aksi',
                      render: (value, row: Antibiotik) => (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditAntibiotik(row)}
                            title="Edit Antibiotik"
                            aria-label="Edit Antibiotik"
                            className="text-slate-300 hover:text-white hover:bg-slate-800"
                          >
                            <Edit2 size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedAntibiotik(row)}
                            title="Lihat detail"
                            aria-label="Lihat detail"
                            className="text-slate-300 hover:text-white hover:bg-slate-800"
                          >
                            <Eye size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setAntibiotikToDelete(value)}
                            title="Hapus"
                            aria-label="Hapus"
                            className="text-red-400 hover:text-red-300 hover:bg-red-950/30"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      )
                    }
                  ]}
                  data={antibiotikList}
                  stickyHeader
                  searchable
                  searchPlaceholder="Cari Nama Antibiotik atau Kode..."
                  paginated
                  pageSize={10}
                />
              </CardContent>
            </Card>
          )}

          <ConfirmDialog
            open={!!antibiotikToDelete}
            title="Hapus Data Antibiotik"
            description="Apakah Anda yakin ingin menghapus data antibiotik ini?"
            confirmText="Ya, Hapus"
            isDestructive
            isLoading={isDeleting}
            onConfirm={handleDelete}
            onCancel={() => setAntibiotikToDelete(null)}
          />

          {selectedAntibiotik && (
            <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 animate-fade-in">
              <Card className="max-w-md w-full overflow-hidden animate-slide-down bg-slate-900 border-slate-800">
                <CardHeader className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
                  <CardTitle className="text-white flex justify-between items-center">
                    Detail Antibiotik
                    <Button variant="ghost" size="icon" onClick={() => setSelectedAntibiotik(null)} aria-label="Tutup" className="text-white hover:bg-white/10">×</Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <div className="flex flex-col items-center pb-4 border-b border-slate-700">
                    <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center text-purple-300 font-bold text-xl mb-3 border border-purple-500/30">
                      {selectedAntibiotik.kode.substring(0,3)}
                    </div>
                    <h3 className="text-lg font-bold text-white">{selectedAntibiotik.nama}</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Kode</p>
                      <p className="font-bold text-purple-300">{selectedAntibiotik.kode}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Golongan</p>
                      <p className="font-bold text-white">{selectedAntibiotik.golongan}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Durasi Maks</p>
                      <p className="font-bold text-white">{selectedAntibiotik.durasi_maks_hari} hari</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Restriksi</p>
                      <p className="font-bold">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${selectedAntibiotik.is_restriksi ? 'bg-red-900/30 text-red-300' : 'bg-green-900/30 text-green-300'}`}>
                          {selectedAntibiotik.is_restriksi ? 'Ya' : 'Tidak'}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4 border-t border-slate-700">
                    <SecondaryButton onClick={() => setSelectedAntibiotik(null)} className="bg-slate-700 hover:bg-slate-600">
                      Tutup
                    </SecondaryButton>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
