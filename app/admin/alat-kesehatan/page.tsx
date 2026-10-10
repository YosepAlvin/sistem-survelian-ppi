"use client"

import React, { useState } from 'react'
import { PageHeader } from "@/components/ui/PageHeader"
import { Card, CardContent } from "@/components/ui/Card"
import { PrimaryButton } from "@/components/ui/PrimaryButton"
import { FormField, FormInput } from "@/components/ui/FormField"
import { DataTable } from "@/components/ui/DataTable"
import { Plus, Edit2, Trash2 } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { CrudModal } from '@/components/ui/CrudModal'
import useSWR from 'swr'
import axios from 'axios'
import { fetcher } from '@/lib/fetcher'

type AlatKesehatan = {
  id: number
  jenisAlat: string
  hariThreshold: number
  isActive: boolean
}

export default function AlatKesehatanPage() {
  const { showToast } = useToast()
  const { data: alatKesehatan, mutate } = useSWR<AlatKesehatan[]>('/api/admin/alat-kesehatan', fetcher)
  
  const [showModal, setShowModal] = useState(false)
  const [editingAlat, setEditingAlat] = useState<AlatKesehatan | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<AlatKesehatan | null>(null)
  const [formData, setFormData] = useState({
    jenisAlat: '',
    hariThreshold: 7,
    isActive: true
  })

  const handleOpenModal = (alat?: AlatKesehatan) => {
    if (alat) {
      setEditingAlat(alat)
      setFormData({
        jenisAlat: alat.jenisAlat,
        hariThreshold: alat.hariThreshold,
        isActive: alat.isActive
      })
    } else {
      setEditingAlat(null)
      setFormData({ jenisAlat: '', hariThreshold: 7, isActive: true })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingAlat(null)
    setFormData({ jenisAlat: '', hariThreshold: 7, isActive: true })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      if (editingAlat) {
        await axios.put('/api/admin/alat-kesehatan', {
          id: editingAlat.id,
          ...formData
        })
        showToast({
          type: 'success',
          title: 'Alat Kesehatan Berhasil Diperbarui',
          message: `Data untuk ${formData.jenisAlat} telah diperbarui.`
        })
      } else {
        await axios.post('/api/admin/alat-kesehatan', formData)
        showToast({
          type: 'success',
          title: 'Alat Kesehatan Berhasil Ditambahkan',
          message: `Alat ${formData.jenisAlat} telah ditambahkan.`
        })
      }
      mutate()
      handleCloseModal()
    } catch (err: any) {
      showToast({
        type: 'error',
        title: editingAlat ? 'Gagal Memperbarui Alat' : 'Gagal Menambahkan Alat',
        message: err.response?.data?.error || err.message
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return
    try {
      await axios.delete(`/api/admin/alat-kesehatan?id=${deleteConfirm.id}`)
      showToast({
        type: 'success',
        title: 'Alat Kesehatan Berhasil Dihapus',
        message: `Alat ${deleteConfirm.jenisAlat} telah dihapus.`
      })
      mutate()
      setDeleteConfirm(null)
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Gagal Menghapus Alat',
        message: err.response?.data?.error || err.message
      })
    }
  }

  const columns = [
    { key: 'jenisAlat', label: 'Jenis Alat' },
    { 
      key: 'hariThreshold', 
      label: 'Threshold Hari',
      render: (val: number) => `${val} hari`
    },
    { 
      key: 'isActive', 
      label: 'Status', 
      render: (val: boolean) => (
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${val ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {val ? 'Aktif' : 'Nonaktif'}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Aksi',
      render: (_: any, row: AlatKesehatan) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleOpenModal(row)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit"
          >
            <Edit2 size={16} />
          </button>
          <button
            onClick={() => setDeleteConfirm(row)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Hapus"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )
    }
  ]

  return (
    <>
      <PageHeader
        title="Alat Kesehatan"
        description="Kelola master data alat kesehatan dan threshold hari untuk evaluasi"
      />

      <div className="flex justify-end mb-6">
        <PrimaryButton onClick={() => handleOpenModal()} icon={<Plus size={18} />}>
          Tambah Alat Kesehatan
        </PrimaryButton>
      </div>

      <Card>
        <CardContent className="pt-6">
          {!alatKesehatan ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <DataTable
              data={alatKesehatan}
              columns={columns}
              searchable
              paginated
            />
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      <CrudModal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingAlat ? 'Edit Alat Kesehatan' : 'Tambah Alat Kesehatan'}
        loading={isSubmitting}
        onSubmit={handleSubmit}
      >
        <form id="crud-form" onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Jenis Alat" required>
            <FormInput
              type="text"
              value={formData.jenisAlat}
              onChange={(e) => setFormData({ ...formData, jenisAlat: e.target.value })}
              placeholder="Contoh: Vena sentra"
              required
            />
          </FormField>
          
          <FormField label="Threshold Hari" required>
            <FormInput
              type="number"
              min="1"
              value={formData.hariThreshold}
              onChange={(e) => setFormData({ ...formData, hariThreshold: parseInt(e.target.value) || 7 })}
              required
            />
          </FormField>

          <div className="flex items-center gap-3">
            <label className="text-sm text-slate-700">Status:</label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="accent-blue-500 w-4 h-4"
              />
              <span className="text-slate-700">Aktif</span>
            </label>
          </div>
        </form>
      </CrudModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteConfirm}
        onCancel={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Konfirmasi Hapus"
        description={`Apakah Anda yakin ingin menghapus alat kesehatan "${deleteConfirm?.jenisAlat}"?`}
        confirmText="Hapus"
        cancelText="Batal"
        isDestructive={true}
      />
    </>
  )
}
