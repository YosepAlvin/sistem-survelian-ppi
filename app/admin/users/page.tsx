"use client"

import React, { useState } from 'react'
import { PageHeader } from "@/components/ui/PageHeader"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { PrimaryButton } from "@/components/ui/PrimaryButton"
import { SecondaryButton } from "@/components/ui/SecondaryButton"
import { FormField, FormInput, FormSelect } from "@/components/ui/FormField"
import { DataTable } from "@/components/ui/DataTable"
import { Plus, Eye, ToggleRight, Loader2, Edit2 } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import useSWR from 'swr'
import axios from 'axios'
import { fetcher } from '@/lib/fetcher'

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

  const [showForm, setShowForm] = useState(false)
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
      setShowForm(false)
      setEditingUser(null)
      setFormData({ nama: '', email: '', role: 'IPCLN', ruanganId: '', password: '' })
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

  const openEditUser = (user: User) => {
    setEditingUser(user)
    setFormData({
      nama: user.nama,
      email: user.email,
      role: user.role,
      ruanganId: user.ruangan?.id || '',
      password: ''
    })
    setShowForm(true)
  }

  if (usersError) return <div className="p-8 text-center text-red-500">Gagal memuat data user</div>
  if (!users) return <div className="p-8 text-center"><Loader2 className="animate-spin mx-auto" /></div>

  return (
    <>
      <PageHeader
        title="Manajemen User"
        description="Kelola akun pengguna, role, dan hak akses sistem"
        actions={
          <PrimaryButton
            onClick={() => {
              setEditingUser(null)
              setFormData({ nama: '', email: '', role: 'IPCLN', ruanganId: '', password: '' })
              setShowForm(!showForm)
            }}
            icon={<Plus size={18} />}
          >
            {showForm ? "Batal" : "Tambah User"}
          </PrimaryButton>
        }
      />

      {showForm && (
        <Card className="mb-8 border-purple-200 bg-slate-900">
          <CardHeader>
            <CardTitle>{editingUser ? "Edit User" : "Tambah User Baru"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddUser} className="space-y-4">
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

              <div className="flex justify-end gap-3 pt-4">
                <SecondaryButton onClick={() => {
                  setShowForm(false)
                  setEditingUser(null)
                }}>
                  Batal
                </SecondaryButton>
                <PrimaryButton type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Menyimpan..." : editingUser ? "Perbarui User" : "Simpan User"}
                </PrimaryButton>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Daftar User ({users.length})</CardTitle>
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
                    ADMIN: 'bg-blue-900/30 text-blue-400 border-blue-500/20',
                    IPCN: 'bg-green-900/30 text-green-400 border-green-500/20',
                    IPCLN: 'bg-purple-900/30 text-purple-400 border-purple-500/20',
                  }
                  return (
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${colors[value] || 'bg-slate-800 text-slate-400 border-slate-700'}`}>
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
                      ? 'bg-emerald-900/30 text-emerald-400'
                      : 'bg-slate-800 text-slate-400'
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
                      className="p-1.5 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors"
                      title={row.status === 'Aktif' ? 'Nonaktifkan' : 'Aktifkan'}
                    >
                      <ToggleRight size={18} className={row.status === 'Aktif' ? 'text-emerald-400' : 'text-slate-600'} />
                    </button>
                    <button
                      onClick={() => openEditUser(row)}
                      className="p-1.5 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors"
                      title="Edit User"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => openUserDetail(row)}
                      className="p-1.5 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors"
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

      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-lg overflow-hidden">
            <CardHeader className="bg-slate-950 border-b border-white/10">
              <CardTitle>Detail User</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500">Nama</p>
                  <p className="font-semibold text-white">{selectedUser.nama}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Email</p>
                  <p className="font-semibold text-white">{selectedUser.email}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Role</p>
                  <p className="font-semibold text-white">{selectedUser.role}</p>
                </div>
                <div>
                      <p className="text-xs text-slate-500">Ruangan</p>
                      <p className="font-semibold text-white">{selectedUser.ruangan?.nama || '-'}</p>
                    </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
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
