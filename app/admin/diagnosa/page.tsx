"use client"

import React, { useState } from 'react'
import { PageHeader } from "@/components/ui/PageHeader"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/button"
import { FormField, FormInput } from "@/components/ui/FormField"
import { DataTable } from "@/components/ui/DataTable"
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton"
import { Plus, Eye, Edit2, Trash2 } from 'lucide-react'
import { useToast } from "@/components/ui/Toast"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"
import useSWR from 'swr'
import axios from 'axios'
import { fetcher } from '@/lib/fetcher'

type Diagnosa = {
  id: string;
  kode: string;
  nama: string;
  kategori: string;
}

export default function DiagnosaPage() {
  const { showToast } = useToast()
  const { data: diagnosaList, mutate: mutateDiagnosa, isLoading } = useSWR<Diagnosa[]>('/api/admin/diagnosa', fetcher)
  
  const [showForm, setShowForm] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [selectedDiagnosa, setSelectedDiagnosa] = useState<Diagnosa | null>(null)
  const [detailDiagnosa, setDetailDiagnosa] = useState<Diagnosa | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [diagnosaToDelete, setDiagnosaToDelete] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    kode: '',
    nama: '',
    kategori: ''
  })

  const handleSaveDiagnosa = async (e: React.FormEvent) => {
    e.preventDefault()

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
      setShowForm(false)
      setIsEditMode(false)
      setSelectedDiagnosa(null)
      setFormData({ kode: '', nama: '', kategori: '' })
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Gagal Menyimpan',
        message: err.response?.data?.error || err.message
      })
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-slate-800 bg-slate-900/95 px-6 py-8 shadow-xl shadow-slate-950/40">
          <PageHeader
            title="Manajemen Diagnosa"
            description="Kelola data diagnosa dan kode ICD-10"
            actions={
              <Button
                onClick={() => setShowForm(!showForm)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus size={18} />
                {showForm ? "Batal" : "Tambah Diagnosa"}
              </Button>
            }
          />

          {showForm && (
            <Card className="mb-8 border-blue-800 bg-blue-950/30 mt-6">
              <CardHeader>
                <CardTitle className="text-white">{isEditMode ? 'Edit Diagnosa' : 'Tambah Diagnosa Baru'}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveDiagnosa} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField label="Kode ICD-10" required>
                      <FormInput
                        type="text"
                        placeholder="Contoh: A00"
                        value={formData.kode}
                        onChange={e => setFormData({...formData, kode: e.target.value})}
                        required
                        className="bg-slate-950 border-slate-700 text-white placeholder-slate-400"
                      />
                    </FormField>

                    <FormField label="Nama Penyakit" required>
                      <FormInput
                        type="text"
                        placeholder="Nama Diagnosa"
                        value={formData.nama}
                        onChange={e => setFormData({...formData, nama: e.target.value})}
                        required
                        className="bg-slate-950 border-slate-700 text-white placeholder-slate-400"
                      />
                    </FormField>

                    <FormField label="Kategori">
                      <FormInput
                        type="text"
                        placeholder="Contoh: Penyakit Menular"
                        value={formData.kategori}
                        onChange={e => setFormData({...formData, kategori: e.target.value})}
                        className="bg-slate-950 border-slate-700 text-white placeholder-slate-400"
                      />
                    </FormField>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <Button variant="secondary" className="bg-slate-700 hover:bg-slate-600 text-white" onClick={() => {
                      setShowForm(false)
                      setIsEditMode(false)
                      setSelectedDiagnosa(null)
                      setFormData({ kode: '', nama: '', kategori: '' })
                    }}>
                      Batal
                    </Button>
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                      {isEditMode ? 'Simpan Perubahan' : 'Simpan Diagnosa'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <Card className="mt-6 border-slate-800 bg-slate-900/95">
            <CardHeader>
              <CardTitle className="text-white">Daftar Diagnosa ({diagnosaList?.length || 0})</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <LoadingSkeleton />
              ) : !diagnosaList || diagnosaList.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
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
                        <span className="font-mono font-bold text-blue-400">{value}</span>
                      )
                    },
                    {
                      key: 'nama',
                      label: 'Nama Penyakit',
                      sortable: true,
                      className: 'text-slate-100'
                    },
                    {
                      key: 'kategori',
                      label: 'Kategori',
                      render: (value) => (
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-900/30 text-blue-300 border border-blue-500/20">
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
                            className="text-slate-300 hover:text-white hover:bg-slate-800"
                          >
                            <Eye size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setShowForm(true)
                              setIsEditMode(true)
                              setSelectedDiagnosa(row)
                              setFormData({ kode: row.kode, nama: row.nama, kategori: row.kategori })
                            }}
                            title="Edit diagnosa"
                            className="text-blue-300 hover:text-white hover:bg-blue-900/30"
                          >
                            <Edit2 size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDiagnosaToDelete(value)}
                            title="Hapus diagnosa"
                            className="text-red-400 hover:text-red-300 hover:bg-red-950/30"
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
              <Card className="max-w-md w-full overflow-hidden animate-slide-down bg-slate-900 border-slate-800">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                  <CardTitle className="text-white flex justify-between items-center">
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
                  <div className="flex flex-col items-center pb-4 border-b border-slate-700">
                    <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-300 font-bold text-xl mb-3 border border-blue-500/30">
                      {detailDiagnosa.kode.substring(0, 2)}
                    </div>
                    <h3 className="text-lg font-bold text-white text-center">{detailDiagnosa.nama}</h3>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <p className="text-xs text-slate-500 mb-1 font-semibold">Kode ICD-10</p>
                      <p className="font-mono font-bold text-blue-300">{detailDiagnosa.kode}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1 font-semibold">Kategori</p>
                      <p className="font-bold text-white">{detailDiagnosa.kategori || '-'}</p>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4 border-t border-slate-700">
                    <Button variant="secondary" className="bg-slate-700 hover:bg-slate-600 text-white" onClick={() => setDetailDiagnosa(null)}>
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
