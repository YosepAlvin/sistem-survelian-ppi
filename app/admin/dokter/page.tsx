"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { PageHeader } from "@/components/ui/PageHeader"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { PrimaryButton } from "@/components/ui/PrimaryButton"
import { SecondaryButton } from "@/components/ui/SecondaryButton"
import { FormField, FormInput } from "@/components/ui/FormField"
import { DataTable } from "@/components/ui/DataTable"
import { useToast } from "@/components/ui/Toast"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton"
import { Plus, Eye, Trash2, Edit2, Download, Upload } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { CrudModal } from '@/components/ui/CrudModal'
import axios from "axios"
import { readExcelFile, generateTemplate } from "@/lib/excel-import"

type Dokter = {
  id: string;
  nama: string;
  spesialisasi: string;
  isActive: boolean;
}

export default function DokterPage() {
  const { showToast } = useToast()
  const [dokterList, setDokterList] = useState<Dokter[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedDokter, setSelectedDokter] = useState<Dokter | null>(null)
  const [editingDokter, setEditingDokter] = useState<Dokter | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [dokterToDelete, setDokterToDelete] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    nama: '',
    spesialisasi: ''
  })

  const fetchDokter = useCallback(async () => {
    try {
      setLoading(true)
      const res = await axios.get("/api/admin/dokter")
      setDokterList(res.data)
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Gagal Memuat Data',
        message: 'Tidak dapat terhubung ke database.'
      })
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    fetchDokter()
  }, [fetchDokter])

  const handleOpenModal = (dokter?: Dokter) => {
    if (dokter) {
      setEditingDokter(dokter)
      setFormData({
        nama: dokter.nama,
        spesialisasi: dokter.spesialisasi
      })
    } else {
      setEditingDokter(null)
      setFormData({ nama: '', spesialisasi: '' })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingDokter(null)
    setFormData({ nama: '', spesialisasi: '' })
  }

  const handleSaveDokter = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      if (editingDokter) {
        await axios.put("/api/admin/dokter", {
          id: editingDokter.id,
          ...formData
        })
        showToast({
          type: 'success',
          title: 'Dokter Diperbarui',
          message: `Data ${formData.nama} berhasil diperbarui.`
        })
      } else {
        await axios.post("/api/admin/dokter", formData)
        showToast({
          type: 'success',
          title: 'Dokter Tersimpan',
          message: `Data ${formData.nama} berhasil ditambahkan.`
        })
      }
      handleCloseModal()
      fetchDokter()
    } catch (err: any) {
      showToast({
        type: 'error',
        title: editingDokter ? 'Gagal Memperbarui' : 'Gagal Menyimpan',
        message: err.response?.data?.error || err.message
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (dokterToDelete) {
      try {
        setIsDeleting(true)
        await axios.delete("/api/admin/dokter", { params: { id: dokterToDelete } })
        showToast({
          type: 'success',
          title: 'Berhasil Dihapus',
          message: 'Data dokter telah dinonaktifkan.'
        })
        setDokterToDelete(null)
        fetchDokter()
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
  }

  const handleDownloadTemplate = () => {
    generateTemplate(
      ['nama', 'spesialisasi'],
      'template_dokter'
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
      await axios.post("/api/admin/dokter/import", data)
      showToast({
        type: 'success',
        title: 'Import Berhasil',
        message: `${data.length} data dokter berhasil diimport.`
      })
      fetchDokter()
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Gagal Import',
        message: err.response?.data?.error || err.message
      })
    }
  }

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-slate-200 bg-white/95 px-6 py-8 shadow-xl shadow-slate-200/50">
          <PageHeader
            title="Manajemen Dokter"
            description="Kelola data dokter, spesialisasi, dan status ketersediaan"
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
                  onClick={() => handleOpenModal()}
                  icon={<Plus size={18} />}
                >
                  Tambah Dokter
                </PrimaryButton>
              </div>
            }
          />

          <Card className="mt-6 border-slate-200 bg-white/95">
            <CardHeader>
              <CardTitle className="text-slate-900">Daftar Dokter ({dokterList.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <LoadingSkeleton count={5} rows={2} />
              ) : dokterList.length === 0 ? (
                <div className="text-center py-12 text-slate-600">
                  <p className="text-sm italic">Belum ada data dokter.</p>
                </div>
              ) : (
                <DataTable
                  columns={[
                    {
                      key: 'nama',
                      label: 'Nama Dokter',
                      sortable: true,
                      className: 'text-slate-900'
                    },
                    {
                      key: 'spesialisasi',
                      label: 'Spesialisasi',
                      sortable: true,
                      className: 'text-slate-700'
                    },
                    {
                      key: 'isActive',
                      label: 'Status',
                      render: (value: boolean) => (
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          value
                            ? 'bg-green-50 text-green-700 border border-green-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-300'
                        }`}>
                          {value ? 'Aktif' : 'Nonaktif'}
                        </span>
                      )
                    },
                    {
                      key: 'id',
                      label: 'Aksi',
                      render: (value: string, row: Dokter) => (
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleOpenModal(row)} title="Edit Dokter" aria-label="Edit Dokter" className="text-blue-600 hover:text-blue-800 hover:bg-blue-50">
                            <Edit2 size={16} />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setSelectedDokter(row)} title="Lihat detail" aria-label="Lihat detail" className="text-slate-700 hover:text-slate-900 hover:bg-slate-50">
                            <Eye size={16} />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setDokterToDelete(value)} title="Hapus" aria-label="Hapus" className="text-red-600 hover:text-red-800 hover:bg-red-50">
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      )
                    }
                  ]}
                  data={dokterList}
                  stickyHeader
                  searchable
                  searchPlaceholder="Cari Nama Dokter atau Spesialisasi..."
                  paginated
                  pageSize={10}
                />
              )}
            </CardContent>
          </Card>

          {/* Add/Edit Modal */}
          <CrudModal
            isOpen={showModal}
            onClose={handleCloseModal}
            title={editingDokter ? "Edit Dokter" : "Tambah Dokter Baru"}
            loading={isSubmitting}
            onSubmit={handleSaveDokter}
          >
            <form id="crud-form" onSubmit={handleSaveDokter} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Nama Lengkap" required>
                  <FormInput
                    type="text"
                    placeholder="Contoh: dr. Nama Dokter, Sp.X"
                    value={formData.nama}
                    onChange={e => setFormData({...formData, nama: e.target.value})}
                    required
                    className="bg-white border-slate-200 text-slate-900 placeholder-slate-500"
                  />
                </FormField>

                <FormField label="Spesialisasi" required>
                  <FormInput
                    type="text"
                    placeholder="Contoh: Bedah Umum"
                    value={formData.spesialisasi}
                    onChange={e => setFormData({...formData, spesialisasi: e.target.value})}
                    required
                    className="bg-white border-slate-200 text-slate-900 placeholder-slate-500"
                  />
                </FormField>
              </div>
            </form>
          </CrudModal>

          <ConfirmDialog
            open={!!dokterToDelete}
            title="Hapus Data Dokter"
            description="Apakah Anda yakin ingin menghapus data dokter ini? Dokter akan dinonaktifkan dari sistem."
            confirmText="Ya, Hapus"
            isDestructive
            isLoading={isDeleting}
            onConfirm={handleDelete}
            onCancel={() => setDokterToDelete(null)}
          />

          {selectedDokter && (
            <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 animate-fade-in">
              <Card className="max-w-md w-full overflow-hidden animate-slide-down bg-white border-slate-200">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 text-blue-800 border-b border-blue-200">
                  <CardTitle className="text-blue-800 flex justify-between items-center">
                    Profil Dokter
                    <Button variant="ghost" size="icon" onClick={() => setSelectedDokter(null)} aria-label="Tutup" className="text-blue-800 hover:bg-blue-100">×</Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <div className="flex flex-col items-center pb-4 border-b border-slate-200">
                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-2xl mb-3 border border-blue-200">
                      {selectedDokter.nama.charAt(0).toUpperCase()}
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">{selectedDokter.nama}</h3>
                    <span className="text-sm text-blue-700 font-semibold">{selectedDokter.spesialisasi}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-600 mb-1">ID Karyawan</p>
                      <p className="font-bold text-blue-700">DOK-{selectedDokter.id.substring(0, 5).toUpperCase()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 mb-1">Status</p>
                      <p className={`font-bold ${selectedDokter.isActive ? 'text-green-700' : 'text-red-700'}`}>
                        {selectedDokter.isActive ? 'Aktif' : 'Nonaktif'}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                    <SecondaryButton onClick={() => setSelectedDokter(null)} className="bg-slate-200 hover:bg-slate-300">
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