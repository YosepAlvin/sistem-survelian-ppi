"use client"

import React, { useState } from 'react'
import { PageHeader } from "@/components/ui/PageHeader"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/button"
import { FormField, FormInput } from "@/components/ui/FormField"
import { DataTable } from "@/components/ui/DataTable"
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton"
import { Plus, Eye, Edit2, Trash2, Download, Upload } from 'lucide-react'
import { useToast } from "@/components/ui/Toast"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"
import { CrudModal } from '@/components/ui/CrudModal'
import useSWR from 'swr'
import axios from 'axios'
import { fetcher } from '@/lib/fetcher'
import { readExcelFile, generateTemplate } from "@/lib/excel-import"

type Diagnosa = {
  id: string;
  kode: string;
  nama: string;
  kategori: string;
}

export default function DiagnosaPage() {
  const { showToast } = useToast()
  const { data: diagnosaList, mutate: mutateDiagnosa, isLoading } = useSWR<Diagnosa[]>('/api/admin/diagnosa', fetcher)
  
  const [showModal, setShowModal] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedDiagnosa, setSelectedDiagnosa] = useState<Diagnosa | null>(null)
  const [detailDiagnosa, setDetailDiagnosa] = useState<Diagnosa | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [diagnosaToDelete, setDiagnosaToDelete] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    kode: '',
    nama: '',
    kategori: ''
  })

  const handleOpenModal = (diagnosa?: Diagnosa) => {
    if (diagnosa) {
      setIsEditMode(true)
      setSelectedDiagnosa(diagnosa)
      setFormData({ kode: diagnosa.kode, nama: diagnosa.nama, kategori: diagnosa.kategori })
    } else {
      setIsEditMode(false)
      setSelectedDiagnosa(null)
      setFormData({ kode: '', nama: '', kategori: '' })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setIsEditMode(false)
    setSelectedDiagnosa(null)
    setFormData({ kode: '', nama: '', kategori: '' })
  }

  const handleSaveDiagnosa = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (isEditMode && selectedDiagnosa) {
        await axios.put('/api/admin/diagnosa', {
          id: selectedDiagnosa.id,
          ...formData
        })
        showToast({
          type: 'success',
          title: 'Data Diperbarui',
          message: 'Diagnosa berhasil diupdate.'
        })
      } else {
        await axios.post('/api/admin/diagnosa', formData)
        showToast({
          type: 'success',
          title: 'Diagnosa Disimpan',
          message: 'Data baru berhasil ditambahkan.'
        })
      }

      mutateDiagnosa()
      handleCloseModal()
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Gagal Menyimpan',
        message: err.response?.data?.error || err.message
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!diagnosaToDelete) return
    
    try {
      setIsDeleting(true)
      await axios.delete('/api/admin/diagnosa', { params: { id: diagnosaToDelete } })
      showToast({
        type: 'success',
        title: 'Berhasil Dihapus',
        message: 'Data diagnosa telah dihapus.'
      })
      mutateDiagnosa()
      setDiagnosaToDelete(null)
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
      ['kode_icd', 'nama', 'kategori'],
      'template_diagnosa'
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
      await axios.post("/api/admin/diagnosa/import", data)
      showToast({
        type: 'success',
        title: 'Import Berhasil',
        message: `${data.length} data diagnosa berhasil diimport.`
      })
      mutateDiagnosa()
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
            title="Manajemen Diagnosa"
            description="Kelola data diagnosa dan kode ICD-10"
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
                <Button
                  onClick={() => handleOpenModal()}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus size={18} />
                  Tambah Diagnosa
                </Button>
              </div>
            }
          />

          <Card className="mt-6 border-slate-200 bg-white/95">
            <CardHeader>
              <CardTitle className="text-slate-900">Daftar Diagnosa ({diagnosaList?.length || 0})</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <LoadingSkeleton />
              ) : !diagnosaList || diagnosaList.length === 0 ? (
                <div className="text-center py-12 text-slate-600">
                  <p className="text-sm italic">Belum ada data diagnosa.</p>
                </div>
              ) : (
                <DataTable
                  columns={[
                    {
                      key: 'kode',
                      label: 'Kode ICD',
                      sortable: true,
                      render: (value) => (
                        <span className="font-mono font-bold text-blue-600">{value}</span>
                      )
                    },
                    {
                      key: 'nama',
                      label: 'Nama Penyakit',
                      sortable: true,
                      className: 'text-slate-900'
                    },
                    {
                      key: 'kategori',
                      label: 'Kategori',
                      render: (value) => (
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                          {value || 'Umum'}
                        </span>
                      )
                    },
                    {
                      key: 'id',
                      label: 'Aksi',
                      render: (value, row: Diagnosa) => (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDetailDiagnosa(row)}
                            title="Lihat detail"
                            className="text-slate-700 hover:text-slate-900 hover:bg-slate-50"
                          >
                            <Eye size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenModal(row)}
                            title="Edit diagnosa"
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                          >
                            <Edit2 size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDiagnosaToDelete(value)}
                            title="Hapus diagnosa"
                            className="text-red-600 hover:text-red-800 hover:bg-red-50"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      )
                    }
                  ]}
                  data={diagnosaList}
                  stickyHeader
                  searchable
                  searchPlaceholder="Cari Nama Penyakit atau Kode ICD..."
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
            title={isEditMode ? 'Edit Diagnosa' : 'Tambah Diagnosa Baru'}
            loading={isSubmitting}
            onSubmit={handleSaveDiagnosa}
          >
            <form id="crud-form" onSubmit={handleSaveDiagnosa} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField label="Kode ICD-10" required>
                  <FormInput
                    type="text"
                    placeholder="Contoh: A00"
                    value={formData.kode}
                    onChange={e => setFormData({...formData, kode: e.target.value})}
                    required
                    className="bg-white border-slate-200 text-slate-900 placeholder-slate-500"
                  />
                </FormField>

                <FormField label="Nama Penyakit" required>
                  <FormInput
                    type="text"
                    placeholder="Nama Diagnosa"
                    value={formData.nama}
                    onChange={e => setFormData({...formData, nama: e.target.value})}
                    required
                    className="bg-white border-slate-200 text-slate-900 placeholder-slate-500"
                  />
                </FormField>

                <FormField label="Kategori">
                  <FormInput
                    type="text"
                    placeholder="Contoh: Penyakit Menular"
                    value={formData.kategori}
                    onChange={e => setFormData({...formData, kategori: e.target.value})}
                    className="bg-white border-slate-200 text-slate-900 placeholder-slate-500"
                  />
                </FormField>
              </div>
            </form>
          </CrudModal>

          <ConfirmDialog
            open={!!diagnosaToDelete}
            title="Hapus Diagnosa"
            description="Apakah Anda yakin ingin menghapus data diagnosa ini? Data yang terhubung mungkin akan terpengaruh."
            confirmText="Ya, Hapus"
            isDestructive
            isLoading={isDeleting}
            onConfirm={handleDelete}
            onCancel={() => setDiagnosaToDelete(null)}
          />

          {detailDiagnosa && (
            <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 animate-fade-in">
              <Card className="max-w-md w-full overflow-hidden animate-slide-down bg-white border-slate-200">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 text-blue-800 border-b border-blue-200">
                  <CardTitle className="text-blue-800 flex justify-between items-center">
                    Detail Diagnosa
                    <button
                      onClick={() => setDetailDiagnosa(null)}
                      className="text-2xl hover:opacity-80 transition-opacity"
                    >
                      ×
                    </button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <div className="flex flex-col items-center pb-4 border-b border-slate-200">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold text-xl mb-3 border border-blue-200">
                      {detailDiagnosa.kode.substring(0, 2)}
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 text-center">{detailDiagnosa.nama}</h3>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <p className="text-xs text-slate-500 mb-1 font-semibold">Kode ICD-10</p>
                      <p className="font-mono font-bold text-blue-700">{detailDiagnosa.kode}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1 font-semibold">Kategori</p>
                      <p className="font-bold text-slate-900">{detailDiagnosa.kategori || '-'}</p>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                    <Button variant="secondary" className="bg-slate-200 hover:bg-slate-300 text-slate-900" onClick={() => setDetailDiagnosa(null)}>
                      Tutup
                    </Button>
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
