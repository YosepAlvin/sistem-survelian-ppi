"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import Link from "next/link"
import axios from "axios"
import { PageHeader } from "@/components/ui/PageHeader"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { DataTable } from "@/components/ui/DataTable"
import { FormField, FormInput, FormSelect, FormTextarea } from "@/components/ui/FormField"
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton"
import { useToast } from "@/components/ui/Toast"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"
import { X, Search as SearchIcon, Trash2, Eye, UserPlus, LogOut } from 'lucide-react'
import { formatTanggal, getCurrentDateTimeLocal } from '@/lib/date-utils'

type Pasien = {
  id: string;
  no_rm: string;
  nama: string;
  diagnosa: string;
  tgl_masuk: string;
  tgl_lahir?: string;
  umur?: string;
  jk?: string;
  alamat?: string;
  ruangan?: string;
  hasActiveInfection: boolean;
  hasActiveDevice: boolean;
  status_pulang: string;
  riwayat_surveilans?: {
      hari_ke: number;
      tanggal: string;
      suhu: number;
      infeksi: string;
    }[];
    riwayat_alat?: {
      id: number;
      jenis_alat: string;
      tanggal_pasang: string;
      tanggal_lepas?: string;
      masih_terpasang: boolean;
      device_day: number;
    }[];
}

