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
import { Plus, Eye, Trash2, Edit2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/Toast"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"
import axios from "axios"

type Ruangan = {
  id: string;
  nama: string;
  kode: string;
  kategori: string;
}

export default function RuanganPage() {
  const { showToast } = useToast()
  const [ruanganList, setRuanganList] = useState<Ruangan[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selectedRuangan, setSelectedRuangan] = useState<Ruangan | null>(null)
  const [editingRuangan, setEditingRuangan] = useState<Ruangan | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [ruanganToDelete, setRuanganToDelete] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    nama: '',
    kode: '',
    kategori: 'RANAP'
  })

  const fetchRuangan = useCallback(async () => {
    try {
      setLoading(true)
      const res = await axios.get("/api/admin/ruangan")
      setRuanganList(res.data)
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Gagal Memuat Ruangan',
        message: 'Tidak dapat terhubung ke database.'
      })
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    fetchRuangan()
  }, [fetchRuangan])

  const handleSaveRuangan = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingRuangan) {
        await axios.put("/api/admin/ruangan", {
          id: editingRuangan.id,
          ...formData
        })
        showToast({
          type: 'success',
          title: 'Ruangan Diperbarui',
          message: `Ruangan ${formData.nama} berhasil diperbarui.`
        })
      } else {
        await axios.post("/api/admin/ruangan", formData)
        showToast({
          type: 'success',
          title: 'Ruangan Tersimpan',
          message: `Ruangan ${formData.nama} berhasil ditambahkan.`
        })
      }
      setShowForm(false)
      setEditingRuangan(null)
      setFormData({ nama: '', kode: '', kategori: 'RANAP' })
      fetchRuangan()
    } catch (err: any) {
      showToast({
        type: 'error',
        title: editingRuangan ? 'Gagal Memperbarui' : 'Gagal Menyimpan',
        message: err.response?.data?.error || err.message
      })
    }
  }

  const handleEditRuangan = (ruangan: Ruangan) => {
    setEditingRuangan(ruangan)
    setFormData({
      nama: ruangan.nama,
      kode: ruangan.kode,
      kategori: ruangan.kategori
    })
    setShowForm(true)
  }

  const handleDelete = async () => {
    if (!ruanganToDelete) return

    try {
      setIsDeleting(true)
      await axios.delete("/api/admin/ruangan", { params: { id: ruanganToDelete } })
      showToast({
        type: 'success',
        title: 'Berhasil Dihapus',
        message: 'Master data ruangan telah dihapus.'
      })
      setRuanganToDelete(null)
      fetchRuangan()
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
            title="Master Data Ruangan"
            description="Kelola data ruangan dan kategori unit pelayanan"
            actions={
              <PrimaryButton
                onClick={() => {
                  setEditingRuangan(null)
                  setFormData({ nama: '', kode: '', kategori: 'RANAP' })
                  setShowForm(!showForm)
                }}
                icon={<Plus size={18} />}
              >
                {showForm ? "Batal" : "Tambah Ruangan"}
              </PrimaryButton>
            }
          />

          {showForm && (
            <Card className="mb-8 border-blue-800 bg-blue-950/30 mt-6">
              <CardHeader>
                <CardTitle className="text-white">{editingRuangan ? "Edit Ruangan" : "Tambah Ruangan Baru"}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveRuangan} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField label="Nama Ruangan" required>
                      <FormInput
                        type="text"
                        placeholder="Contoh: Bangsal Anggrek"
                        value={formData.nama}
                        onChange={e => setFormData({...formData, nama: e.target.value})}
                        required
                        className="bg-slate-950 border-slate-700 text-white placeholder-slate-400"
                      />
                    </FormField>

                    <FormField label="Kode Ruangan" required>
                      <FormInput
                        type="text"
                        placeholder="Contoh: ANG"
                        value={formData.kode}
                        onChange={e => setFormData({...formData, kode: e.target.value})}
                        required
                        className="bg-slate-950 border-slate-700 text-white placeholder-slate-400"
                      />
                    </FormField>

                    <FormField label="Kategori" required>
                      <FormSelect
                        value={formData.kategori}
                        onChange={e => setFormData({...formData, kategori: e.target.value})}
                        className="bg-slate-950 border-slate-700 text-white"
                      >
                        <option value="RANAP">Rawat Inap</option>
                        <option value="INTENSIF">Intensif (ICU/NICU)</option>
                        <option value="KHUSUS">Khusus (IGD/OK)</option>
                      </FormSelect>
                    </FormField>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <SecondaryButton onClick={() => {
                      setShowForm(false)
                      setEditingRuangan(null)
                    }} className="bg-slate-700 hover:bg-slate-600">
                      Batal
                    </SecondaryButton>
                    <PrimaryButton type="submit" className="bg-blue-600 hover:bg-blue-700">
                      {editingRuangan ? "Perbarui Ruangan" : "Simpan Ruangan"}
                    </PrimaryButton>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {loading ? (
            <LoadingSkeleton />
          ) : ruanganList.length === 0 ? (
            <EmptyState
              title="Belum ada data ruangan"
              description="Mulai dengan menambahkan ruangan baru untuk unit pelayanan Anda"
            />
          ) : (
            <Card className="mt-6 border-slate-800 bg-slate-900/95">
              <CardHeader>
                <CardTitle className="text-white">Daftar Ruangan ({ruanganList.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <DataTable
                  columns={[
                    {
                      key: 'nama',
                      label: 'Nama Ruangan',
                      sortable: true,
                      className: 'text-slate-100'
                    },
                    {
                      key: 'kode',
                      label: 'Kode',
                      render: (value) => (
                        <span className="font-mono text-sm text-blue-400">{value}</span>
                      )
                    },
                    {
                      key: 'kategori',
                      label: 'Kategori',
                      render: (value) => (
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-900/30 text-blue-300 border border-blue-500/20">
                          {value === 'RANAP' ? 'Rawat Inap' : value === 'INTENSIF' ? 'Intensif' : 'Khusus'}
                        </span>
                      )
                    },
                    {
                      key: 'id',
                      label: 'Aksi',
                      render: (value, row: Ruangan) => (
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditRuangan(row)}
                            title="Edit Ruangan"
                            aria-label="Edit Ruangan"
                            className="text-slate-300 hover:text-white hover:bg-slate-800"
                          >
                            <Edit2 size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedRuangan(row)}
                            title="Lihat detail"
                            aria-label="Lihat detail"
                            className="text-slate-300 hover:text-white hover:bg-slate-800"
                          >
                            <Eye size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setRuanganToDelete(value)}
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
                  data={ruanganList}
                  stickyHeader
                  searchable
                  searchPlaceholder="Cari Nama Ruangan atau Kode..."
                  paginated
                  pageSize={10}
                />
              </CardContent>
            </Card>
          )}

          <ConfirmDialog
            open={!!ruanganToDelete}
            title="Hapus Data Ruangan"
            description="Apakah Anda yakin ingin menghapus data ruangan ini? Seluruh relasi data mungkin terdampak."
            confirmText="Ya, Hapus"
            isDestructive
            isLoading={isDeleting}
            onConfirm={handleDelete}
            onCancel={() => setRuanganToDelete(null)}
          />

          {selectedRuangan && (
            <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 animate-fade-in">
              <Card className="max-w-md w-full overflow-hidden animate-slide-down bg-slate-900 border-slate-800">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                  <CardTitle className="text-white flex justify-between items-center">
                    Detail Ruangan
                    <Button variant="ghost" size="icon" onClick={() => setSelectedRuangan(null)} aria-label="Tutup" className="text-white hover:bg-white/10">×</Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <div className="flex flex-col items-center pb-4 border-b border-slate-700">
                    <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-300 font-bold text-xl mb-3 border border-blue-500/30">
                      {selectedRuangan.kode}
                    </div>
                    <h3 className="text-lg font-bold text-white">{selectedRuangan.nama}</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Kode</p>
                      <p className="font-bold text-blue-300">{selectedRuangan.kode}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Kategori</p>
                      <p className="font-bold text-white">
                        {selectedRuangan.kategori === 'RANAP' ? 'Rawat Inap' : selectedRuangan.kategori === 'INTENSIF' ? 'Intensif' : 'Khusus'}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4 border-t border-slate-700">
                    <SecondaryButton onClick={() => setSelectedRuangan(null)} className="bg-slate-700 hover:bg-slate-600">
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