"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/ui/PageHeader"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { DataTable } from "@/components/ui/DataTable"
import { StatCard } from "@/components/ui/StatCard"
import { FormField, FormInput, FormSelect, FormTextarea } from "@/components/ui/FormField"
import { useToast } from "@/components/ui/Toast"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"
import axios from "axios"
import { exportMultiSheetExcel } from "@/lib/excel-export"
import { STATUS_TOOLTIP } from "@/lib/antibiotik-status"
import { useSession } from "next-auth/react"

// ── Types ────────────────────────────────────────────────────────────────────

type ExecutiveSummary = {
  totalBulanIni: number
  totalRestriksi: number
  totalPerluReview: number
  totalOverdue: number
  totalReviewSelesai: number
}

type AnalyticsData = {
  trendBulanan: Array<{ bulan: string; jumlah: number }>
  top10Antibiotik: Array<{ nama: string; jumlah: number }>
  statusTerapi: Array<{ name: string; value: number; color: string }>
  distribusiRuangan: Array<{ ruangan: string; jumlah: number }>
  executiveSummary: ExecutiveSummary
}

type AntibiotikData = {
  id: string;
  pasien: string;
  no_rm: string;
  ruangan?: string;
  nama_ab: string;
  antibiotik_id: number;
  dosis: string;
  rute: string;
  tgl_mulai: string;
  tgl_selesai: string;
  ke: number;
  hari_ke: number;
  status: string;
  alasan_review: string[];
  is_restriksi: boolean;
  efek_samping?: string;
  catatan_ipcn?: string;
  rekomendasi_ipcn?: string;
  tanggal_review?: string;
  dokter?: string;
}

type PasienData = {
  id: string;
  no_rm: string;
  nama: string;
  ruangan: string;
}

type MasterAntibiotik = {
  id: number;
  nama: string;
  kode?: string;
  is_restriksi?: boolean;
  durasi_maks_hari?: number;
}

type AuditEntry = {
  id: number;
  action: string;
  field: string | null;
  previousValue: string | null;
  newValue: string | null;
  userName: string;
  timestamp: string;
}

