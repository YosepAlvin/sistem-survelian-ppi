"use client"

import React, { useState } from 'react'
import { PageHeader } from "@/components/ui/PageHeader"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { PrimaryButton } from "@/components/ui/PrimaryButton"
import { SecondaryButton } from "@/components/ui/SecondaryButton"
import { FormField, FormInput, FormSelect } from "@/components/ui/FormField"
import { DataTable } from "@/components/ui/DataTable"
import { Plus, Eye, ToggleRight, Loader2, Edit2, Download, Upload } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import useSWR from 'swr'
import axios from 'axios'
import { fetcher } from '@/lib/fetcher'
import { readExcelFile, generateTemplate } from "@/lib/excel-import"
import { Button } from '@/components/ui/button'
import { CrudModal } from '@/components/ui/CrudModal'

type User = {
  id: string;
  nama: string;
  email: string;
  role: string;
  ruangan?: { id: string; nama: string } | null;
  status: 'Aktif' | 'Nonaktif';
}

export default function UsersPage() {
  const { showToast } = useToast()
  const { data: users, error: usersError, mutate: mutateUsers } = useSWR<User[]>('/api/admin/users', fetcher)
  const { data: roles } = useSWR<any[]>('/api/admin/roles', fetcher)
  const { data: ruangan } = useSWR<any[]>('/api/admin/ruangan', fetcher)

  const [showModal, setShowModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    nama: '',
    email: '',
    role: 'IPCLN',
    ruanganId: '',
    password: ''
  })

  const handleOpenModal = (user?: User) => {
    if (user) {
      setEditingUser(user)
      setFormData({
        nama: user.nama,
        email: user.email,
        role: user.role,
        ruanganId: user.ruangan?.id || '',
        password: ''
      })
    } else {
      setEditingUser(null)
      setFormData({ nama: '', email: '', role: 'IPCLN', ruanganId: '', password: '' })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingUser(null)
    setFormData({ nama: '', email: '', role: 'IPCLN', ruanganId: '', password: '' })
  }

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      if (editingUser) {
        await axios.put('/api/admin/users', {
          id: editingUser.id,
          ...formData
        })
        showToast({
          type: 'success',
          title: 'User Berhasil Diperbarui',
          message: `Data untuk ${formData.nama} telah diperbarui.`
        })
      } else {
        await axios.post('/api/admin/users', formData)
        showToast({
          type: 'success',
          title: 'User Berhasil Ditambahkan',
          message: `Akun untuk ${formData.nama} telah aktif.`
        })
      }
      mutateUsers()
      handleCloseModal()
    } catch (err: any) {
      showToast({
        type: 'error',
        title: editingUser ? 'Gagal Memperbarui User' : 'Gagal Menambahkan User',
        message: err.response?.data?.error || err.message
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleStatus = async (id: string, currentStatus: string) => {
    try {
      const response = await axios.put('/api/admin/users', {
        id,
        isActive: currentStatus !== 'Aktif'
      })
      if (response.data.success) {
        mutateUsers()
        showToast({
          type: 'info',
          title: 'Status Diperbarui',
          message: `User ${currentStatus === 'Aktif' ? 'dinonaktifkan' : 'diaktifkan'}.`
        })
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Gagal Mengubah Status',
        message: err.response?.data?.error || err.message
      })
    }
  }

  const openUserDetail = (user: User) => {
    setSelectedUser(user)
  }

  const handleDownloadTemplate = () => {
    generateTemplate(
      ['nama', 'email', 'role', 'ruanganId', 'password'],
      'template_users'
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
      await axios.post("/api/admin/users/import", data)
      showToast({
        type: 'success',
        title: 'Import Berhasil',
        message: `${data.length} data user berhasil diimport.`
      })
      mutateUsers()
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Gagal Import',
        message: err.response?.data?.error || err.message
      })
    }
  }

  if (usersError) return <div className="p-8 text-center text-red-500">Gagal memuat data user</div>
  if (!users) return <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto" /></div>

  return (
    <>
      <PageHeader
        title="Manajemen User"
        description="Kelola akun pengguna, role, dan hak akses sistem"
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
              Tambah User
            </PrimaryButton>
          </div>
        }
      />

      <Card className="bg-white border-slate-200">
        <CardHeader>
          <CardTitle className="text-slate-900">Daftar User ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={[
              {
                key: 'nama',
                label: 'Nama',
                sortable: true,
              },
              {
                key: 'email',
                label: 'Email',
                sortable: true,
              },
              {
                key: 'role',
                label: 'Role',
                render: (value) => {
                  const colors: any = {
                    ADMIN: 'bg-blue-50 text-blue-700 border-blue-200',
                    IPCN: 'bg-green-50 text-green-700 border-green-200',
                    IPCLN: 'bg-purple-50 text-purple-700 border-purple-200',
                  }
                  return (
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${colors[value] || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                      {value}
                    </span>
                  )
                }
              },
              {
                      key: 'ruangan',
                      label: 'Ruangan',
                      render: (value) => value?.nama || '-'
                    },
              {
                key: 'status',
                label: 'Status',
                render: (value) => (
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    value === 'Aktif'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-50 text-slate-600 border border-slate-200'
                  }`}>
                    {value}
                  </span>
                )
              },
              {
                key: 'id',
                label: 'Aksi',
                render: (value, row: User) => (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleStatus(value, row.status)}
                      className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-600 hover:text-slate-900 transition-colors"
                      title={row.status === 'Aktif' ? 'Nonaktifkan' : 'Aktifkan'}
                    >
                      <ToggleRight size={18} className={row.status === 'Aktif' ? 'text-emerald-700' : 'text-slate-600'} />
                    </button>
                    <button
                      onClick={() => handleOpenModal(row)}
                      className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600 hover:text-blue-800 transition-colors"
                      title="Edit User"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => openUserDetail(row)}
                      className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-600 hover:text-slate-900 transition-colors"
                      title="Lihat Detail"
                    >
                      <Eye size={18} />
                    </button>
                  </div>
                )
              }
            ]}
            data={users}
            searchable
            searchPlaceholder="Cari Nama, Email, atau Role..."
            paginated
            pageSize={10}
          />
        </CardContent>
      </Card>

      <CrudModal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingUser ? "Edit User" : "Tambah User Baru"}
        loading={isSubmitting}
        onSubmit={handleAddUser}
      >
        <form id="crud-form" onSubmit={handleAddUser} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Nama Lengkap" required>
                  <FormInput
                    type="text"
                    placeholder="Nama user"
                    value={formData.nama}
                    onChange={e => setFormData({...formData, nama: e.target.value})}
                    required
                  />
                </FormField>

                <FormField label="Email" required>
                  <FormInput
                    type="email"
                    placeholder="email@rs.com"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    required
                  />
                </FormField>

                <FormField label="Role" required>
                  <FormSelect
                    value={formData.role}
                    onChange={e => setFormData({...formData, role: e.target.value})}
                  >
                    {roles?.map(role => (
                      <option key={role.id} value={role.name}>{role.name}</option>
                    ))}
                  </FormSelect>
                </FormField>

                <FormField label="Ruangan (Jika IPCLN)">
                  <FormSelect
                    value={formData.ruanganId}
                    onChange={e => setFormData({...formData, ruanganId: e.target.value})}
                  >
                    <option value="">- Pilih Ruangan -</option>
                    {ruangan?.map(r => (
                      <option key={r.id} value={r.id}>{r.nama}</option>
                    ))}
                  </FormSelect>
                </FormField>

                <FormField label={editingUser ? "Password (Kosongkan jika tidak diubah" : "Password"} required={!editingUser}>
                  <FormInput
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                    required={!editingUser}
                  />
                </FormField>
              </div>
            </form>
      </CrudModal>

      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-lg overflow-hidden">
            <CardHeader className="bg-slate-50 border-b border-slate-200">
              <CardTitle className="text-slate-900 flex justify-between items-center">
                Detail User
                <Button variant="ghost" size="icon" onClick={() => setSelectedUser(null)} aria-label="Tutup">
                  ×
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-600">Nama</p>
                  <p className="font-semibold text-slate-900">{selectedUser.nama}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600">Email</p>
                  <p className="font-semibold text-slate-900">{selectedUser.email}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600">Role</p>
                  <p className="font-semibold text-slate-900">{selectedUser.role}</p>
                </div>
                <div>
                      <p className="text-xs text-slate-600">Ruangan</p>
                      <p className="font-semibold text-slate-900">{selectedUser.ruangan?.nama || '-'}</p>
                    </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <SecondaryButton onClick={() => setSelectedUser(null)}>
                  Tutup
                </SecondaryButton>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
