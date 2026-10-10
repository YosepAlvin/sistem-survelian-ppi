"use client"

import React, { use, useState, useEffect } from "react"
import Link from "next/link"
import SurveilanHarianForm from "@/components/forms/SurveilanHarianForm"
import { PageHeader } from "@/components/ui/PageHeader"
import { Card, CardContent } from "@/components/ui/Card"
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton"
import axios from "axios"
import { ChevronLeft } from "lucide-react"
import { formatTanggal, formatTanggalWaktu } from "@/lib/date-utils"

export default function InputSurveilansPage({ params }: { params: Promise<{ rawatInapId: string }> }) {
  const { rawatInapId } = use(params);
  const [initialData, setInitialData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`/api/rawat-inap/${rawatInapId}`);
        setInitialData(res.data);
      } catch (err: any) {
        setError(err.response?.data?.error || "Gagal memuat data pasien");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [rawatInapId]);

  return (
    <div className="min-h-screen bg-white text-slate-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <PageHeader
          title="Input Surveilans Harian"
          description={`Masukkan data surveilans harian untuk pasien (ID: ${rawatInapId})`}
          breadcrumbs={[
            { label: "Dashboard", href: "/ipcln/dashboard" },
            { label: "Pasien", href: "/ipcln/pasien" },
            { label: "Surveilans Harian" }
          ]}
          actions={
            <Link 
              href="/ipcln/pasien" 
              className="inline-flex items-center gap-2 px-4 py-2 text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors font-medium border border-slate-200"
            >
              <ChevronLeft size={18} />
              Kembali
            </Link>
          }
        />

        {loading ? (
          <Card className="bg-white border border-slate-200">
            <CardContent className="pt-12">
              <LoadingSkeleton count={5} rows={3} />
            </CardContent>
          </Card>
        ) : error ? (
          <Card className="border-red-300 bg-red-50">
            <CardContent className="pt-8 pb-8 text-center">
              <div className="text-red-700 font-medium">{error}</div>
              <Link 
                href="/ipcln/pasien" 
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-slate-900 bg-red-600 hover:bg-red-700 rounded-lg transition-colors font-medium"
              >
                Kembali ke Daftar Pasien
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="bg-white border border-slate-200">
              <CardContent className="pt-6">
                <SurveilanHarianForm initialData={initialData} />
              </CardContent>
            </Card>

            {Array.isArray(initialData?.device_history) && initialData.device_history.length > 0 && (
              <Card className="mt-6 bg-white border border-slate-200">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">Riwayat Perubahan Alat</h3>
                      <p className="text-sm text-slate-600">Tampilan audit pemasangan dan pelepasan alat pada pasien ini.</p>
                    </div>
                  </div>
                  <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                      <thead>
                        <tr className="text-left text-slate-600">
                          <th className="px-3 py-2">Alat</th>
                          <th className="px-3 py-2">Tanggal Pasang</th>
                          <th className="px-3 py-2">Tanggal Lepas</th>
                          <th className="px-3 py-2">Status</th>
                          <th className="px-3 py-2">Device Day</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {initialData.device_history.map((item: any, index: number) => (
                          <tr key={`${item.jenis_alat}-${index}`} className="text-slate-700">
                            <td className="px-3 py-2 font-medium">{item.jenis_alat}</td>
                            <td className="px-3 py-2">{formatTanggal(item.tanggal_pasang)}</td>
                            <td className="px-3 py-2">{item.tanggal_lepas ? formatTanggal(item.tanggal_lepas) : '-'}</td>
                            <td className="px-3 py-2">
                              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.status === 'Terpasang' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                                {item.status}
                              </span>
                            </td>
                            <td className="px-3 py-2">{item.device_day}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {Array.isArray(initialData?.infection_history) && initialData.infection_history.length > 0 && (
              <Card className="mt-6 bg-white border border-slate-200">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">Riwayat Kejadian Infeksi</h3>
                      <p className="text-sm text-slate-600">Status aktif dan selesai, disertai audit trail singkat untuk monitoring.</p>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3">
                    {initialData.infection_history.map((item: any, index: number) => (
                      <div key={`${item.jenis_infeksi}-${index}`} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <div className="text-base font-semibold text-slate-900">{item.jenis_infeksi}</div>
                            <div className="text-sm text-slate-600">Tanggal kejadian: {formatTanggal(item.tanggal_kejadian)} · Hari perawatan: {item.hari_ke}</div>
                          </div>
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.status === 'AKTIF' ? 'bg-emerald-50 text-emerald-700' : item.status === 'SELESAI' ? 'bg-slate-100 text-slate-700' : 'bg-amber-50 text-amber-700'}`}>
                            {item.status}
                          </span>
                        </div>
                        <div className="mt-3 grid gap-2 text-sm text-slate-700 md:grid-cols-2">
                          <div><span className="text-slate-500">Tanggal selesai:</span> {item.tanggal_selesai ? formatTanggal(item.tanggal_selesai) : '-'}</div>
                          <div><span className="text-slate-500">Catatan klinis:</span> {item.catatan || '-'}</div>
                          <div><span className="text-slate-500">Dicatat oleh:</span> {item.dicatat_oleh}</div>
                          <div><span className="text-slate-500">Tanggal pencatatan:</span> {item.tanggal_pencatatan ? formatTanggalWaktu(item.tanggal_pencatatan) : '-'}</div>
                          <div><span className="text-slate-500">Ditutup oleh:</span> {item.ditutup_oleh || '-'}</div>
                          <div><span className="text-slate-500">Tanggal penutupan:</span> {item.tanggal_penutupan ? formatTanggalWaktu(item.tanggal_penutupan) : '-'}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  )
}
