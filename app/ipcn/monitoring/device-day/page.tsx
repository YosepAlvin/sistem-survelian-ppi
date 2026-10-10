"use client"

import React, { useState, useEffect, useMemo } from 'react'
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/ui/PageHeader"
import { DataTable } from "@/components/ui/DataTable"
import { StatCard } from "@/components/ui/StatCard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import axios from "axios"

type DeviceDay = {
  id: string;
  pasien: string;
  no_rm: string;
  ruangan: string;
  jenis_alat: string[];
  tgl_pasang: string;
  lama: string;
  status: string;
}

type AlatKesehatan = {
  id: number;
  jenisAlat: string;
  hariThreshold: number;
  isActive: boolean;
}

const DEFAULT_ALAT_KESEHATAN: AlatKesehatan[] = [
  { id: 1, jenisAlat: "Vena sentra", hariThreshold: 7, isActive: true },
  { id: 2, jenisAlat: "Vena perifer", hariThreshold: 7, isActive: true },
  { id: 3, jenisAlat: "Arteri", hariThreshold: 7, isActive: true },
  { id: 4, jenisAlat: "Umbilikai", hariThreshold: 7, isActive: true },
  { id: 5, jenisAlat: "Urine kateter", hariThreshold: 7, isActive: true },
  { id: 6, jenisAlat: "Suprapubik kateter", hariThreshold: 7, isActive: true },
  { id: 7, jenisAlat: "Ventilator", hariThreshold: 7, isActive: true },
  { id: 8, jenisAlat: "ETT", hariThreshold: 7, isActive: true },
  { id: 9, jenisAlat: "Trakeostomi", hariThreshold: 7, isActive: true },
  { id: 10, jenisAlat: "NGT", hariThreshold: 7, isActive: true },
  { id: 11, jenisAlat: "Drain operasi", hariThreshold: 7, isActive: true },
  { id: 12, jenisAlat: "Chest tube (WSD)", hariThreshold: 7, isActive: true },
]

