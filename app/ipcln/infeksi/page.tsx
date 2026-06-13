"use client"

import React, { useState, useEffect, useCallback } from 'react'
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/ui/PageHeader"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { DataTable } from "@/components/ui/DataTable"
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton"
import { FormField, FormInput, FormSelect, FormTextarea } from "@/components/ui/FormField"
import { useToast } from "@/components/ui/Toast"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"
import { Plus } from 'lucide-react'
import axios from "axios"

type InfeksiReport = {
  id: string;
  tanggal: string;
  pasien: string;
  no_rm: string;
  jenis_infeksi: string;
  hari_ke: number;
  catatan?: string;
  status: 'MENUNGGU VERIFIKASI' | 'TERVERIFIKASI' | 'DITOLAK';
}

export default function InfeksiPage() {
  const { showToast } = useToast()
  const [reports, setReports] = useState<InfeksiReport[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selectedReport, setSelectedReport] = useState<InfeksiReport | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [reportToDelete, setReportToDelete] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    no_rm: '',
    pasien: '',
    jenis_infeksi: 'PHLEBITIS',
    tanggal: new Date().toISOString().split('T')[0],
    hari_ke: 1,
    catatan: ''
  })

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true)
      const res = await axios.get("/api/verifikasi")
      // Map API status to local status if needed
      const mapped = res.data.map((r: any) => ({
        ...r,
        status: r.status === 'PENDING' ? 'MENUNGGU VERIFIKASI' : 
                r.status === 'VERIFIED' ? 'TERVERIFIKASI' : 'DITOLAK'
      }))
      setReports(mapped)
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Gagal Memuat Data',
        message: 'Koneksi ke server terputus.'
      })
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  const handleReportInfeksi = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // For simplicity, we use the surveilans-harian API which handles patient creation too
      await axios.post("/api/surveilans-harian", {
        ...formData,
        infeksi: [{ jenis: formData.jenis_infeksi, ada: true, hari_ke: formData.hari_ke.toString(), hasil_kultur: formData.catatan }],
        ruangan: "ICU" // Default for simulation
      })
      showToast({
        type: 'success',
        title: 'Laporan Terkirim',
        message: 'Kejadian infeksi telah dilaporkan ke IPCN.'
      })
      setShowForm(false)
      setFormData({
        no_rm: '',
        pasien: '',
        jenis_infeksi: 'PHLEBITIS',
        tanggal: new Date().toISOString().split('T')[0],
        hari_ke: 1,
        catatan: ''
      })
      fetchReports()
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Gagal Melapor',
        message: err.response?.data?.error || err.message
      })
    }
  }

  const handleDelete = async () => {
    if (reportToDelete) {
      try {
        setIsDeleting(true)
        // Simulate delete or call API
        setReports(prev => prev.filter(r => r.id !== reportToDelete))
        showToast({
          type: 'info',
          title: 'Laporan Dihapus',
          message: 'Laporan telah ditarik kembali.'
        })
        setReportToDelete(null)
      } catch (err) {
        showToast({
          type: 'error',
          title: 'Gagal Menghapus',
          message: 'Terjadi kesalahan sistem.'
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
            title="Laporan Kejadian Infeksi"
            description="Input dan pantau kejadian infeksi untuk verifikasi oleh IPCN"
            actions={
              <Button 
                onClick={() => setShowForm(!showForm)}
                className="bg-purple-600 hover:bg-purple-700 flex items-center gap-2 text-white"
              >
                <Plus size={18} />
                {showForm ? "Batal" : "Lapor Infeksi Baru"}
              </Button>
            }
          />

          {/* Modal Detail Laporan Infeksi */}
          {selectedReport && (
            <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 animate-fade-in">
              <Card className="max-w-lg w-full overflow-hidden animate-slide-down bg-slate-900 border-slate-800">
                <CardHeader className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-4">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-white">Detail Laporan Infeksi</CardTitle>
                    <button onClick={() => setSelectedReport(null)} className="text-white hover:text-gray-200 text-2xl">&times;</button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 p-6">
                  <div className="grid grid-cols-3 gap-2 text-sm border-b border-slate-700 pb-3">
                    <span className="text-slate-500 font-semibold">Tgl Lapor</span>
                    <span className="col-span-2 text-white">{selectedReport.tanggal}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm border-b border-slate-700 pb-3">
                    <span className="text-slate-500 font-semibold">Pasien</span>
                    <span className="col-span-2 font-bold text-white">{selectedReport.pasien} (RM: {selectedReport.no_rm})</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm border-b border-slate-700 pb-3">
                    <span className="text-slate-500 font-semibold">Jenis Infeksi</span>
                    <span className="col-span-2 text-purple-400 font-bold">{selectedReport.jenis_infeksi}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm border-b border-slate-700 pb-3">
                    <span className="text-slate-500 font-semibold">Hari Ke-</span>
                    <span className="col-span-2 text-white">{selectedReport.hari_ke}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm border-b border-slate-700 pb-3">
                    <span className="text-slate-500 font-semibold">Status</span>
                    <span className={`col-span-2 font-bold ${
                      selectedReport.status === 'MENUNGGU VERIFIKASI' ? 'text-amber-400' :
                      selectedReport.status === 'TERVERIFIKASI' ? 'text-emerald-400' : 'text-rose-400'
                    }`}>{selectedReport.status}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-500 font-semibold text-sm">Catatan / Keterangan:</span>
                    <p className="p-3 bg-slate-950 rounded border border-slate-800 text-sm italic text-slate-300">
                      {selectedReport.catatan || "Tidak ada catatan."}
                    </p>
                  </div>
                </CardContent>
                <div className="bg-slate-900 p-4 flex justify-end border-t border-slate-800">
                  <Button onClick={() => setSelectedReport(null)} className="bg-slate-700 hover:bg-slate-600 text-white">Tutup</Button>
                </div>
              </Card>
            </div>
          )}

          {/* Form Input */}
          {showForm && (
            <Card className="mb-8 border border-purple-800 bg-purple-950/30 mt-6">
              <CardHeader>
                <CardTitle className="text-white">Form Laporan Infeksi</CardTitle>
                <CardDescription className="text-purple-300">Isi form di bawah untuk melaporkan kejadian infeksi</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleReportInfeksi} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField label="No. RM Pasien" required>
                    <FormInput type="text" placeholder="Contoh: 12-34-56" value={formData.no_rm} onChange={e => setFormData({...formData, no_rm: e.target.value})} className="bg-slate-950 border-slate-700 text-white" />
                  </FormField>

                  <FormField label="Nama Pasien" required>
                    <FormInput type="text" placeholder="Nama Pasien" value={formData.pasien} onChange={e => setFormData({...formData, pasien: e.target.value})} className="bg-slate-950 border-slate-700 text-white" />
                  </FormField>

                  <FormField label="Jenis Infeksi">
                    <FormSelect value={formData.jenis_infeksi} onChange={e => setFormData({...formData, jenis_infeksi: e.target.value})} className="bg-slate-950 border-slate-700 text-white">
                      <option value="PHLEBITIS">Phlebitis</option>
                      <option value="ISK">ISK (Infeksi Saluran Kemih)</option>
                      <option value="HAP">HAP (Hospital Acquired Pneumonia)</option>
                      <option value="VAP">VAP (Ventilator Associated Pneumonia)</option>
                      <option value="IADP">IADP (Infeksi Aliran Darah Primer)</option>
                      <option value="DEKUBITUS">Dekubitus</option>
                    </FormSelect>
                  </FormField>

                  <FormField label="Tanggal Kejadian" required>
                    <FormInput type="date" value={formData.tanggal} onChange={e => setFormData({...formData, tanggal: e.target.value})} className="bg-slate-950 border-slate-700 text-white" />
                  </FormField>

                  <FormField label="Infeksi Hari Ke-">
                    <FormInput type="number" placeholder="Contoh: 3" value={String(formData.hari_ke)} onChange={e => setFormData({...formData, hari_ke: parseInt(e.target.value) || 0})} className="bg-slate-950 border-slate-700 text-white" />
                  </FormField>

                  <div className="md:col-span-2">
                    <FormField label="Catatan / Hasil Kultur">
                      <FormTextarea rows={3} placeholder="Masukkan hasil laboratorium atau catatan klinis..." value={formData.catatan} onChange={e => setFormData({...formData, catatan: e.target.value})} className="bg-slate-950 border-slate-700 text-white" />
                    </FormField>
                  </div>

                  <div className="md:col-span-2 pt-4">
                    <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white">Kirim Laporan ke IPCN</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
          
          {/* Data Table */}
          {loading ? (
            <LoadingSkeleton count={1} rows={5} />
          ) : (
            <Card className="mt-6 border-slate-800 bg-slate-900/95">
              <CardHeader>
                <CardTitle className="text-white">Riwayat Laporan Infeksi</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <DataTable
                  columns={[
                    { key: 'tanggal' as any, label: 'Tgl Lapor', sortable: true, className: 'text-slate-300' },
                    { 
                      key: 'pasien' as any, 
                      label: 'Pasien',
                      render: (_, row) => (
                        <div>
                          <div className="font-bold text-slate-100">{row.pasien}</div>
                          <div className="text-xs text-slate-500">RM: {row.no_rm}</div>
                        </div>
                      )
                    },
                    { 
                      key: 'jenis_infeksi' as any, 
                      label: 'Jenis Infeksi',
                      render: (value) => (
                        <span className="px-2 py-1 bg-purple-900/30 text-purple-400 border border-purple-500/20 rounded text-xs font-bold uppercase">{value}</span>
                      )
                    },
                    { key: 'hari_ke' as any, label: 'Hari Ke', className: 'text-center text-slate-300' },
                    { 
                      key: 'status' as any, 
                      label: 'Status',
                      render: (value) => (
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          value === 'MENUNGGU VERIFIKASI' ? 'bg-amber-900/30 text-amber-400' :
                          value === 'TERVERIFIKASI' ? 'bg-emerald-900/30 text-emerald-400' :
                          'bg-rose-900/30 text-rose-400'
                        }`}>
                          {value}
                        </span>
                      )
                    },
                    { 
                      key: 'id' as any, 
                      label: 'Aksi',
                      render: (_, row: InfeksiReport) => (
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setSelectedReport(row)}
                            className="text-purple-400 hover:text-white font-medium text-sm transition-colors"
                          >
                            Detail
                          </button>
                          {row.status === 'MENUNGGU VERIFIKASI' && (
                            <button 
                              onClick={() => setReportToDelete(row.id)}
                              className="text-rose-400 hover:text-white font-medium text-sm transition-colors"
                            >
                              Hapus
                            </button>
                          )}
                        </div>
                      )
                    }
                  ]}
                  data={reports}
                  emptyMessage="Belum ada laporan kejadian infeksi"
                  searchable
                  searchPlaceholder="Cari Nama Pasien atau No. RM..."
                  paginated
                  pageSize={10}
                />
              </CardContent>
            </Card>
          )}

          <ConfirmDialog
            open={!!reportToDelete}
            title="Hapus Laporan"
            description="Apakah Anda yakin ingin menarik kembali laporan ini? Tindakan ini tidak dapat dibatalkan."
            confirmText="Ya, Hapus"
            isDestructive
            isLoading={isDeleting}
            onConfirm={handleDelete}
            onCancel={() => setReportToDelete(null)}
          />
        </div>
      </div>
    </div>
  )
}