export default function AntibiotikPage() {
  const { showToast } = useToast()
  const { data: session } = useSession()
  const [dataList, setDataList] = useState<AntibiotikData[]>([])
  const [pasienList, setPasienList] = useState<PasienData[]>([])
  const [masterAntibiotik, setMasterAntibiotik] = useState<MasterAntibiotik[]>([])
  const [stats, setStats] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [selectedAB, setSelectedAB] = useState<AntibiotikData | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<AntibiotikData | null>(null)
  const [executiveSummary, setExecutiveSummary] = useState<ExecutiveSummary | null>(null)

  // Detail modal tab state
  const [detailTab, setDetailTab] = useState<'detail' | 'riwayat'>('detail')
  const [auditData, setAuditData] = useState<AuditEntry[]>([])
  const [auditLoading, setAuditLoading] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [exportParams, setExportParams] = useState({
    month: String(new Date().getMonth() + 1),
    year: String(new Date().getFullYear()),
    ruangan: '',
    antibiotik: ''
  })
  const [filters, setFilters] = useState({
    status: 'SEMUA',
    ruangan: '',
    antibiotik: '',
    search: ''
  })

  const canReviewIPCN =
    (session?.user as any)?.role === "IPCN" || (session?.user as any)?.role === "ADMIN"
  const [formData, setFormData] = useState({
    id: '',
    no_rm: '',
    pasien: '',
    nama_ab: '',
    dosis: '',
    rute: 'IV',
    tgl_mulai: new Date().toISOString().split('T')[0],
    tgl_selesai: '',
    ke: 1,
    efek_samping: '',
    catatan_ipcn: '',
    rekomendasi_ipcn: ''
  })

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [abRes, pasienRes] = await Promise.all([
        axios.get("/api/antibiotik"),
        axios.get("/api/pasien")
      ])
      setDataList(abRes.data.penggunaan)
      setMasterAntibiotik(abRes.data.master)
      setStats(abRes.data.stats)
      setPasienList(pasienRes.data.map((ri: any) => ({
        id: ri.id,
        no_rm: ri.no_rm,
        nama: ri.nama,
        ruangan: ri.ruangan || "-"
      })))
    } catch (error) {
      console.error("Error fetching data:", error)
      showToast({ type: "error", title: "Gagal", message: "Gagal memuat data" })
    } finally {
      setLoading(false)
    }
  }, [showToast])

  // Fetch analytics data for executive summary
  const fetchAnalytics = useCallback(async () => {
    try {
      setAnalyticsLoading(true)
      const res = await axios.get("/api/antibiotik/analytics")
      setExecutiveSummary(res.data.executiveSummary)
    } catch (error) {
      console.error("Error fetching analytics:", error)
      setExecutiveSummary(null)
    } finally {
      setAnalyticsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  // Fetch audit trail when "Riwayat Aktivitas" tab is selected
  const fetchAudit = useCallback(async (id: string) => {
    try {
      setAuditLoading(true)
      const res = await axios.get(`/api/antibiotik/audit?id=${id}`)
      setAuditData(res.data.data || [])
    } catch (error) {
      console.error('Error fetching audit trail:', error)
      setAuditData([])
    } finally {
      setAuditLoading(false)
    }
  }, [])

  // Reset tab state when modal closes or a different record is selected
  const openDetailModal = useCallback((ab: AntibiotikData) => {
    setSelectedAB(ab)
    setDetailTab('detail')
    setAuditData([])
  }, [])

  const closeDetailModal = useCallback(() => {
    setSelectedAB(null)
    setDetailTab('detail')
    setAuditData([])
  }, [])

  const handleNoRmChange = useCallback((noRm: string) => {
    const foundPasien = pasienList.find(p => p.no_rm === noRm)
    setFormData(prev => ({
      ...prev,
      no_rm: noRm,
      pasien: foundPasien?.nama || prev.pasien
    }))
  }, [pasienList])

  const resetForm = useCallback(() => {
    setFormData({
      id: '',
      no_rm: '',
      pasien: '',
      nama_ab: '',
      dosis: '',
      rute: 'IV',
      tgl_mulai: new Date().toISOString().split('T')[0],
      tgl_selesai: '',
      ke: 1,
      efek_samping: '',
      catatan_ipcn: '',
      rekomendasi_ipcn: ''
    })
    setSelectedAB(null)
    setIsEditing(false)
  }, [])

  const handleSave = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (isEditing && formData.id) {
        await axios.put("/api/antibiotik", {
          ...formData,
        })
        showToast({ type: "success", title: "Berhasil", message: "Data antibiotik berhasil diperbarui" })
      } else {
        await axios.post("/api/antibiotik", formData)
        showToast({ type: "success", title: "Berhasil", message: "Data antibiotik berhasil disimpan" })
      }
      setShowForm(false)
      setIsEditing(false)
      resetForm()
      fetchData()
    } catch (error: any) {
      console.error("Error saving:", error)
      showToast({ type: "error", title: "Gagal", message: error.response?.data?.error || error.message })
    }
  }, [isEditing, formData, resetForm, fetchData, showToast])

  const handleSelesai = useCallback(async (id: string) => {
    try {
      await axios.put("/api/antibiotik", { id, markComplete: true })
      showToast({ type: "success", title: "Berhasil", message: "Antibiotik ditandai selesai" })
      fetchData()
    } catch (error: any) {
      showToast({ type: "error", title: "Gagal", message: error.response?.data?.error || error.message })
    }
  }, [fetchData, showToast])

  const handleEdit = useCallback((ab: AntibiotikData) => {
    setSelectedAB(ab)
    setIsEditing(true)
    setFormData({
      id: ab.id,
      no_rm: ab.no_rm,
      pasien: ab.pasien,
      nama_ab: ab.nama_ab,
      dosis: ab.dosis,
      rute: ab.rute,
      tgl_mulai: ab.tgl_mulai,
      tgl_selesai: ab.tgl_selesai,
      ke: ab.ke,
      efek_samping: ab.efek_samping || '',
      catatan_ipcn: ab.catatan_ipcn || '',
      rekomendasi_ipcn: ab.rekomendasi_ipcn || ''
    })
    setShowForm(true)
  }, [])

  const handleExport = useCallback(async () => {
    try {
      setIsExporting(true)
      const params = new URLSearchParams()
      if (exportParams.month) params.set('month', exportParams.month)
      if (exportParams.year) params.set('year', exportParams.year)
      if (exportParams.ruangan) params.set('ruangan', exportParams.ruangan)
      if (exportParams.antibiotik) params.set('antibiotik', exportParams.antibiotik)
      
      const res = await axios.get(`/api/antibiotik/export?${params.toString()}`)
      
      // Prepare sheets
      const sheets = [
        {
          name: 'Detail Penggunaan',
          title: 'Detail Penggunaan Antibiotik',
          headers: res.data.sheet1.headers,
          data: res.data.sheet1.data.map((row: any) => Object.fromEntries(res.data.sheet1.headers.map((h: string, i: number) => [h, row[i]])))
        },
        {
          name: 'Ringkasan',
          title: 'Ringkasan Penggunaan Antibiotik',
          headers: res.data.sheet2.headers,
          data: res.data.sheet2.data.map((row: any) => Object.fromEntries(res.data.sheet2.headers.map((h: string, i: number) => [h, row[i]])))
        },
        {
          name: 'Monitoring IPCN',
          title: 'Monitoring IPCN',
          headers: res.data.sheet3.headers,
          data: res.data.sheet3.data.map((row: any) => Object.fromEntries(res.data.sheet3.headers.map((h: string, i: number) => [h, row[i]])))
        },
        {
          name: 'Review IPCN',
          title: 'Review IPCN',
          headers: res.data.sheet4.headers,
          data: res.data.sheet4.data.map((row: any) => Object.fromEntries(res.data.sheet4.headers.map((h: string, i: number) => [h, row[i]])))
        }
      ]
      
      await exportMultiSheetExcel(sheets, `Laporan Antibiotik ${exportParams.month}-${exportParams.year}`)
      showToast({ type: "success", title: "Berhasil", message: "Laporan berhasil diexport!" })
      setShowExportModal(false)
    } catch (error) {
      console.error(error)
      showToast({ type: "error", title: "Gagal", message: "Gagal mengexport laporan" })
    } finally {
      setIsExporting(false)
    }
  }, [exportParams, showToast])

  const handleReview = useCallback(async (ab: AntibiotikData) => {
    try {
      await axios.put("/api/antibiotik", {
        id: ab.id,
        catatan_ipcn: formData.catatan_ipcn,
        rekomendasi_ipcn: formData.rekomendasi_ipcn,
        is_review: true
      })
      showToast({ type: "success", title: "Berhasil", message: "Review berhasil disimpan" })
      setSelectedAB(null)
      fetchData()
    } catch (error: any) {
      showToast({ type: "error", title: "Gagal", message: error.response?.data?.error || error.message })
    }
  }, [formData, fetchData, showToast])

  const handleDelete = useCallback(async (id: string) => {
    const target = dataList.find(d => d.id === id)
    if (target) {
      setDeleteConfirm(target)
    }
  }, [dataList])

  const confirmDelete = useCallback(async () => {
    if (!deleteConfirm) return
    try {
      await axios.delete(`/api/antibiotik?id=${deleteConfirm.id}`)
      showToast({ type: "success", title: "Berhasil", message: "Data antibiotik berhasil dihapus" })
      fetchData()
    } catch (error: any) {
      showToast({ type: "error", title: "Gagal", message: error.response?.data?.error || error.message })
    } finally {
      setDeleteConfirm(null)
    }
  }, [deleteConfirm, fetchData, showToast])

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'AKTIF':
        return 'bg-green-900/30 text-green-400 border border-green-800/50'
      case 'AKAN_SELESAI':
        return 'bg-yellow-900/30 text-yellow-400 border border-yellow-800/50'
      case 'SELESAI':
        return 'bg-gray-800 text-gray-400 border border-gray-700/50'
      case 'OVERDUE':
        return 'bg-red-900/30 text-red-400 border border-red-800/50'
      case 'PERLU_REVIEW':
        return 'bg-purple-900/30 text-purple-400 border border-purple-800/50'
      default:
        return 'bg-gray-800 text-gray-400 border border-gray-700/50'
    }
  }

  const getHariKeColor = (hari_ke: number, isRestriksi: boolean) => {
    if (isRestriksi) {
      if (hari_ke >7) return 'text-red-400 font-bold'
      if (hari_ke >5) return 'text-yellow-400 font-bold'
    } else {
      if (hari_ke >10) return 'text-red-400 font-bold'
    }
    return 'text-gray-300'
  }

  const filteredData = dataList.filter(ab => {
    if (filters.status !== 'SEMUA' && ab.status !== filters.status) return false;
    if (filters.ruangan && ab.ruangan !== filters.ruangan) return false;
    if (filters.antibiotik && ab.nama_ab !== filters.antibiotik) return false;
    if (filters.search) {
      const search = filters.search.toLowerCase()
      return (
        ab.pasien.toLowerCase().includes(search) ||
        ab.no_rm.toLowerCase().includes(search)
      )
    }
    return true;
  })

  const uniqueRuangan = Array.from(new Set(dataList.map(ab => ab.ruangan).filter(Boolean) as string[]))

  const columns = [
    {
      key: 'pasien' as const,
      label: 'Pasien',
      render: (_: string, row: AntibiotikData) => (
        <div>
          <div className="font-bold">{row.pasien}</div>
          <div className="text-xs text-gray-500">RM: {row.no_rm} {row.ruangan ? `• ${row.ruangan}` : ''}</div>
        </div>
      )
    },
    {
      key: 'nama_ab' as const,
      label: 'Antibiotik',
      render: (v: string, row: AntibiotikData) => (
        <div className={row.is_restriksi ? 'font-bold text-orange-400' : ''}>
          {v}
          {row.is_restriksi && <span className="ml-1 text-xs bg-orange-900/30 text-orange-400 px-1 rounded">R</span>}
        </div>
      )
    },
    {
      key: 'hari_ke' as const,
      label: 'Hari Ke',
      render: (v: number, row: AntibiotikData) => (
        <span className={getHariKeColor(v, row.is_restriksi)}>{v}</span>
      ),
      className: 'text-center'
    },
    {
      key: 'status' as const,
      label: 'Status',
      render: (_: any, row: AntibiotikData) => (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(row.status)}`}>
          {row.status === 'AKTIF' ? 'Aktif' : 
           row.status === 'AKAN_SELESAI' ? 'Akan Selesai' :
           row.status === 'SELESAI' ? 'Selesai' :
           row.status === 'OVERDUE' ? 'Overdue' : 'Perlu Review'}
        </span>
      ),
    },
    {
      key: 'alasan_review' as const,
      label: 'Alasan Review',
      render: (v: string[]) => (
        <div className="text-xs">
          {v.map((alasan, i) => (
            <span key={i} className="inline-block mr-1 mb-1 bg-gray-800 text-gray-300 px-2 py-0.5 rounded">
              {alasan}
            </span>
          ))}
        </div>
      )
    },
    {
      key: 'tgl_mulai' as const,
      label: 'Tgl Mulai'
    },
    {
      key: 'id' as const,
      label: 'Aksi',
      render: (_: string, row: AntibiotikData) => (
        <div className="flex gap-2">
          <button 
            onClick={() => openDetailModal(row)}
            className="text-purple-400 hover:text-purple-200 text-sm transition-colors"
          >
            Detail
          </button>
          <button
            onClick={() => handleEdit(row)}
            className="text-blue-400 hover:text-blue-200 text-sm transition-colors"
          >
            Edit
          </button>
          {row.status !== 'SELESAI' && (
            <button 
              onClick={() => handleSelesai(row.id)}
              className="text-green-400 hover:text-green-200 text-sm transition-colors"
            >
              Selesai
            </button>
          )}
          <button 
            onClick={() => handleDelete(row.id)}
            className="text-red-400 hover:text-red-200 text-sm transition-colors"
          >
            Hapus
          </button>
        </div>
      )
    }
  ]

  const perluReviewList = filteredData.filter(ab => ab.status === 'PERLU_REVIEW' || ab.status === 'OVERDUE')

  return (
    <>
      <PageHeader
        title="Monitoring Antibiotik"
        description="Pantau dan kelola penggunaan antibiotik pasien"
        actions={
          <div className="flex gap-2">
            <Button 
              onClick={() => setShowExportModal(true)}
              variant="outline"
            >
              ⬇️ Export Excel
            </Button>
            <Button 
              onClick={() => {
                if (showForm) {
                  setShowForm(false)
                  resetForm()
                } else {
                  resetForm()
                  setShowForm(true)
                }
              }}
            >
              {showForm ? "Batal" : "Catat Antibiotik Baru"}
            </Button>
          </div>
        }
      />

      {/* Executive Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatCard
          title="💊 Total Terapi Bulan Ini"
          value={executiveSummary?.totalBulanIni ?? 0}
          description="Therapi aktif + selesai"
          icon={<div className="text-green-400">💊</div>}
          color="blue"
        />
        <StatCard
          title="🟣 Antibiotik Restriksi"
          value={executiveSummary?.totalRestriksi ?? 0}
          description="Sedang dipantau"
          icon={<div className="text-orange-400">⚠️</div>}
          color="purple"
        />
        <StatCard
          title="🟡 Perlu Review"
          value={executiveSummary?.totalPerluReview ?? 0}
          description="Perlu evaluasi IPCN"
          icon={<div className="text-yellow-400">🔍</div>}
          color="amber"
        />
        <StatCard
          title="🔴 Overdue"
          value={executiveSummary?.totalOverdue ?? 0}
          description="Melewati tanggal selesai"
          icon={<div className="text-red-400">⚠️</div>}
          color="red"
        />
        <StatCard
          title="✅ Review Selesai"
          value={executiveSummary?.totalReviewSelesai ?? 0}
          description="Sudah direview IPCN"
          icon={<div className="text-emerald-400">✔</div>}
          color="green"
        />
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <StatCard 
          title="Terapi Aktif" 
          value={stats.aktif} 
          color="green" 
        />
        <StatCard 
          title="Akan Selesai" 
          value={stats.akan_selesai} 
          color="amber" 
        />
        <StatCard 
          title="Overdue" 
          value={stats.overdue} 
          color="red" 
        />
        <StatCard 
          title="Perlu Review" 
          value={stats.perlu_review} 
          color="purple" 
        />
        <StatCard 
          title="Selesai" 
          value={stats.selesai} 
          color="blue" 
        />
      </div>

      {/* Alert Panel */}
      {perluReviewList.length > 0 && (
        <Card className="mb-6 border-purple-800/50">
          <CardHeader className="bg-purple-900/20 pb-3">
            <CardTitle className="text-purple-300">⚠️ Membutuhkan Review IPCN</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {perluReviewList.slice(0, 6).map(ab => (
                <div key={ab.id} 
                  className="bg-gray-800/50 p-3 rounded-lg border border-gray-700 cursor-pointer hover:bg-gray-700/50"
                  onClick={() => openDetailModal(ab)}
                >
                  <div className="font-bold">{ab.pasien}</div>
                  <div className="text-xs text-gray-400 mb-2">{ab.nama_ab} • Hari {ab.hari_ke}</div>
                  <div className="flex flex-wrap gap-1">
                    {ab.alasan_review.map((alasan, i) => (
                      <span key={i} className="text-xs bg-purple-900/30 text-purple-400 px-2 py-0.5 rounded">
                        {alasan}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <FormField label="Status">
              <FormSelect value={filters.status} onChange={(e) => setFilters({...filters, status: e.target.value})}>
                <option value="SEMUA">Semua Status</option>
                <option value="AKTIF">Aktif</option>
                <option value="AKAN_SELESAI">Akan Selesai</option>
                <option value="OVERDUE">Overdue</option>
                <option value="PERLU_REVIEW">Perlu Review</option>
                <option value="SELESAI">Selesai</option>
              </FormSelect>
            </FormField>
            <FormField label="Ruangan">
              <FormSelect value={filters.ruangan} onChange={(e) => setFilters({...filters, ruangan: e.target.value})}>
                <option value="">Semua Ruangan</option>
                {uniqueRuangan.map(r => <option key={r} value={r}>{r}</option>)}
              </FormSelect>
            </FormField>
            <FormField label="Antibiotik">
              <FormSelect value={filters.antibiotik} onChange={(e) => setFilters({...filters, antibiotik: e.target.value})}>
                <option value="">Semua Antibiotik</option>
                {masterAntibiotik.map(ab => <option key={ab.id} value={ab.nama}>{ab.nama}</option>)}
              </FormSelect>
            </FormField>
            <FormField label="Cari Pasien / RM">
              <FormInput 
                placeholder="Cari..." 
                value={filters.search} 
                onChange={(e) => setFilters({...filters, search: e.target.value})}
              />
            </FormField>
          </div>
        </CardContent>
      </Card>

      {/* Detail Modal */}
      {selectedAB && !showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full max-h-[90vh] flex flex-col">

            {/* Modal Header */}
            <CardHeader className="bg-purple-700 text-white p-4 flex-shrink-0">
              <div className="flex justify-between items-center">
                <CardTitle className="text-white">Detail Penggunaan Antibiotik</CardTitle>
                <button onClick={closeDetailModal} className="text-white hover:text-gray-200 text-2xl leading-none">&times;</button>
              </div>
              {/* Tab Navigation */}
              <div className="flex gap-1 mt-3">
                <button
                  onClick={() => setDetailTab('detail')}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    detailTab === 'detail'
                      ? 'bg-white text-purple-700'
                      : 'text-purple-200 hover:bg-purple-600'
                  }`}
                >
                  Data Terapi
                </button>
                <button
                  onClick={() => {
                    setDetailTab('riwayat')
                    if (auditData.length === 0) fetchAudit(selectedAB.id)
                  }}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    detailTab === 'riwayat'
                      ? 'bg-white text-purple-700'
                      : 'text-purple-200 hover:bg-purple-600'
                  }`}
                >
                  Riwayat Aktivitas
                </button>
              </div>
            </CardHeader>

            {/* Scrollable Body */}
            <CardContent className="pt-6 overflow-y-auto flex-1">

              {/* ── Tab: Data Terapi ── */}
              {detailTab === 'detail' && (
                <>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-400 mb-1">Nama Pasien</h4>
                      <p className="font-medium">{selectedAB.pasien}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-400 mb-1">No. RM</h4>
                      <p>{selectedAB.no_rm}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-400 mb-1">Ruangan</h4>
                      <p>{selectedAB.ruangan}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-400 mb-1">Dokter Penanggung Jawab</h4>
                      <p>{selectedAB.dokter || '-'}</p>
                    </div>
                  </div>

                  <div className="border-t border-gray-700 pt-4 mb-4">
                    <h4 className="text-lg font-semibold mb-3">Data Terapi</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-400 mb-1">Antibiotik</h4>
                        <p className={selectedAB.is_restriksi ? 'font-bold text-orange-400' : 'font-medium'}>
                          {selectedAB.nama_ab}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-gray-400 mb-1">Dosis & Rute</h4>
                        <p>{selectedAB.dosis} ({selectedAB.rute})</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-gray-400 mb-1">Tanggal Mulai</h4>
                        <p>{selectedAB.tgl_mulai}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-gray-400 mb-1">Tanggal Selesai</h4>
                        <p>{selectedAB.tgl_selesai}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-gray-400 mb-1">Hari Ke</h4>
                        <p className={getHariKeColor(selectedAB.hari_ke, selectedAB.is_restriksi)}>
                          {selectedAB.hari_ke}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-gray-400 mb-1">Status</h4>
                        <span
                          title={STATUS_TOOLTIP[selectedAB.status as keyof typeof STATUS_TOOLTIP] || ''}
                          className={`px-2 py-1 rounded-full text-xs font-semibold cursor-default ${getStatusBadgeColor(selectedAB.status)}`}
                        >
                          {selectedAB.status === 'AKTIF' ? 'Aktif' :
                           selectedAB.status === 'AKAN_SELESAI' ? 'Akan Selesai' :
                           selectedAB.status === 'SELESAI' ? 'Selesai' :
                           selectedAB.status === 'OVERDUE' ? 'Overdue' : 'Perlu Review'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {selectedAB.alasan_review.length > 0 && (
                    <div className="border-t border-gray-700 pt-4 mb-4">
                      <h4 className="text-lg font-semibold mb-3">Alasan Review</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedAB.alasan_review.map((alasan, i) => (
                          <span key={i} className="bg-purple-900/30 text-purple-400 px-3 py-1 rounded text-sm">
                            {alasan}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="border-t border-gray-700 pt-4">
                    <h4 className="text-lg font-semibold mb-3">Review IPCN</h4>
                    <FormField label="Catatan IPCN">
                      <FormTextarea
                        placeholder="Masukkan catatan review..."
                        value={formData.catatan_ipcn || selectedAB.catatan_ipcn || ''}
                        onChange={(e) => setFormData({ ...formData, catatan_ipcn: e.target.value })}
                        readOnly={!canReviewIPCN}
                      />
                    </FormField>
                    <FormField label="Rekomendasi">
                      <FormTextarea
                        placeholder="Masukkan rekomendasi..."
                        value={formData.rekomendasi_ipcn || selectedAB.rekomendasi_ipcn || ''}
                        onChange={(e) => setFormData({ ...formData, rekomendasi_ipcn: e.target.value })}
                        readOnly={!canReviewIPCN}
                      />
                    </FormField>
                    {selectedAB.tanggal_review && (
                      <div className="mt-4 text-sm text-gray-400">
                        <p>Terakhir direview: {selectedAB.tanggal_review}</p>
                      </div>
                    )}
                    <div className="mt-4 flex justify-end gap-2">
                      <Button variant="outline" onClick={closeDetailModal}>Tutup</Button>
                      {canReviewIPCN && (
                        <Button
                          className="bg-purple-600 hover:bg-purple-700"
                          onClick={() => handleReview(selectedAB)}
                        >
                          Simpan Review
                        </Button>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* ── Tab: Riwayat Aktivitas ── */}
              {detailTab === 'riwayat' && (
                <div>
                  {auditLoading ? (
                    <div className="flex items-center justify-center py-12 text-gray-400">
                      <svg className="animate-spin h-5 w-5 mr-3 text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Memuat riwayat aktivitas...
                    </div>
                  ) : auditData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                      <div className="text-4xl mb-3 opacity-30">📋</div>
                      <p className="text-sm italic">Belum ada riwayat aktivitas.</p>
                    </div>
                  ) : (
                    <div className="relative border-l-2 border-purple-800/50 ml-3 space-y-0">
                      {auditData.map((entry, idx) => {
                        const actionMeta: Record<string, { label: string; color: string; icon: string }> = {
                          ANTIBIOTIK_CREATE:  { label: 'Dibuat',          color: 'text-green-400',  icon: '✚' },
                          ANTIBIOTIK_UPDATE:  { label: 'Diperbarui',      color: 'text-blue-400',   icon: '✎' },
                          ANTIBIOTIK_SELESAI: { label: 'Ditandai Selesai',color: 'text-gray-400',   icon: '✔' },
                          ANTIBIOTIK_REVIEW:  { label: 'Review IPCN',     color: 'text-purple-400', icon: '🔍' },
                          ANTIBIOTIK_DELETE:  { label: 'Dihapus',         color: 'text-red-400',    icon: '✕' },
                        }
                        const meta = actionMeta[entry.action] ?? { label: entry.action, color: 'text-gray-400', icon: '•' }

                        let prevParsed: any = null
                        let newParsed: any = null
                        try { if (entry.previousValue) prevParsed = JSON.parse(entry.previousValue) } catch {}
                        try { if (entry.newValue) newParsed = JSON.parse(entry.newValue) } catch {}

                        const formatValue = (raw: string | null, parsed: any) => {
                          if (!raw || raw === 'null') return null
                          if (parsed && typeof parsed === 'object') {
                            return Object.entries(parsed)
                              .map(([k, v]) => `${k}: ${v ?? '-'}`)
                              .join(' • ')
                          }
                          return raw
                        }

                        const prevText = formatValue(entry.previousValue, prevParsed)
                        const newText  = formatValue(entry.newValue, newParsed)

                        return (
                          <div key={entry.id} className="relative pl-6 pb-6">
                            {/* Timeline dot */}
                            <span className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-gray-900 border-2 border-purple-600 flex items-center justify-center text-[9px] text-purple-400 font-bold">
                              {idx + 1}
                            </span>

                            <div className="bg-gray-800/60 border border-gray-700/60 rounded-lg p-3">
                              {/* Header row */}
                              <div className="flex items-start justify-between gap-2 mb-1.5">
                                <div className="flex items-center gap-2">
                                  <span className={`text-xs font-bold ${meta.color}`}>
                                    {meta.icon} {meta.label}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    oleh <span className="text-gray-300 font-medium">{entry.userName}</span>
                                  </span>
                                </div>
                                <span className="text-[10px] text-gray-500 whitespace-nowrap flex-shrink-0">
                                  {new Date(entry.timestamp).toLocaleDateString('id-ID', {
                                    day: '2-digit', month: 'short', year: 'numeric'
                                  })}{' '}
                                  {new Date(entry.timestamp).toLocaleTimeString('id-ID', {
                                    hour: '2-digit', minute: '2-digit'
                                  })}
                                </span>
                              </div>

                              {/* Previous → New values */}
                              {(prevText || newText) && (
                                <div className="mt-2 space-y-1">
                                  {prevText && prevText !== 'Tidak ada perubahan terdeteksi' && (
                                    <div className="text-[11px] bg-red-950/40 border border-red-900/40 rounded px-2 py-1 text-red-300">
                                      <span className="font-semibold text-red-400">Sebelum: </span>{prevText}
                                    </div>
                                  )}
                                  {newText && newText !== 'Tidak ada perubahan terdeteksi' && (
                                    <div className="text-[11px] bg-green-950/40 border border-green-900/40 rounded px-2 py-1 text-green-300">
                                      <span className="font-semibold text-green-400">Sesudah: </span>{newText}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  <div className="mt-4 flex justify-end">
                    <Button variant="outline" onClick={closeDetailModal}>Tutup</Button>
                  </div>
                </div>
              )}

            </CardContent>
          </Card>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-lg w-full">
            <CardHeader className="bg-purple-700 text-white p-4">
              <div className="flex justify-between items-center">
                <CardTitle className="text-white">Export Laporan Antibiotik</CardTitle>
                <button onClick={() => setShowExportModal(false)} className="text-white hover:text-gray-200 text-2xl">&times;</button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Bulan">
                  <FormSelect
                    value={exportParams.month}
                    onChange={(e) => setExportParams({...exportParams, month: e.target.value})}
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={String(i + 1)}>
                        {new Date(0, i).toLocaleString('id-ID', { month: 'long' })}
                      </option>
                    ))}
                  </FormSelect>
                </FormField>
                <FormField label="Tahun">
                  <FormSelect
                    value={exportParams.year}
                    onChange={(e) => setExportParams({...exportParams, year: e.target.value})}
                  >
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                      <option key={year} value={String(year)}>{year}</option>
                    ))}
                  </FormSelect>
                </FormField>
                <FormField label="Ruangan (Opsional)">
                  <FormSelect
                    value={exportParams.ruangan}
                    onChange={(e) => setExportParams({...exportParams, ruangan: e.target.value})}
                  >
                    <option value="">Semua Ruangan</option>
                    {uniqueRuangan.map((ruangan) => (
                      <option key={ruangan} value={ruangan}>{ruangan}</option>
                    ))}
                  </FormSelect>
                </FormField>
                <FormField label="Antibiotik (Opsional)">
                  <FormSelect
                    value={exportParams.antibiotik}
                    onChange={(e) => setExportParams({...exportParams, antibiotik: e.target.value})}
                  >
                    <option value="">Semua Antibiotik</option>
                    {masterAntibiotik.map((ab) => (
                      <option key={ab.id} value={ab.nama}>{ab.nama}</option>
                    ))}
                  </FormSelect>
                </FormField>
              </div>
              <div className="mt-6 flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowExportModal(false)}
                >
                  Batal
                </Button>
                <Button
                  className="bg-purple-600 hover:bg-purple-700"
                  onClick={handleExport}
                  disabled={isExporting}
                >
                  {isExporting ? "Sedang Membuat Laporan..." : "Export"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Form Card */}
      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-purple-300">{isEditing ? "Edit Data Antibiotik" : "Form Penggunaan Antibiotik"}</CardTitle>
            <CardDescription>Isi form di bawah untuk {isEditing ? "memperbarui" : "menambah"} penggunaan antibiotik</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <FormField label="No. RM Pasien" required>
                <FormSelect
                  value={formData.no_rm}
                  onChange={(e) => handleNoRmChange(e.target.value)}
                >
                  <option value="">Pilih Pasien...</option>
                  {pasienList.map(pasien => (
                    <option key={pasien.id} value={pasien.no_rm}>
                      {pasien.no_rm} - {pasien.nama} ({pasien.ruangan})
                    </option>
                  ))}
                </FormSelect>
              </FormField>
              <FormField label="Nama Pasien" required>
                <FormInput 
                  placeholder="Nama Pasien" 
                  value={formData.pasien}
                  onChange={e => setFormData({...formData, pasien: e.target.value})}
                  required
                />
              </FormField>
              <FormField label="Nama Antibiotik" required>
                <FormSelect 
                  value={formData.nama_ab}
                  onChange={e => setFormData({...formData, nama_ab: e.target.value})}
                  required
                >
                  <option value="">Pilih Antibiotik...</option>
                  {masterAntibiotik.map(ab => (
                    <option key={ab.id} value={ab.nama}>
                      {ab.nama} {ab.is_restriksi ? '(Restriksi)' : ''}
                    </option>
                  ))}
                </FormSelect>
              </FormField>
              <FormField label="Dosis & Rute" required>
                <FormInput 
                  placeholder="Contoh: 2x1 gr IV" 
                  value={formData.dosis}
                  onChange={e => setFormData({...formData, dosis: e.target.value})}
                  required
                />
              </FormField>
              <FormField label="Tanggal Mulai" required>
                <FormInput 
                  type="date"
                  value={formData.tgl_mulai}
                  onChange={e => setFormData({...formData, tgl_mulai: e.target.value})}
                  required
                />
              </FormField>
              <FormField label="Tanggal Selesai (opsional)">
                <FormInput 
                  type="date"
                  value={formData.tgl_selesai}
                  onChange={e => setFormData({...formData, tgl_selesai: e.target.value})}
                />
              </FormField>
              <FormField label="Antibiotik Ke-" required>
                <FormInput 
                  type="number"
                  placeholder="1 / 2 / 3" 
                  value={formData.ke}
                  onChange={e => setFormData({...formData, ke: parseInt(e.target.value)})}
                  required
                />
              </FormField>
              <FormField label="Efek Samping (opsional)">
                <FormSelect 
                  value={formData.efek_samping}
                  onChange={e => setFormData({...formData, efek_samping: e.target.value})}
                >
                  <option value="">Tidak Ada</option>
                  <option value="Mual">Mual</option>
                  <option value="Muntah">Muntah</option>
                  <option value="Diare">Diare</option>
                  <option value="Ruam">Ruam</option>
                  <option value="Gangguan Ginjal">Gangguan Ginjal</option>
                  <option value="Gangguan Hati">Gangguan Hati</option>
                  <option value="Lainnya">Lainnya</option>
                </FormSelect>
              </FormField>
              <div className="md:col-span-2 lg:col-span-3 pt-2 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false)
                    resetForm()
                  }}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-700 flex-1"
                >
                  {isEditing ? "Perbarui Data" : "Simpan Data Antibiotik"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Data Table */}
      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={filteredData}
            loading={loading}
            emptyMessage="Belum ada data penggunaan antibiotik."
          />
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteConfirm}
        onCancel={() => setDeleteConfirm(null)}
        onConfirm={confirmDelete}
        title="Konfirmasi Hapus"
        description={`Apakah Anda yakin ingin menghapus data antibiotik untuk pasien ${deleteConfirm?.pasien}?`}
        confirmText="Hapus"
        cancelText="Batal"
        isDestructive={true}
      />
    </>
  )
}
