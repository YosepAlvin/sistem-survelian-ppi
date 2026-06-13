"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/ui/PageHeader"
import { DataTable } from "@/components/ui/DataTable"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { StatCard } from "@/components/ui/StatCard"
import { useToast } from "@/components/ui/Toast"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"
import AuditTrailViewer from "@/components/ui/AuditTrailViewer"
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react'
import axios from "axios"
import { formatTanggal } from '@/lib/date-utils'

type Report = {
  id: string
  rawat_inap_id: number
  tanggal: string
  ruangan: string
  pasien: string
  no_rm: string
  jenis_infeksi: string
  detail: string
  status: 'PENDING' | 'VERIFIED' | 'REJECTED'
  statusLabel: string
  statusTone: string
  tanggal_masuk: string
  lama_rawat_hari: number
  alat_terpasang: Array<{
    jenis_alat: string
    tanggal_pasang: string | null
    tanggal_lepas: string | null
    masih_terpasang: boolean
    device_day: number
  }>
  riwayat_infeksi: Array<{
    jenis_infeksi: string
    tanggal_kejadian: string
    tanggal_selesai: string | null
    hari_ke: number | null
    status: string
    catatan: string
  }>
  audit_trail: {
    dibuat_oleh: string | null
    dibuat_pada: string | null
    diubah_oleh: string | null
    diubah_pada: string | null
    diverifikasi_oleh: string | null
    diverifikasi_pada: string | null
  }
}

