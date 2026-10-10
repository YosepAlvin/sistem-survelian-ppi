"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { PageHeader } from "@/components/ui/PageHeader"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { PrimaryButton } from "@/components/ui/PrimaryButton"
import { SecondaryButton } from "@/components/ui/SecondaryButton"
import { FormField, FormInput, FormSelect } from "@/components/ui/FormField"
import { DataTable } from "@/components/ui/DataTable"
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton"
import { EmptyState } from "@/components/ui/EmptyState"
import { Plus, Eye, Trash2, Edit2, Download, Upload } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/Toast"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"
import { CrudModal } from "@/components/ui/CrudModal"
import axios from "axios"
import { readExcelFile, generateTemplate } from "@/lib/excel-import"

type Pasien = {
  id: string;
  no_rm: string;
  nama: string;
  tanggal_lahir: string;
  usia: number;
  jenis_kelamin: 'L' | 'P';
  alamat: string;
}

export default function PasienPage() {
  const { showToast } = useToast()
  const [pasienList, setPasienList] = useState<Pasien[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedPasien, setSelectedPasien] = useState<Pasien | null>(null)
  const [editingPasien, setEditingPasien] = useState<Pasien | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [pasienToDelete, setPasienToDelete] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    no_rm: '',
    nama: '',
    tanggal_lahir: '',
    usia: 0,
    jenis_kelamin: 'L' as 'L' | 'P',
    alamat: ''
  })

  const fetchPasien = useCallback(async () => {
    try {
      setLoading(true)
      const res = await axios.get("/api/admin/pasien")
      setPasienList(res.data)
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Gagal Memuat Pasien',
        message: 'Tidak dapat terhubung ke database.'
      })
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    fetchPasien()
  }, [fetchPasien])

  const handleSavePasien = async () => {
    try {
      setIsSaving(true)
      if (editingPasien) {
        await axios.put("/api/admin/pasien", {
          id: editingPasien.id,
          ...formData
        })
        showToast({
          type: 'success',
          title: 'Pasien Diperbarui',
          message: `Pasien ${formData.nama} berhasil diperbarui.`
        })
      } else {
        await axios.post("/api/admin/pasien", formData)
        showToast({
          type: 'success',
          title: 'Pasien Tersimpan',
          message: `Pasien ${formData.nama} berhasil ditambahkan.`
        })
      }
      setShowForm(false)
      setEditingPasien(null)
      setFormData({ no_rm: '', nama: '', tanggal_lahir: '', usia: 0, jenis_kelamin: 'L', alamat: '' })
      fetchPasien()
    } catch (err: any) {
      showToast({
        type: 'error',
        title: editingPasien ? 'Gagal Memperbarui' : 'Gagal Menyimpan',
        message: err.response?.data?.error || err.message
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleEditPasien = (pasien: Pasien) => {
    setEditingPasien(pasien)
    setFormData({
      no_rm: pasien.no_rm,
      nama: pasien.nama,
      tanggal_lahir: new Date(pasien.tanggal_lahir).toISOString().split('T')[0],
      usia: pasien.usia,
      jenis_kelamin: pasien.jenis_kelamin,
      alamat: pasien.alamat
    })
    setShowForm(true)
  }

  const handleDelete = async () => {
    if (!pasienToDelete) return

    try {
      setIsDeleting(true)
      await axios.delete("/api/admin/pasien", { params: { id: pasienToDelete } })
      showToast({
        type: 'success',
        title: 'Berhasil Dihapus',
        message: 'Master data pasien telah dihapus.'
      })
      setPasienToDelete(null)
      fetchPasien()
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
      ['no_rm', 'nama', 'tanggal_lahir', 'usia', 'jenis_kelamin', 'alamat'],
      'template_pasien'
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
      await axios.post("/api/admin/pasien/import", data)
      showToast({
        type: 'success',
        title: 'Import Berhasil',
        message: `${data.length} data pasien berhasil diimport.`
      })
      fetchPasien()
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
            title="Master Data Pasien"
            description="Kelola data pasien (import Excel didukung)"
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
                    setEditingPasien(null)
                    setFormData({ no_rm: '', nama: '', tanggal_lahir: '', usia: 0, jenis_kelamin: 'L', alamat: '' })
                    setShowForm(true)
                  }}
                  icon={<Plus size={18} />}
                >
                  Tambah Pasien
                </PrimaryButton>
              </div>
            }
          />

          <CrudModal
            isOpen={showForm}
            onClose={() => {
              setShowForm(false)
              setEditingPasien(null)
              setFormData({ no_rm: '', nama: '', tanggal_lahir: '', usia: 0, jenis_kelamin: 'L', alamat: '' })
            }}
            title={editingPasien ? "Edit Pasien" : "Tambah Pasien Baru"}
            loading={isSaving}
            onSubmit={handleSavePasien}
            submitLabel={editingPasien ? "Perbarui Pasien" : "Simpan Pasien"}
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <FormField label="No. RM" required>
                <FormInput
                  type="text"
                  placeholder="Contoh: RM001"
                  value={formData.no_rm}
                  onChange={e => setFormData({...formData, no_rm: e.target.value})}
                  required
                  className="bg-white border-slate-200 text-slate-900 placeholder-slate-500"
                />
              </FormField>

              <FormField label="Nama Pasien" required>
                <FormInput
                  type="text"
                  placeholder="Nama Lengkap"
                  value={formData.nama}
                  onChange={e => setFormData({...formData, nama: e.target.value})}
                  required
                  className="bg-white border-slate-200 text-slate-900 placeholder-slate-500"
                />
              </FormField>

              <FormField label="Tanggal Lahir" required>
                <FormInput
                  type="date"
                  value={formData.tanggal_lahir}
                  onChange={e => setFormData({...formData, tanggal_lahir: e.target.value})}
                  required
                  className="bg-white border-slate-200 text-slate-900"
                />
              </FormField>

              <FormField label="Usia" required>
                <FormInput
                  type="number"
                  placeholder="0"
                  value={formData.usia}
                  onChange={e => setFormData({...formData, usia: parseInt(e.target.value)})}
                  required
                  className="bg-white border-slate-200 text-slate-900"
                />
              </FormField>

              <FormField label="Jenis Kelamin" required>
                <FormSelect
                  value={formData.jenis_kelamin}
                  onChange={e => setFormData({...formData, jenis_kelamin: e.target.value as 'L' | 'P'})}
                  className="bg-white border-slate-200 text-slate-900"
                >
                  <option value="L">Laki-laki</option>
                  <option value="P">Perempuan</option>
                </FormSelect>
              </FormField>

              <div className="md:col-span-2 lg:col-span-1">
                <FormField label="Alamat">
                  <FormInput
                    type="text"
                    placeholder="Alamat"
                    value={formData.alamat}
                    onChange={e => setFormData({...formData, alamat: e.target.value})}
                    className="bg-white border-slate-200 text-slate-900"
                  />
                </FormField>
              </div>
            </div>
          </CrudModal>

          {loading ? (
            <LoadingSkeleton />
          ) : pasienList.length === 0 ? (
            <EmptyState
              title="Belum ada data pasien"
              description="Mulai dengan menambahkan pasien baru atau import dari Excel"
            />
          ) : (
            <Card className="mt-6 border-slate-200 bg-white/95">
              <CardHeader>
                <CardTitle className="text-slate-900">Daftar Pasien ({pasienList.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <DataTable
                  columns={[
                    {
                      key: 'no_rm',
                      label: 'No. RM',
                      render: (value) => (
                        <span className="font-mono text-sm text-blue-400">{value}</span>
                      )
                    },
                    {
                      key: 'nama',
                      label: 'Nama Pasien',
                      sortable: true,
                      className: 'text-slate-900'
                    },
                    {
                      key: 'jenis_kelamin',
                      label: 'JK',
                      render: (value) => value === 'L' ? 'Laki-laki' : 'Perempuan'
                    },
                    {
                      key: 'usia',
                      label: 'Usia',
                      render: (value) => `${value} tahun`
                    },
                    {
                      key: 'alamat',
                      label: 'Alamat',
                      render: (value) => value || '-'
                    },
                    {
                      key: 'id',
                      label: 'Aksi',
                      render: (value, row: Pasien) => (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditPasien(row)}
                            title="Edit Pasien"
                            className="text-slate-700 hover:text-slate-900 hover:bg-slate-50"
                          >
                            <Edit2 size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedPasien(row)}
                            title="Lihat detail"
                            className="text-slate-700 hover:text-slate-900 hover:bg-slate-50"
                          >
                            <Eye size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setPasienToDelete(value)}
                            title="Hapus"
                            className="text-red-600 hover:text-red-800 hover:bg-red-50"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      )
                    }
                  ]}
                  data={pasienList}
                  stickyHeader
                  searchable
                  searchPlaceholder="Cari Nama Pasien atau No. RM..."
                  paginated
                  pageSize={10}
                />
              </CardContent>
            </Card>
          )}

          <ConfirmDialog
            open={!!pasienToDelete}
            title="Hapus Data Pasien"
            description="Apakah Anda yakin ingin menghapus data pasien ini?"
            confirmText="Ya, Hapus"
            isDestructive
            isLoading={isDeleting}
            onConfirm={handleDelete}
            onCancel={() => setPasienToDelete(null)}
          />

          {selectedPasien && (
            <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 animate-fade-in">
              <Card className="max-w-md w-full overflow-hidden animate-slide-down bg-white border-slate-200">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-slate-900">
                  <CardTitle className="text-slate-900 flex justify-between items-center">
                    Detail Pasien
                    <Button variant="ghost" size="icon" onClick={() => setSelectedPasien(null)} className="text-slate-900 hover:bg-slate-100">×</Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <div className="flex flex-col items-center pb-4 border-b border-slate-200">
                    <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-300 font-bold text-xl mb-3 border border-blue-500/30">
                      {selectedPasien.no_rm.substring(0,3)}
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">{selectedPasien.nama}</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">No. RM</p>
                      <p className="font-bold text-blue-300">{selectedPasien.no_rm}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Jenis Kelamin</p>
                      <p className="font-bold text-slate-900">{selectedPasien.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Usia</p>
                      <p className="font-bold text-slate-900">{selectedPasien.usia} tahun</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Alamat</p>
                      <p className="text-sm text-slate-900">{selectedPasien.alamat || '-'}</p>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                    <SecondaryButton onClick={() => setSelectedPasien(null)} className="bg-slate-700 hover:bg-slate-600">
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