export default function PasienPage() {
  const { showToast } = useToast()
  const [pasienList, setPasienList] = useState<Pasien[]>([])
  const [loading, setLoading] = useState(true)
  const [ruanganList, setRuanganList] = useState<any[]>([])
  const [dokterList, setDokterList] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [selectedPasien, setSelectedPasien] = useState<Pasien | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [patientToDelete, setPatientToDelete] = useState<string | null>(null)
  const [isPulang, setIsPulang] = useState(false)
  const [patientToPulang, setPatientToPulang] = useState<string | null>(null)
  const [isTransfer, setIsTransfer] = useState(false)
  const [patientToTransfer, setPatientToTransfer] = useState<Pasien | null>(null)
  const [transferForm, setTransferForm] = useState({
    ruangan_tujuan_id: '',
    alasan: '',
    dokter_baru_id: '',
    tanggal_transfer: getCurrentDateTimeLocal()
  })
  const [isEditing, setIsEditing] = useState(false)
  const [editingPasienId, setEditingPasienId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    no_rm: '',
    nama: '',
    diagnosa: '',
    tgl_masuk: new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' }),
    tgl_lahir: '',
    jk: 'Perempuan',
    alamat: '',
    ruangan: '',
    dokter: ''
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const fetchPasien = useCallback(async () => {
    try {
      setLoading(true)
      const res = await axios.get("/api/pasien")
      setPasienList(res.data)
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Gagal Mengambil Data',
        message: 'Koneksi ke database bermasalah.'
      })
    } finally {
      setLoading(false)
    }
  }, [showToast])

  const fetchRuangan = useCallback(async () => {
    try {
      const res = await axios.get("/api/admin/ruangan")
      setRuanganList(res.data)
    } catch (err) {
      console.error("Gagal mengambil data ruangan:", err)
    }
  }, [])

  const fetchDokter = useCallback(async () => {
    try {
      const res = await axios.get("/api/admin/dokter")
      setDokterList(res.data)
    } catch (err) {
      console.error("Gagal mengambil data dokter:", err)
    }
  }, [])

  const validateForm = () => {
    const errors: Record<string, string> = {}
    if (!formData.no_rm) errors.no_rm = "Nomor Rekam Medis wajib diisi"
    if (!formData.nama) errors.nama = "Nama pasien wajib diisi"
    if (!formData.tgl_masuk) errors.tgl_masuk = "Tanggal masuk wajib diisi"
    if (!formData.diagnosa) errors.diagnosa = "Diagnosa awal wajib diisi"
    if (!formData.ruangan) errors.ruangan = "Ruangan wajib dipilih"
    if (!formData.dokter) errors.dokter = "Dokter wajib dipilih"
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  useEffect(() => {
    fetchPasien()
    fetchRuangan()
    fetchDokter()
  }, [fetchPasien, fetchRuangan, fetchDokter])

  const handleEditPatient = (row: Pasien) => {
    setEditingPasienId(row.id)
    setIsEditing(true)
    setShowForm(true)
    
    // Find ruangan id from ruangan list
    const ruangan = ruanganList.find(r => r.nama === row.ruangan)
    
    setFormData({
      no_rm: row.no_rm,
      nama: row.nama,
      diagnosa: row.diagnosa,
      tgl_masuk: row.tgl_masuk,
      tgl_lahir: row.tgl_lahir || '',
      jk: row.jk || 'Perempuan',
      alamat: row.alamat || '',
      ruangan: ruangan ? String(ruangan.id) : '',
      dokter: ''
    })
  }

  const handleSavePatient = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    try {
      if (isEditing && editingPasienId) {
        await axios.put(`/api/pasien/${editingPasienId}`, formData)
        showToast({
          type: 'success',
          title: 'Data Berhasil Diperbarui',
          message: `Data pasien ${formData.nama} telah diperbarui.`
        })
      } else {
        await axios.post("/api/pasien", formData)
        showToast({
          type: 'success',
          title: 'Registrasi Berhasil',
          message: `Pasien ${formData.nama} telah terdaftar.`
        })
      }
      setShowForm(false)
      setFormData({
        no_rm: '',
        nama: '',
        diagnosa: '',
        tgl_masuk: new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' }),
        tgl_lahir: '',
        jk: 'Perempuan',
        alamat: '',
        ruangan: '',
        dokter: ''
      })
      setIsEditing(false)
      setEditingPasienId(null)
      fetchPasien()
    } catch (err: any) {
      showToast({
        type: 'error',
        title: isEditing ? 'Gagal Memperbarui' : 'Gagal Mendaftarkan Pasien',
        message: err.response?.data?.error || err.message
      })
    }
  }

  const handleDelete = async () => {
    if (patientToDelete) {
      try {
        setIsDeleting(true)
        await axios.delete(`/api/pasien/${patientToDelete}`)
        showToast({
          type: 'success',
          title: 'Pasien Dihapus',
          message: 'Data pasien telah dihapus dari sistem.'
        })
        fetchPasien()
        setPatientToDelete(null)
      } catch (err: any) {
        showToast({
          type: 'error',
          title: 'Gagal Menghapus',
          message: err.response?.data?.error || 'Terjadi kesalahan sistem.'
        })
      } finally {
        setIsDeleting(false)
      }
    }
  }

  const handlePulangkan = async () => {
    if (patientToPulang) {
      try {
        setIsPulang(true)
        await axios.put(`/api/rawat-inap/${patientToPulang}`, {
          action: 'REQUEST_PULANG'
        })
        showToast({
          type: 'success',
          title: 'Permintaan Terkirim',
          message: 'Permintaan pulang pasien telah dikirim ke IPCN untuk verifikasi.'
        })
        fetchPasien()
        setPatientToPulang(null)
      } catch (err: any) {
        showToast({
          type: 'error',
          title: 'Gagal',
          message: err.response?.data?.error || 'Terjadi kesalahan sistem.'
        })
      } finally {
        setIsPulang(false)
      }
    }
  }

  const handleTransfer = async () => {
    if (patientToTransfer) {
      try {
        setIsTransfer(true)
        await axios.post("/api/transfer", {
          rawat_inap_id: parseInt(patientToTransfer.id),
          ruangan_tujuan_id: parseInt(transferForm.ruangan_tujuan_id),
          tanggal_transfer: transferForm.tanggal_transfer,
          alasan: transferForm.alasan,
          dokter_baru_id: transferForm.dokter_baru_id ? parseInt(transferForm.dokter_baru_id) : null
        })
        showToast({
          type: 'success',
          title: 'Permintaan Transfer Terkirim',
          message: 'Permintaan transfer pasien telah dikirim ke IPCN untuk verifikasi.'
        })
        setPatientToTransfer(null)
        setTransferForm({
          ruangan_tujuan_id: '',
          alasan: '',
          dokter_baru_id: '',
          tanggal_transfer: getCurrentDateTimeLocal()
        })
        fetchPasien()
      } catch (err: any) {
        showToast({
          type: 'error',
          title: 'Gagal',
          message: err.response?.data?.error || 'Terjadi kesalahan sistem.'
        })
      } finally {
        setIsTransfer(false)
      }
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-slate-800 bg-slate-900/95 px-6 py-8 shadow-xl shadow-slate-950/40">
          <PageHeader
            title="Daftar Pasien Aktif"
            description="Kelola data pasien yang sedang dirawat di rumah sakit"
            backHref="/ipcln/dashboard"
            breadcrumbs={[
              { label: "Dashboard", href: "/ipcln/dashboard" },
              { label: "Pasien" }
            ]}
            actions={
              <Button 
                onClick={() => {
                  if (showForm) {
                    setShowForm(false)
                    setIsEditing(false)
                    setEditingPasienId(null)
                    setFormData({
                      no_rm: '',
                      nama: '',
                      diagnosa: '',
                      tgl_masuk: new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' }),
                      tgl_lahir: '',
                      jk: 'Perempuan',
                      alamat: '',
                      ruangan: '',
                      dokter: ''
                    })
                  } else {
                    setShowForm(true)
                    setIsEditing(false)
                    setEditingPasienId(null)
                  }
                }}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                {showForm ? "Batal" : "Tambah Pasien Baru"}
              </Button>
            }
          />
        </div>

        {/* Patient Detail Modal */}
        {selectedPasien && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-in">
            <Card className="w-full max-w-xl bg-slate-900/95 border-slate-800">
              <CardHeader className="bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-t-lg">
                <div className="flex justify-between items-center">
                  <CardTitle>Detail Data Pasien</CardTitle>
                  <button 
                    onClick={() => setSelectedPasien(null)} 
                    className="p-1 hover:bg-purple-600 rounded transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="grid grid-cols-3 gap-2 text-sm border-b border-slate-700 pb-3">
                  <span className="text-slate-400 font-semibold">No. RM</span>
                  <span className="col-span-2 font-bold text-white">{selectedPasien.no_rm}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm border-b border-slate-700 pb-3">
                  <span className="text-slate-400 font-semibold">Nama Lengkap</span>
                  <span className="col-span-2 font-bold text-white">{selectedPasien.nama}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm border-b pb-3">
                  <span className="text-gray-500 font-semibold">Tgl Lahir</span>
                  <span className="col-span-2">{selectedPasien.tgl_lahir || "-"}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm border-b pb-3">
                  <span className="text-gray-500 font-semibold">Umur</span>
                  <span className="col-span-2 font-bold">{selectedPasien.umur ? `${selectedPasien.umur} Tahun` : "-"}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm border-b pb-3">
                  <span className="text-gray-500 font-semibold">Jenis Kelamin</span>
                  <span className="col-span-2">{selectedPasien.jk || "-"}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm border-b border-slate-700 pb-3">
                  <span className="text-slate-400 font-semibold">Diagnosa</span>
                  <span className="col-span-2 text-white">{selectedPasien.diagnosa}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm border-b pb-3">
                  <span className="text-gray-500 font-semibold">Tgl Masuk</span>
                  <span className="col-span-2">{selectedPasien.tgl_masuk}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <span className="text-gray-500 font-semibold">Alamat</span>
                  <span className="col-span-2">{selectedPasien.alamat || "-"}</span>
                </div>

                {/* Riwayat Surveilans Harian */}
                <div className="mt-8 pt-6 border-t border-slate-700">
                  <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-purple-600 rounded-full"></span>
                    Riwayat Perkembangan Surveilans
                  </h3>
                  <div className="border border-slate-700 rounded-lg overflow-hidden bg-slate-950">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-slate-900 border-b border-slate-700">
                          <th className="p-3 text-left font-semibold text-slate-200">Hari</th>
                          <th className="p-3 text-left font-semibold text-slate-200">Tanggal</th>
                          <th className="p-3 text-left font-semibold text-slate-200">Suhu</th>
                          <th className="p-3 text-left font-semibold text-slate-200">Infeksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedPasien.riwayat_surveilans && selectedPasien.riwayat_surveilans.length > 0 ? (
                          selectedPasien.riwayat_surveilans.map((log) => (
                            <tr key={log.hari_ke} className="border-b border-slate-700 last:border-0 hover:bg-slate-900 transition-colors">
                              <td className="p-3 font-semibold text-cyan-300">Ke-{log.hari_ke}</td>
                              <td className="p-3 text-slate-300">{log.tanggal}</td>
                              <td className="p-3 text-slate-300">{log.suhu}°C</td>
                              <td className="p-3">
                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold transition-colors ${
                                  log.infeksi === 'Ya' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                                }`}>
                                  {log.infeksi}
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="p-4 text-center text-gray-400 italic">Belum ada riwayat surveilans harian.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Riwayat Alat Medis */}
                <div className="mt-8 pt-6 border-t border-slate-700">
                  <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-blue-600 rounded-full"></span>
                    Riwayat Pemasangan Alat Medis
                  </h3>
                  <div className="border border-slate-700 rounded-lg overflow-hidden bg-slate-950">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-slate-900 border-b border-slate-700">
                          <th className="p-3 text-left font-semibold text-slate-200">Jenis Alat</th>
                          <th className="p-3 text-left font-semibold text-slate-200">Pasang</th>
                          <th className="p-3 text-left font-semibold text-slate-200">Lepas</th>
                          <th className="p-3 text-center font-semibold text-slate-200">Hari</th>
                          <th className="p-3 text-right font-semibold text-slate-200">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedPasien.riwayat_alat && selectedPasien.riwayat_alat.length > 0 ? (
                          selectedPasien.riwayat_alat.map((alat) => (
                            <tr key={alat.id} className="border-b border-slate-700 last:border-0 hover:bg-slate-900 transition-colors">
                              <td className="p-3 font-semibold text-white">{alat.jenis_alat}</td>
                              <td className="p-3 text-slate-400">{new Date(alat.tanggal_pasang).toLocaleDateString('id-ID')}</td>
                              <td className="p-3 text-slate-400">{alat.tanggal_lepas ? new Date(alat.tanggal_lepas).toLocaleDateString('id-ID') : "-"}</td>
                              <td className="p-3 text-center text-slate-200 font-bold">{alat.device_day}</td>
                              <td className="p-3 text-right">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                  alat.masih_terpasang ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-500/10 text-slate-500 border border-white/5'
                                }`}>
                                  {alat.masih_terpasang ? 'Aktif' : 'Dilepas'}
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="p-4 text-center text-gray-400 italic">Belum ada riwayat pemasangan alat.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
              <div className="bg-gray-50 p-4 flex justify-end rounded-b-lg border-t">
                <Button onClick={() => setSelectedPasien(null)} className="bg-gray-600 hover:bg-gray-700">Tutup</Button>
              </div>
            </Card>
          </div>
        )}

        {/* Patient Registration Form */}
        {showForm && (
          <Card className="mb-10 bg-slate-900/95 border border-slate-800">
            <CardHeader className="bg-slate-800 text-white rounded-t-lg">
              <CardTitle>{isEditing ? "Edit Data Pasien" : "Registrasi Pasien Baru"}</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSavePatient} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField label="No. RM" required error={formErrors.no_rm}>
                  <FormInput 
                    type="text" 
                    placeholder="Contoh: 12-34-56" 
                    value={formData.no_rm}
                    onChange={e => {
                      setFormData({...formData, no_rm: e.target.value})
                      if (formErrors.no_rm) setFormErrors({...formErrors, no_rm: ''})
                    }}
                    error={!!formErrors.no_rm}
                    className="bg-slate-800 text-white border-slate-700"
                  />
                </FormField>
                <FormField label="Nama Pasien" required error={formErrors.nama}>
                  <FormInput 
                    type="text" 
                    placeholder="Nama Lengkap" 
                    value={formData.nama}
                    onChange={e => {
                      setFormData({...formData, nama: e.target.value})
                      if (formErrors.nama) setFormErrors({...formErrors, nama: ''})
                    }}
                    error={!!formErrors.nama}
                  />
                </FormField>
                <FormField label="Tanggal Lahir">
                  <FormInput 
                    type="date" 
                    value={formData.tgl_lahir}
                    onChange={e => setFormData({...formData, tgl_lahir: e.target.value})}
                  />
                </FormField>
                <FormField label="Jenis Kelamin">
                  <FormSelect 
                    value={formData.jk}
                    onChange={e => setFormData({...formData, jk: e.target.value})}
                  >
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </FormSelect>
                </FormField>
                <FormField label="Ruangan" required error={formErrors.ruangan}>
                  <FormSelect 
                    value={formData.ruangan}
                    onChange={e => {
                      setFormData({...formData, ruangan: e.target.value})
                      if (formErrors.ruangan) setFormErrors({...formErrors, ruangan: ''})
                    }}
                    error={!!formErrors.ruangan}
                  >
                    <option value="">Pilih Ruangan</option>
                    {ruanganList.map((r: any) => (
                      <option key={r.id} value={r.id}>{r.nama}</option>
                    ))}
                  </FormSelect>
                </FormField>
                <FormField label="Dokter" required error={formErrors.dokter}>
                  <FormSelect 
                    value={formData.dokter}
                    onChange={e => {
                      setFormData({...formData, dokter: e.target.value})
                      if (formErrors.dokter) setFormErrors({...formErrors, dokter: ''})
                    }}
                    error={!!formErrors.dokter}
                  >
                    <option value="">Pilih Dokter</option>
                    {dokterList.map((d: any) => (
                      <option key={d.id} value={d.id}>{d.nama} ({d.spesialisasi})</option>
                    ))}
                  </FormSelect>
                </FormField>
                <FormField label="Diagnosa Awal" required error={formErrors.diagnosa}>
                  <FormInput 
                    type="text" 
                    placeholder="Diagnosa Medis" 
                    value={formData.diagnosa}
                    onChange={e => {
                      setFormData({...formData, diagnosa: e.target.value})
                      if (formErrors.diagnosa) setFormErrors({...formErrors, diagnosa: ''})
                    }}
                    error={!!formErrors.diagnosa}
                  />
                </FormField>
                <FormField label="Tanggal Masuk" required error={formErrors.tgl_masuk}>
                  <FormInput 
                    type="date" 
                    value={formData.tgl_masuk}
                    onChange={e => {
                      setFormData({...formData, tgl_masuk: e.target.value})
                      if (formErrors.tgl_masuk) setFormErrors({...formErrors, tgl_masuk: ''})
                    }}
                    error={!!formErrors.tgl_masuk}
                  />
                </FormField>
                <div className="md:col-span-2">
                  <FormField label="Alamat">
                    <FormTextarea 
                      placeholder="Alamat lengkap pasien" 
                      rows={3}
                      value={formData.alamat}
                      onChange={e => setFormData({...formData, alamat: e.target.value})}
                    />
                  </FormField>
                </div>
                <div className="md:col-span-2 flex gap-3">
                  <Button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700">
                    Simpan Data Pasien
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Patient List DataTable */}
        <Card className="bg-slate-900/95 border-slate-800">
          <CardHeader>
            <CardTitle>Daftar Pasien</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <LoadingSkeleton count={5} rows={1} />
            ) : (
              <DataTable
                columns={[
                  {
                    key: 'no_rm',
                    label: 'No. RM',
                    sortable: true,
                    className: 'font-medium'
                  },
                  {
                    key: 'nama',
                    label: 'Nama Pasien',
                    sortable: true,
                    className: 'font-semibold'
                  },
                  {
                    key: 'diagnosa',
                    label: 'Diagnosa',
                    sortable: true
                  },
                  {
                    key: 'tgl_masuk',
                    label: 'Tgl Masuk',
                    sortable: true,
                    render: (value: string) => formatTanggal(value)
                  },
                  {
                    key: 'id',
                    label: 'Aksi',
                    render: (value: string, row: Pasien) => (
                      <div className="flex gap-3">
                        <Link href={`/ipcln/surveilans-harian/${value}`} className="text-cyan-300 hover:text-white font-medium text-sm transition-colors">
                          Input Harian
                        </Link>
                        <button 
                          onClick={() => setSelectedPasien(row)}
                          className="text-cyan-300 hover:text-white font-medium text-sm transition-colors"
                        >
                          Detail
                        </button>
                        <button 
                          onClick={() => handleEditPatient(row)}
                          className="text-purple-300 hover:text-white font-medium text-sm transition-colors"
                        >
                          Edit
                        </button>
                        {row.status_pulang === 'NONE' && (
                          <button 
                            onClick={() => {
                              setPatientToTransfer(row)
                              setTransferForm({
                                ruangan_tujuan_id: '',
                                alasan: '',
                                dokter_baru_id: '',
                                tanggal_transfer: new Date().toISOString().slice(0, 16)
                              })
                            }}
                            className="text-orange-300 hover:text-white font-medium text-sm transition-colors"
                          >
                            Pindahkan
                          </button>
                        )}
                        {row.status_pulang === 'PENDING' && (
                          <span className="text-blue-300 text-xs italic font-medium">
                            Menunggu verifikasi IPCN
                          </span>
                        )}
                        {row.status_pulang === 'NONE' && !row.hasActiveInfection && !row.hasActiveDevice && (
                          <button 
                            onClick={() => setPatientToPulang(value)}
                            className="text-emerald-300 hover:text-white font-medium text-sm transition-colors flex items-center gap-1"
                          >
                            <LogOut size={14} />
                            Pulangkan
                          </button>
                        )}
                        {row.status_pulang === 'NONE' && (row.hasActiveInfection || row.hasActiveDevice) && (
                          <span className="text-amber-400 text-xs italic">
                            {row.hasActiveInfection && row.hasActiveDevice 
                              ? "Masih ada infeksi & alat terpasang" 
                              : row.hasActiveInfection 
                                ? "Masih ada infeksi aktif" 
                                : "Masih ada alat terpasang"}
                          </span>
                        )}
                        <button 
                          onClick={() => setPatientToDelete(value)}
                          className="text-rose-300 hover:text-white font-medium text-sm transition-colors"
                        >
                          Hapus
                        </button>
                      </div>
                    )
                  }
                ]}
                data={pasienList}
                loading={loading}
                emptyMessage="Belum ada pasien aktif"
                searchable
                searchPlaceholder="Cari Nama, No. RM, atau Diagnosa..."
                paginated
                pageSize={10}
              />
            )}
          </CardContent>
        </Card>

        <ConfirmDialog
          open={!!patientToDelete}
          title="Hapus Data Pasien"
          description="Apakah Anda yakin ingin menghapus data pasien ini? Tindakan ini tidak dapat dibatalkan."
          confirmText="Ya, Hapus"
          isDestructive
          isLoading={isDeleting}
          onConfirm={handleDelete}
          onCancel={() => setPatientToDelete(null)}
        />

        <ConfirmDialog
          open={!!patientToPulang}
          title="Pulangkan Pasien"
          description="Apakah Anda yakin ingin memulangkan pasien ini? Pasien tidak akan muncul lagi di daftar pasien aktif."
          confirmText="Ya, Pulangkan"
          isLoading={isPulang}
          onConfirm={handlePulangkan}
          onCancel={() => setPatientToPulang(null)}
        />

        {/* Transfer Modal */}
        {patientToTransfer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-in">
            <Card className="w-full max-w-lg bg-slate-900/95 border-slate-800">
              <CardHeader className="bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-t-lg">
                <div className="flex justify-between items-center">
                  <CardTitle>Pindahkan Pasien</CardTitle>
                  <button 
                    onClick={() => setPatientToTransfer(null)} 
                    className="p-1 hover:bg-orange-600 rounded transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="mb-4 p-4 bg-slate-800 rounded-lg">
                  <div className="text-sm text-slate-300">
                    <span className="font-bold text-white">{patientToTransfer.nama}</span> ({patientToTransfer.no_rm})
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-200 mb-2">Ruangan Tujuan</label>
                    <select
                      value={transferForm.ruangan_tujuan_id}
                      onChange={(e) => setTransferForm({...transferForm, ruangan_tujuan_id: e.target.value})}
                      className="w-full p-3 bg-slate-800 text-white border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Pilih Ruangan</option>
                      {ruanganList.map((r) => (
                        <option key={r.id} value={r.id}>{r.nama}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-slate-200 mb-2">Dokter Penanggung Jawab (Opsional)</label>
                    <select
                      value={transferForm.dokter_baru_id}
                      onChange={(e) => setTransferForm({...transferForm, dokter_baru_id: e.target.value})}
                      className="w-full p-3 bg-slate-800 text-white border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">Tetap Dokter Saat Ini</option>
                      {dokterList.map((d) => (
                        <option key={d.id} value={d.id}>{d.nama} ({d.spesialisasi})</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-slate-200 mb-2">Tanggal & Waktu Transfer</label>
                    <input
                      type="datetime-local"
                      value={transferForm.tanggal_transfer}
                      onChange={(e) => setTransferForm({...transferForm, tanggal_transfer: e.target.value})}
                      className="w-full p-3 bg-slate-800 text-white border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-slate-200 mb-2">Alasan Transfer (Opsional)</label>
                    <textarea
                      value={transferForm.alasan}
                      onChange={(e) => setTransferForm({...transferForm, alasan: e.target.value})}
                      rows={3}
                      placeholder="Masukkan alasan transfer..."
                      className="w-full p-3 bg-slate-800 text-white border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
              </CardContent>
              <div className="bg-slate-800 p-4 flex justify-end gap-3 rounded-b-lg border-t border-slate-700">
                <button 
                  onClick={() => setPatientToTransfer(null)} 
                  className="px-4 py-2 text-slate-200 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button 
                  onClick={handleTransfer}
                  disabled={isTransfer || !transferForm.ruangan_tujuan_id}
                  className="px-4 py-2 text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isTransfer ? "Mengirim..." : "Kirim Permintaan"}
                </button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