export default function DeviceDayMonitoringPage() {
  const [deviceList, setDeviceList] = useState<DeviceDay[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRuangan, setSelectedRuangan] = useState("Semua")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedDevice, setSelectedDevice] = useState<DeviceDay | null>(null)

  const [ruanganList, setRuanganList] = useState<any[]>([])
  const [alatKesehatanList, setAlatKesehatanList] = useState<AlatKesehatan[]>(DEFAULT_ALAT_KESEHATAN)

  useEffect(() => {
    fetchDevices()
    fetchRuangan()
    fetchAlatKesehatan()
  }, [])

  const fetchRuangan = async () => {
    try {
      const res = await axios.get("/api/admin/ruangan")
      setRuanganList(res.data)
    } catch (err) {
      console.error("Gagal mengambil data ruangan:", err)
    }
  }

  const fetchAlatKesehatan = async () => {
    try {
      const res = await axios.get("/api/alat-kesehatan")
      if (res.data && res.data.length > 0) {
        setAlatKesehatanList(res.data)
      }
    } catch (err) {
      console.error("Gagal mengambil data alat kesehatan:", err)
    }
  }

  const fetchDevices = async () => {
    try {
      setLoading(true)
      const res = await axios.get("/api/monitoring/device-day")
      setDeviceList(res.data)
    } catch (err) {
      console.error("Gagal mengambil data device day:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchDevices()
    setIsRefreshing(false)
    alert("Data Device Day telah diperbarui.")
  }

  const filteredData = deviceList.filter(d => 
    selectedRuangan === 'Semua' || 
    d.ruangan.trim().toLowerCase() === selectedRuangan.trim().toLowerCase()
  )

  // Hitung ringkasan alat secara dinamis
  const summary = useMemo(() => {
    const result: Record<string, number> = {}
    alatKesehatanList.forEach(alat => {
      const count = deviceList.filter(d => 
        d.jenis_alat.some(a => a.toLowerCase().includes(alat.jenisAlat.toLowerCase()))
      ).length
      result[alat.jenisAlat] = count
    })
    return result
  }, [alatKesehatanList, deviceList])

  const colors: ("blue" | "green" | "purple" | "amber" | "red")[] = ["blue", "purple", "amber", "green", "red", "blue", "purple", "amber", "green", "red", "blue", "purple"]

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-slate-200 bg-white/95 px-6 py-8 shadow-xl shadow-slate-200/50">
          <PageHeader
            title="Monitoring Device Day"
            description="Pemantauan penggunaan alat medis secara real-time"
            backHref="/ipcn/dashboard"
          breadcrumbs={[
            { label: "Dashboard", href: "/ipcn/dashboard" },
            { label: "Monitoring", href: "/ipcn/monitoring" },
            { label: "Device Day" }
          ]}
          actions={
            <div className="flex gap-2">
              <select 
                value={selectedRuangan}
                onChange={(e) => setSelectedRuangan(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Semua">Semua Ruangan</option>
                {ruanganList.map((r) => (
                  <option key={r.id} value={r.nama}>{r.nama}</option>
                ))}
              </select>
              <Button 
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="bg-green-600 hover:bg-green-700"
              >
                {isRefreshing ? "Refreshing..." : "Refresh Data"}
              </Button>
            </div>
          }
        />

        {/* Modal Detail Device Day */}
        {selectedDevice && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-lg w-full overflow-hidden">
              <CardHeader className="bg-blue-600 text-slate-900 rounded-t-lg border-b-0">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-slate-900">Detail Monitoring Alat</CardTitle>
                  <button onClick={() => setSelectedDevice(null)} className="text-slate-900 hover:text-gray-200 text-2xl">&times;</button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="grid grid-cols-3 gap-2 text-sm border-b pb-2">
                  <span className="text-gray-500 font-semibold">Pasien</span>
                  <span className="col-span-2 font-bold">{selectedDevice.pasien}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm border-b pb-2">
                  <span className="text-gray-500 font-semibold">Ruangan</span>
                  <span className="col-span-2">{selectedDevice.ruangan}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm border-b pb-2">
                  <span className="text-gray-500 font-semibold">Alat</span>
                  <span className="col-span-2 font-bold text-blue-700">{selectedDevice.jenis_alat.join(', ')}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm border-b pb-2">
                  <span className="text-gray-500 font-semibold">Tgl Pasang</span>
                  <span className="col-span-2">{selectedDevice.tgl_pasang}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm border-b pb-2">
                  <span className="text-gray-500 font-semibold">Lama Terpasang</span>
                  <span className="col-span-2 font-bold">{selectedDevice.lama}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm border-b pb-2">
                  <span className="text-gray-500 font-semibold">Status</span>
                  <span className="col-span-2 text-green-600 font-bold">{selectedDevice.status}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-gray-500 font-semibold text-sm">Rencana Evaluasi:</span>
                  <p className="p-3 bg-gray-50 rounded border text-sm italic">
                    Pengecekan rutin kebersihan area insersi alat besok pagi pukul 08:00 WIB.
                  </p>
                </div>
              </CardContent>
              <div className="bg-gray-50 p-4 flex justify-end border-t">
                <Button onClick={() => setSelectedDevice(null)} className="bg-gray-600">Tutup</Button>
              </div>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          {alatKesehatanList.map((alat, index) => (
            <StatCard
              key={alat.id}
              title={alat.jenisAlat}
              value={summary[alat.jenisAlat] || 0}
              description="Sedang Terpasang"
              color={colors[index % colors.length]}
            />
          ))}
        </div>

        <Card className="mb-6 bg-white/95 border-slate-200">
          <CardContent className="pt-6">
            <DataTable
              columns={[ 
                {
                  key: 'pasien',
                  label: 'Pasien',
                  render: (_, row) => (
                    <div>
                      <div className="font-bold">{row.pasien}</div>
                      <div className="text-xs text-gray-500">RM: {row.no_rm}</div>
                    </div>
                  ),
                },
                {
                  key: 'ruangan',
                  label: 'Ruangan',
                  render: (value) => (
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      value === 'ICU' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                    }`}>{value}</span>
                  ),
                },
                {
                  key: 'jenis_alat',
                  label: 'Jenis Alat',
                  render: (value) => (
                    <div className="flex flex-col gap-1">
                      {value.map((a: string) => (
                        <span key={a} className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-[10px] w-fit font-bold">{a}</span>
                      ))}
                    </div>
                  ),
                },
                {
                  key: 'tgl_pasang',
                  label: 'Tgl Pasang',
                },
                {
                  key: 'lama',
                  label: 'Lama (Hari)',
                  render: (value) => <span className="font-bold">{value}</span>,
                },
                {
                  key: 'status',
                  label: 'Status',
                  render: (value) => (
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">{value}</span>
                  ),
                },
                {
                  key: 'id',
                  label: 'Aksi',
                  render: (_, row) => (
                    <button 
                      onClick={() => setSelectedDevice(row)}
                      className="text-blue-600 hover:text-blue-800 hover:font-medium transition-colors"
                    >
                      Detail
                    </button>
                  ),
                },
              ]}
              data={filteredData}
              loading={loading}
              emptyMessage="Tidak ada alat medis yang terpantau."
              onRowClick={(row) => setSelectedDevice(row)}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
  )
}