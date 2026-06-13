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
import { Plus, Eye, Trash2, Edit2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import axios from "axios"

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
  const [showForm, setShowForm] = useState(false)
  const [selectedDokter, setSelectedDokter] = useState<Dokter | null>(null)
  const [editingDokter, setEditingDokter] = useState<Dokter | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
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

  const handleSaveDokter = async (e: React.FormEvent) => {
    e.preventDefault()
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
      setShowForm(false)
      setEditingDokter(null)
      setFormData({ nama: '', spesialisasi: '' })
      fetchDokter()
    } catch (err: any) {
      showToast({
        type: 'error',
        title: editingDokter ? 'Gagal Memperbarui' : 'Gagal Menyimpan',
        message: err.response?.data?.error || err.message
      })
    }
  }

  const handleEditDokter = (dokter: Dokter) => {
    setEditingDokter(dokter)
    setFormData({
      nama: dokter.nama,
      spesialisasi: dokter.spesialisasi
    })
    setShowForm(true)
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-slate-800 bg-slate-900/95 px-6 py-8 shadow-xl shadow-slate-950/40">
          <PageHeader
            title="Manajemen Dokter"
            description="Kelola data dokter, spesialisasi, dan status ketersediaan"
            actions={
              <PrimaryButton
                onClick={() => {
                  setEditingDokter(null)
                  setFormData({ nama: '', spesialisasi: '' })
                  setShowForm(!showForm)
                }}
                icon={<Plus size={18} />}
              >
                {showForm ? "Batal" : "Tambah Dokter"}
              </PrimaryButton>
            }
          />

          {showForm && (
            <Card className="mb-8 border-blue-800 bg-blue-950/30 mt-6">
              <CardHeader>
                <CardTitle className="text-white">{editingDokter ? "Edit Dokter" : "Tambah Dokter Baru"}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveDokter} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="Nama Lengkap" required>
                      <FormInput
                        type="text"
                        placeholder="Contoh: dr. Nama Dokter, Sp.X"
                        value={formData.nama}
                        onChange={e => setFormData({...formData, nama: e.target.value})}
                        required
                        className="bg-slate-950 border-slate-700 text-white placeholder-slate-400"
                      />
                    </FormField>

                    <FormField label="Spesialisasi" required>
                      <FormInput
                        type="text"
                        placeholder="Contoh: Bedah Umum"
                        value={formData.spesialisasi}
                        onChange={e => setFormData({...formData, spesialisasi: e.target.value})}
                        required
                        className="bg-slate-950 border-slate-700 text-white placeholder-slate-400"
                      />
                    </FormField>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <SecondaryButton onClick={() => {
                      setShowForm(false)
                      setEditingDokter(null)
                    }} className="bg-slate-700 hover:bg-slate-600">
                      Batal
                    </SecondaryButton>
                    <PrimaryButton type="submit" className="bg-blue-600 hover:bg-blue-700">
                      {editingDokter ? "Perbarui Dokter" : "Simpan Dokter"}
                    </PrimaryButton>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <Card className="mt-6 border-slate-800 bg-slate-900/95">
            <CardHeader>
              <CardTitle className="text-white">Daftar Dokter ({dokterList.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <LoadingSkeleton count={5} rows={2} />
              ) : dokterList.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <p className="text-sm italic">Belum ada data dokter.</p>
                </div>
              ) : (
                <DataTable
                  columns={[
                    {
                      key: 'nama',
                      label: 'Nama Dokter',
                      sortable: true,
                      className: 'text-slate-100'
                    },
                    {
                      key: 'spesialisasi',
                      label: 'Spesialisasi',
                      sortable: true,
                      className: 'text-slate-300'
                    },
                    {
                      key: 'isActive',
                      label: 'Status',
                      render: (value: boolean) => (
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          value
                            ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                            : 'bg-slate-700 text-slate-300 border border-slate-600'
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
                          <Button variant="ghost" size="icon" onClick={() => handleEditDokter(row)} title="Edit Dokter" aria-label="Edit Dokter" className="text-slate-300 hover:text-white hover:bg-slate-800">
                            <Edit2 size={16} />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setSelectedDokter(row)} title="Lihat detail" aria-label="Lihat detail" className="text-slate-300 hover:text-white hover:bg-slate-800">
                            <Eye size={16} />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => setDokterToDelete(value)} title="Hapus" aria-label="Hapus" className="text-red-400 hover:text-red-300 hover:bg-red-950/30">
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
              <Card className="max-w-md w-full overflow-hidden animate-slide-down bg-slate-900 border-slate-800">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                  <CardTitle className="text-white flex justify-between items-center">
                    Profil Dokter
                    <Button variant="ghost" size="icon" onClick={() => setSelectedDokter(null)} aria-label="Tutup" className="text-white hover:bg-white/10">×</Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <div className="flex flex-col items-center pb-4 border-b border-slate-700">
                    <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-300 font-bold text-2xl mb-3 border border-blue-500/30">
                      {selectedDokter.nama.charAt(0).toUpperCase()}
                    </div>
                    <h3 className="text-lg font-bold text-white">{selectedDokter.nama}</h3>
                    <span className="text-sm text-blue-300 font-semibold">{selectedDokter.spesialisasi}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-400 mb-1">ID Karyawan</p>
                      <p className="font-bold text-blue-300">DOK-{selectedDokter.id.substring(0, 5).toUpperCase()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Status</p>
                      <p className={`font-bold ${selectedDokter.isActive ? 'text-green-400' : 'text-red-400'}`}>
                        {selectedDokter.isActive ? 'Aktif' : 'Nonaktif'}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4 border-t border-slate-700">
                    <SecondaryButton onClick={() => setSelectedDokter(null)} className="bg-slate-700 hover:bg-slate-600">
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