export default function VerifikasiInfeksiPage() {
  const { showToast } = useToast()
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>("PENDING")
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [rejectReason, setRejectReason] = useState("")
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [reportingToReject, setReportingToReject] = useState<{ id: string; entityType: string } | null>(null)
  const [ruanganList, setRuanganList] = useState<any[]>([])
  const [filterRuangan, setFilterRuangan] = useState<string>("ALL")

  const fetchRuangan = useCallback(async () => {
    try {
      const res = await axios.get("/api/admin/ruangan")
      setRuanganList(res.data)
    } catch (err) {
      console.error("Gagal mengambil data ruangan:", err)
    }
  }, [])

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true)
      const res = await axios.get("/api/verifikasi")
      setReports(res.data)
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Gagal Mengambil Data',
        message: 'Tidak dapat terhubung ke server.'
      })
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    fetchReports()
    fetchRuangan()
  }, [fetchReports, fetchRuangan])

  const handleVerify = async (id: string, entityType: string) => {
    if (!confirm('Apakah Anda yakin ingin memverifikasi laporan ini?')) {
      return;
    }
    try {
      await axios.put("/api/verifikasi", { id, action: 'VERIFY', entityType })
      showToast({
        type: 'success',
        title: 'Berhasil Diverifikasi',
        message: 'Laporan infeksi telah disetujui.'
      })
      fetchReports()
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Gagal Verifikasi',
        message: err.response?.data?.error || err.message
      })
    }
  }

  const handleCloseCase = async (id: string, entityType: string) => {
    if (!confirm('Apakah Anda yakin ingin menutup kasus ini?')) {
      return;
    }
    try {
      if (entityType === 'SurveilansIdo') {
        await axios.put("/api/surveilans-ido", { id, action: 'CLOSE_CASE' })
      } else {
        await axios.put("/api/verifikasi", { id, action: 'CLOSE_CASE', entityType })
      }
      showToast({
        type: 'success',
        title: 'Kasus Ditutup',
        message: 'Kasus infeksi telah ditutup (pasien dinyatakan sembuh).'
      })
      fetchReports()
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Gagal Menutup Kasus',
        message: err.response?.data?.error || err.message
      })
    }
  }

  const handleReject = async () => {
    if (!reportingToReject?.id || !reportingToReject?.entityType || !rejectReason) {
      showToast({
        type: 'warning',
        title: 'Peringatan',
        message: 'Silakan isi alasan penolakan.'
      });
      return;
    }
    if (!confirm(`Apakah Anda yakin ingin menolak laporan ini?`)) {
      return;
    }
    try {
      await axios.put("/api/verifikasi", { id: reportingToReject.id, action: 'REJECT', reason: rejectReason, entityType: reportingToReject.entityType })
      showToast({
        type: 'warning',
        title: 'Laporan Ditolak',
        message: `Alasan: ${rejectReason}`
      })
      setShowRejectModal(false)
      setRejectReason("")
      setReportingToReject(null)
      fetchReports()
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Gagal Menolak Laporan',
        message: err.response?.data?.error || err.message
      })
    }
  }

  const openRejectModal = (id: string, entityType: string) => {
    setReportingToReject({ id, entityType })
    setShowRejectModal(true)
  }

  const filteredReports = reports.filter((r) => {
    const matchStatus = r.status === filterStatus
    const matchRuangan = filterRuangan === "ALL" || r.ruangan.trim().toLowerCase() === filterRuangan.trim().toLowerCase()
    return matchStatus && matchRuangan
  })

  const statusCounts = {
    PENDING: reports.filter((r) => r.status === 'PENDING').length,
    VERIFIED: reports.filter((r) => r.status === 'VERIFIED').length,
    REJECTED: reports.filter((r) => r.status === 'REJECTED').length,
  }

  const columns = [
    {
      key: 'tanggal' as const,
      label: 'Tgl Lapor',
      render: (value: string) => <span className="text-gray-600">{formatTanggal(value)}</span>,
    },
    {
      key: 'ruangan' as const,
      label: 'Ruangan',
      render: (value: string) => (
        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-semibold">{value}</span>
      ),
    },
    {
      key: 'pasien' as const,
      label: 'Pasien',
      render: (value: string, row: Report) => (
        <div>
          <div className="font-bold">{value}</div>
          <div className="text-xs text-gray-500">RM: {row.no_rm}</div>
        </div>
      ),
    },
    {
      key: 'jenis_infeksi' as const,
      label: 'Jenis Infeksi',
      render: (value: string) => (
        <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-bold uppercase">{value}</span>
      ),
    },
    {
      key: 'statusLabel' as const,
      label: 'Status Verifikasi',
      render: (_value: string, row: Report) => (
        <span className={`px-2 py-1 rounded text-xs font-bold ${row.status === 'VERIFIED' ? 'bg-green-100 text-green-800' : row.status === 'REJECTED' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>{row.statusLabel}</span>
      ),
    },
    {
      key: 'caseStatusLabel' as const,
      label: 'Status Kasus',
      render: (_value: string, row: Report & { entityType?: string; caseStatus?: string }) => {
        const caseStatus = row.caseStatus || 'Tidak Aktif'
        return (
          <span className={`px-2 py-1 rounded text-xs font-bold ${caseStatus === 'SELESAI' ? 'bg-blue-100 text-blue-800' : caseStatus === 'AKTIF' ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-800'}`}>{caseStatus}</span>
        )
      },
    },
    {
      key: 'status' as const,
      label: 'Aksi',
      render: (_value: string, row: Report & { entityType: string; caseStatus?: string }) => {
        const caseStatus = row.caseStatus
        const isActiveCase = caseStatus === 'AKTIF'
        return (
          <div className="flex gap-2 flex-wrap">
            <Button onClick={() => setSelectedReport(row)} size="sm" variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50 h-8 text-xs">Detail</Button>
            {row.status === 'PENDING' && (
              <>
                <Button onClick={() => handleVerify(row.id, row.entityType)} size="sm" className="bg-green-600 hover:bg-green-700 h-8 text-xs">Verifikasi</Button>
                <Button onClick={() => openRejectModal(row.id, row.entityType)} size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 h-8 text-xs">Tolak</Button>
              </>
            )}
            {row.status === 'VERIFIED' && isActiveCase && (
              <Button onClick={() => handleCloseCase(row.id, row.entityType)} size="sm" className="bg-purple-600 hover:bg-purple-700 h-8 text-xs">Tutup Kasus</Button>
            )}
          </div>
        )
      },
    },
  ]

  return (
    <>
      <PageHeader title="Verifikasi Kejadian Infeksi" description="Validasi laporan infeksi dari IPCLN Ruangan" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard title="Menunggu Verifikasi" value={statusCounts.PENDING} icon={<AlertCircle size={20} className="text-yellow-600" />} color="amber" className={filterStatus === 'PENDING' ? 'ring-2 ring-yellow-400' : ''} />
        <StatCard title="Terverifikasi" value={statusCounts.VERIFIED} icon={<CheckCircle size={20} className="text-green-600" />} color="green" className={filterStatus === 'VERIFIED' ? 'ring-2 ring-green-400' : ''} />
        <StatCard title="Ditolak" value={statusCounts.REJECTED} icon={<XCircle size={20} className="text-red-600" />} color="red" className={filterStatus === 'REJECTED' ? 'ring-2 ring-red-400' : ''} />
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle>Daftar Laporan</CardTitle>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Unit:</label>
                <select 
                  value={filterRuangan} 
                  onChange={(e) => setFilterRuangan(e.target.value)} 
                  className="p-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="ALL">Semua Ruangan</option>
                  {ruanganList.map((r) => (
                    <option key={r.id} value={r.nama}>{r.nama}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Status:</label>
                <select 
                  value={filterStatus} 
                  onChange={(e) => setFilterStatus(e.target.value)} 
                  className="p-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="PENDING">Menunggu Verifikasi</option>
                  <option value="VERIFIED">Terverifikasi</option>
                  <option value="REJECTED">Ditolak</option>
                </select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable 
            columns={columns} 
            data={filteredReports} 
            loading={loading} 
            emptyMessage={`Tidak ada laporan dengan status ${filterStatus.toLowerCase()}.`}
            searchable
            searchPlaceholder="Cari nama pasien atau No. RM..."
            paginated
            pageSize={10}
          />
        </CardContent>
      </Card>

      {selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-emerald-600 p-4 text-white flex justify-between items-center">
              <h2 className="text-xl font-bold">Detail Verifikasi Laporan</h2>
              <button onClick={() => setSelectedReport(null)} className="text-white hover:text-gray-200 text-2xl">&times;</button>
            </div>
            <div className="p-6 space-y-6">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Pasien</p>
                    <p className="text-lg font-bold text-slate-900">{selectedReport.pasien} • RM {selectedReport.no_rm}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${selectedReport.status === 'PENDING' ? 'bg-amber-100 text-amber-800' : selectedReport.status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>{selectedReport.statusLabel}</span>
                </div>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-3 text-sm text-slate-700">
                  <div>
                    <p className="text-slate-500">Ruangan</p>
                    <p className="font-semibold">{selectedReport.ruangan}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Tanggal Masuk</p>
                    <p className="font-semibold">{new Date(selectedReport.tanggal_masuk).toLocaleDateString('id-ID')}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Lama Rawat</p>
                    <p className="font-semibold">{selectedReport.lama_rawat_hari} hari</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Jenis Infeksi</p>
                    <p className="font-semibold text-rose-600">{selectedReport.jenis_infeksi}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader><CardTitle className="text-base">Ringkasan Alat Terpasang</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedReport.alat_terpasang.length > 0 ? selectedReport.alat_terpasang.map((device, index) => (
                        <div key={index} className="rounded border border-slate-200 p-3">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-slate-800">{device.jenis_alat}</p>
                            <span className="text-xs text-slate-500">Device Days: {device.device_day}</span>
                          </div>
                          <p className="text-sm text-slate-600">Mulai: {device.tanggal_pasang ? new Date(device.tanggal_pasang).toLocaleDateString('id-ID') : '—'}</p>
                          <p className="text-sm text-slate-600">{device.masih_terpasang ? 'Masih Aktif' : `Selesai: ${device.tanggal_lepas ? new Date(device.tanggal_lepas).toLocaleDateString('id-ID') : '—'}`}</p>
                        </div>
                      )) : <p className="text-sm text-slate-500">Tidak ada data alat terpasang.</p>}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle className="text-base">Riwayat Infeksi</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedReport.riwayat_infeksi.length > 0 ? selectedReport.riwayat_infeksi.map((event, index) => (
                        <div key={index} className="rounded border border-slate-200 p-3">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-slate-800">{event.jenis_infeksi}</p>
                            <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-700 text-xs">{event.status}</span>
                          </div>
                          <p className="text-sm text-slate-600">Aktif: {new Date(event.tanggal_kejadian).toLocaleDateString('id-ID')}</p>
                          <p className="text-sm text-slate-600">Selesai: {event.tanggal_selesai ? new Date(event.tanggal_selesai).toLocaleDateString('id-ID') : 'Masih Aktif'}</p>
                          <p className="text-sm text-slate-600">Hari ke-{event.hari_ke ?? '-'}</p>
                        </div>
                      )) : <p className="text-sm text-slate-500">Tidak ada riwayat infeksi lainnya.</p>}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Full Audit Trail Viewer */}
              <div className="bg-slate-900 text-white p-6 rounded-lg border border-slate-700">
                <AuditTrailViewer rawatInapId={selectedReport.rawat_inap_id} />
              </div>
            </div>
            <div className="bg-slate-50 p-4 flex justify-end gap-2">
              {selectedReport && selectedReport.status === 'PENDING' && (
                <>
                  {/* @ts-ignore */}
                  <Button onClick={() => { handleVerify(selectedReport.id, selectedReport.entityType); setSelectedReport(null); }} className="bg-green-600">Verifikasi Sekarang</Button>
                  {/* @ts-ignore */}
                  <Button onClick={() => { openRejectModal(selectedReport.id, selectedReport.entityType); setSelectedReport(null); }} variant="outline" className="text-red-600 border-red-200">Tolak</Button>
                </>
              )}
              <Button onClick={() => setSelectedReport(null)} className="bg-slate-700 text-white">Tutup</Button>
            </div>
          </div>
        </div>
      )}

      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="bg-red-600 p-4 text-white"><h2 className="text-xl font-bold">Alasan Penolakan</h2></div>
            <div className="p-6 space-y-4">
              <label className="text-sm font-semibold text-gray-700">Berikan alasan mengapa laporan ini ditolak:</label>
              <textarea className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none" rows={4} placeholder="Contoh: Data kurang lengkap, mohon input ulang kronologi..." value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}></textarea>
            </div>
            <div className="bg-slate-50 p-4 flex justify-end gap-2">
              <Button onClick={() => setShowRejectModal(false)} variant="ghost">Batal</Button>
              <Button onClick={handleReject} className="bg-red-600 hover:bg-red-700 text-white" disabled={!rejectReason}>Simpan Penolakan</Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}