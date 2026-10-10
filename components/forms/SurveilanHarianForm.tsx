"use client"

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { surveilansSchema, type SurveilansFormValues } from "@/lib/validations/surveilans"
import axios from "axios"
import { useRouter } from "next/navigation"
import { getCurrentDateTimeLocal } from '@/lib/date-utils'
import { Logo } from "@/components/ui/Logo"
import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'
import { Lightbulb } from 'lucide-react'

interface Props {
  initialData?: any;
}

const DEFAULT_INFEKSI = [
  { jenis: 'ILO', ada: false, hari_ke: "", hasil_kultur: "" },
  { jenis: 'ISK', ada: false, hari_ke: "", hasil_kultur: "" },
  { jenis: 'HAP', ada: false, hari_ke: "", hasil_kultur: "" },
  { jenis: 'VAP', ada: false, hari_ke: "", hasil_kultur: "" },
  { jenis: 'IADP', ada: false, hari_ke: "", hasil_kultur: "" },
  { jenis: 'PLEBITIS', ada: false, hari_ke: "", hasil_kultur: "" },
]

const DEFAULT_ALAT = [
  { jenis_alat: 'Vena sentra', terpasang: false, lokasi: "", catatan: "", ganti_baru: false },
  { jenis_alat: 'Vena perifer', terpasang: false, lokasi: "", catatan: "", ganti_baru: false },
  { jenis_alat: 'Arteri', terpasang: false, lokasi: "", catatan: "", ganti_baru: false },
  { jenis_alat: 'Umbilikai', terpasang: false, lokasi: "", catatan: "", ganti_baru: false },
  { jenis_alat: 'Urine kateter', terpasang: false, lokasi: "", catatan: "", ganti_baru: false },
  { jenis_alat: 'Suprapubik kateter', terpasang: false, lokasi: "", catatan: "", ganti_baru: false },
  { jenis_alat: 'Ventilator', terpasang: false, lokasi: "", catatan: "", ganti_baru: false },
  { jenis_alat: 'Endotracheal Tube (ETT)', terpasang: false, lokasi: "", catatan: "", ganti_baru: false },
  { jenis_alat: 'Trakeostomi', terpasang: false, lokasi: "", catatan: "", ganti_baru: false },
  { jenis_alat: 'Nasogastric Tube (NGT)', terpasang: false, lokasi: "", catatan: "", ganti_baru: false },
  { jenis_alat: 'Drain operasi', terpasang: false, lokasi: "", catatan: "", ganti_baru: false },
  { jenis_alat: 'Chest tube (WSD)', terpasang: false, lokasi: "", catatan: "", ganti_baru: false },
]

export default function SurveilanHarianForm({ initialData }: Props) {
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const router = useRouter()
  const { data: alatFromApi } = useSWR('/api/alat-kesehatan', fetcher)
  const initializedRef = React.useRef(false)
  
  // Get alat list, use API data if available, otherwise use default
  const alatList = React.useMemo(() => {
    if (alatFromApi && alatFromApi.length > 0) {
      return alatFromApi.map((alat: { jenisAlat: string }) => ({
        jenis_alat: alat.jenisAlat,
        terpasang: false,
        lokasi: "",
        catatan: "",
        ganti_baru: false
      }))
    }
    return DEFAULT_ALAT
  }, [alatFromApi])

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<SurveilansFormValues>({
    resolver: zodResolver(surveilansSchema),
    defaultValues: {
      sumber_dirawat: "IGD",
      suhu: "",
      alat_terpasang: alatList,
      infeksi: DEFAULT_INFEKSI,
      tirah_baring: false,
      decubitus: false,
      pindah_ruangan: [],
      operasi: [],
      antibiotik: []
    } as any
  })

  // Pre-fill data when initialData is available
  useEffect(() => {
    if (initialData && !initializedRef.current) {
      initializedRef.current = true
      // Map DB Gender to Schema Gender
      const jk = initialData.jenis_kelamin === "Laki-laki" ? "L" : "P";

      // Build alat_terpasang with proper prefill
      const alatTerpasangPrefill = (() => {
        // Start with current alat list (from API or default)
        let alatPrefill = alatList.map((alat: { jenis_alat: string; terpasang: boolean; lokasi: string; catatan: string; ganti_baru: boolean }) => ({ ...alat }));
        // Merge saved data if any
        if (Array.isArray(initialData.alat_terpasang) && initialData.alat_terpasang.length > 0) {
          // For each saved item, update corresponding entry
          initialData.alat_terpasang.forEach((saved: any) => {
            const idx = alatPrefill.findIndex((a: { jenis_alat: string }) => a.jenis_alat === saved.jenis_alat);
            if (idx !== -1) {
              alatPrefill[idx] = {
                ...alatPrefill[idx],
                ...saved,
                // Ensure all optional string fields are empty strings instead of 0
                lokasi: (saved.lokasi == null || saved.lokasi === 0) ? "" : String(saved.lokasi),
                catatan: (saved.catatan == null || saved.catatan === 0) ? "" : String(saved.catatan),
                ganti_baru: saved.ganti_baru ?? false
              };
            }
          });
        }
        return alatPrefill;
      })();

      // Build infeksi with proper prefill
    const infeksiPrefill = (() => {
        let infeksiList = [...DEFAULT_INFEKSI];
        if (Array.isArray(initialData.infeksi) && initialData.infeksi.length > 0) {
          initialData.infeksi.forEach((saved: any) => {
            // Handle both saved.jenis (from KejadianInfeksi) and saved.jenis_infeksi (from old detail_infeksi)
            const savedJenis = saved.jenis || saved.jenis_infeksi;
            const idx = infeksiList.findIndex((i: { jenis: string }) => i.jenis === savedJenis);
            if (idx !== -1) {
              infeksiList[idx] = {
                ...infeksiList[idx],
                ...saved,
                hari_ke: (saved.hari_ke == null || saved.hari_ke === 0) ? "" : String(saved.hari_ke),
                // Handle both hasil_kultur (from form) and catatan (from KejadianInfeksi)
                hasil_kultur: (saved.hasil_kultur != null && saved.hasil_kultur !== "" && saved.hasil_kultur !== 0) 
                  ? String(saved.hasil_kultur) 
                  : (saved.catatan != null && saved.catatan !== "" && saved.catatan !== 0) 
                    ? String(saved.catatan) 
                    : ""
              };
            }
          });
        }
        return infeksiList;
      })();

      reset({
        sumber_dirawat: "IGD",
        ruangan: (initialData.ruangan == null || initialData.ruangan === 0) ? "" : String(initialData.ruangan),
        nama_pasien: (initialData.nama_pasien == null || initialData.nama_pasien === 0) ? "" : String(initialData.nama_pasien),
        no_rm: (initialData.no_rm == null || initialData.no_rm === 0) ? "" : String(initialData.no_rm),
        umur: (initialData.umur == null || initialData.umur === 0) ? "" : String(initialData.umur),
        jenis_kelamin: jk as any,
        alamat: (initialData.alamat == null || initialData.alamat === 0) ? "" : String(initialData.alamat),
        diagnosa_masuk: (initialData.diagnosa_masuk == null || initialData.diagnosa_masuk === 0) ? "" : String(initialData.diagnosa_masuk),
        tanggal_masuk: initialData.tanggal_masuk ? initialData.tanggal_masuk.substring(0, 16) : "",
        suhu: initialData.suhu != null && initialData.suhu !== 0 ? String(initialData.suhu) : "",
        alat_terpasang: alatTerpasangPrefill as any,
        infeksi: infeksiPrefill as any,
        tirah_baring: false,
        decubitus: false,
        pindah_ruangan: [],
        operasi: [],
        antibiotik: []
      } as any);
    }
  }, [initialData, alatList, reset])

  const onSubmit = async (data: SurveilansFormValues) => {
    const payload = {
      ...(data as any),
      tanggal_surveilans: (data as any).tanggal_surveilans || getCurrentDateTimeLocal(),
    }

    console.log('submit surveilans-harian payload:', payload)
    try {
      const response = await axios.post("/api/surveilans-harian", payload)
      if (response.data.success) {
        setNotice({ type: 'success', text: 'Formulir berhasil disimpan dan telah dikirim ke IPCN untuk verifikasi!' })
        console.log('Surveilans saved', response.data)
        setTimeout(() => router.push("/ipcln/pasien"), 900)
      }
    } catch (error: any) {
      const apiError = error.response?.data
      const details = apiError?.details ? `\n${JSON.stringify(apiError.details, null, 2)}` : ""
      const text = (apiError?.error || error.message) + details
      setNotice({ type: 'error', text })
      console.error("Gagal menyimpan: " + text)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-5xl mx-auto bg-white border border-slate-200 shadow-xl rounded-lg overflow-hidden my-8">
      {notice && (
        <div className={`p-4 text-sm ${notice.type === 'success' ? 'bg-emerald-800 text-emerald-100' : 'bg-rose-900 text-rose-100'} border ${notice.type === 'success' ? 'border-emerald-700' : 'border-rose-700'}`}>
          {notice.text}
        </div>
      )}
      {/* Header Kop Surat */}
      <div className="p-6 border-b-2 border-slate-200 flex justify-between items-center bg-white">
        <div className="flex items-center gap-4">
          <Image src="/logo.png" alt="Logo RS Budi Rahayu" width={64} height={64} className="w-16 h-16 object-contain rounded" />
          <div>
            <h2 className="font-bold text-sm uppercase text-slate-800">Yayasan Santa Maria Pekalongan</h2>
            <h1 className="font-bold text-xl uppercase text-slate-900">RSU Budi Rahayu</h1>
            <p className="text-[10px] leading-tight text-slate-600">Jl. Barito No. 5 Pekalongan 51146<br/>Telp (0285) 423491, Fax (0285) 4232002</p>
          </div>
        </div>
        <div className="text-right border-l-2 pl-6 border-slate-200">
          <h2 className="font-bold text-lg leading-tight text-slate-900">FORMULIR SURVEILANS INFEKSI</h2>
          <p className="text-[10px] uppercase font-semibold text-slate-700">Pencegahan dan Pengendalian Infeksi Rumah Sakit</p>
        </div>
      </div>

      <div className="p-8 space-y-8">
        <div className="rounded-lg border border-amber-700/40 bg-amber-950/40 p-4 text-sm text-amber-100">
          Status alat terpasang mengikuti snapshot harian terbaru. Centang alat yang terlihat terpasang hari ini, lalu kosongkan jika alat sudah dilepas.
        </div>
        {/* Bagian Atas: Ruangan & Tanggal */}
        <div className="grid grid-cols-2 gap-8 bg-white p-4 rounded border border-slate-200">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label className="text-sm font-bold w-24 text-slate-800">RUANGAN :</label>
              <input {...register("ruangan")} placeholder="Kode Ruangan (e.g. ICU)" className="border-b border-slate-200 bg-white text-slate-900 flex-1 focus:outline-none focus:border-blue-500" />
            </div>
            {errors.ruangan && <p className="text-rose-600 text-xs pl-24">{errors.ruangan.message}</p>}
            <div className="flex items-center gap-4 text-sm pl-24 text-slate-700">
              <span>Sumber dirawat:</span>
              <label className="flex items-center gap-1"><input type="radio" value="IGD" {...register("sumber_dirawat")} className="accent-blue-500" /> IGD</label>
              <label className="flex items-center gap-1"><input type="radio" value="POLI" {...register("sumber_dirawat")} className="accent-blue-500" /> POLI</label>
            </div>
          </div>
          <div className="space-y-4 w-full">
            <div className="flex items-center gap-2">
              <label className="text-sm font-bold text-slate-800">Tanggal masuk RS/Jam :</label>
              <input type="datetime-local" {...register("tanggal_masuk")} className="border-b border-slate-200 bg-white text-slate-900 flex-1 focus:outline-none focus:border-blue-500" />
            </div>
            {errors.tanggal_masuk && <p className="text-rose-600 text-xs">{errors.tanggal_masuk.message}</p>}
            <div className="flex items-center gap-2">
              <label className="text-sm font-bold text-slate-800">Suhu (°C) :</label>
              <input type="text" defaultValue="" {...register("suhu")} placeholder="36.5" inputMode="decimal" className="border-b border-slate-200 bg-white text-slate-900 flex-1 focus:outline-none focus:border-blue-500" />
            </div>
            {errors.suhu && <p className="text-rose-600 text-xs">{errors.suhu.message}</p>}
          </div>
        </div>

        {/* I. Identitas Pasien */}
        <section>
          <h3 className="font-bold border-b border-slate-200 mb-4 text-slate-900 flex items-center gap-2">
            <span className="bg-blue-900 text-slate-900 w-6 h-6 rounded-full flex items-center justify-center text-xs">I</span>
            IDENTITAS PASIEN
          </h3>
          <div className="grid grid-cols-1 gap-3 pl-8 text-slate-800">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <label className="text-sm w-32">1. Nama pasien</label>
                <span className="text-sm">:</span>
                <input {...register("nama_pasien")} className="border-b border-dotted border-slate-200 bg-white text-slate-900 flex-1 focus:outline-none" />
              </div>
              {errors.nama_pasien && <p className="text-rose-600 text-xs pl-36">{errors.nama_pasien.message}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <label className="text-sm w-32">No. RM</label>
                <span className="text-sm">:</span>
                <input {...register("no_rm")} className="border-b border-dotted border-slate-200 bg-white text-slate-900 flex-1 focus:outline-none" />
              </div>
              {errors.no_rm && <p className="text-rose-600 text-xs pl-36">{errors.no_rm.message}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <label className="text-sm w-32">2. Umur</label>
                <span className="text-sm">:</span>
                <input {...register("umur")} className="border-b border-dotted border-slate-200 bg-white text-slate-900 flex-1 focus:outline-none" />
              </div>
              {errors.umur && <p className="text-rose-600 text-xs pl-36">{errors.umur.message}</p>}
            </div>
            <div className="flex items-center gap-4">
              <label className="text-sm w-32">3. Jenis kelamin</label>
              <span className="text-sm">:</span>
              <label className="flex items-center gap-1 text-sm"><input type="radio" value="L" {...register("jenis_kelamin")} className="accent-blue-500" /> Laki-laki</label>
              <label className="flex items-center gap-1 text-sm"><input type="radio" value="P" {...register("jenis_kelamin")} className="accent-blue-500" /> Perempuan</label>
            </div>
            <div className="flex items-start gap-2">
              <label className="text-sm w-32">4. Alamat</label>
              <span className="text-sm">:</span>
              <textarea {...register("alamat")} className="border-b border-dotted border-slate-200 bg-white text-slate-900 flex-1 focus:outline-none resize-none" rows={1}></textarea>
            </div>
          </div>
        </section>

        {/* II. Diagnosa */}
        <section>
          <h3 className="font-bold border-b border-slate-200 mb-4 text-slate-900 flex items-center gap-2 uppercase">
            <span className="bg-blue-900 text-slate-900 w-6 h-6 rounded-full flex items-center justify-center text-xs">II</span>
            Diagnosa Saat Masuk RS
          </h3>
          <div className="pl-8">
            <input {...register("diagnosa_masuk")} className="border-b border-dotted border-slate-200 bg-white text-slate-900 w-full focus:outline-none" />
            {errors.diagnosa_masuk && <p className="text-rose-600 text-xs mt-1">{errors.diagnosa_masuk.message}</p>}
          </div>
        </section>

        {/* IV. Faktor Resiko (Tabel) */}
        <section>
          <h3 className="font-bold border-b border-slate-200 mb-4 text-slate-900 flex items-center gap-2 uppercase">
            <span className="bg-blue-900 text-slate-900 w-6 h-6 rounded-full flex items-center justify-center text-xs">IV</span>
            Faktor Resiko Selama Dirawat
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-slate-200 text-xs text-slate-900">
              <thead>
                <tr className="bg-white text-slate-800">
                  <th className="border border-slate-200 p-2 w-10">No.</th>
                  <th className="border border-slate-200 p-2">Jenis tindakan/alkes</th>
                  <th className="border border-slate-200 p-2">lokasi</th>
                  <th className="border border-slate-200 p-2">Hari Ke</th>
                  <th className="border border-slate-200 p-2">Catatan</th>
                </tr>
              </thead>
              <tbody>
                {alatList.map((alat: { jenis_alat: string; terpasang: boolean; lokasi: string; catatan: string }, index: number) => {
                  // Find saran for this device type
                  const deviceType = alat.jenis_alat
                  const deviceSaran = initialData?.active_devices?.find((d: any) => d.jenis_alat === deviceType)?.saran
                  const activeDevice = initialData?.active_devices?.find((d: any) => d.jenis_alat === deviceType)
                  return (
                    <tr key={index} className="odd:bg-white even:bg-white">
                      <td className="border border-slate-200 p-2 text-center">{index + 1}.</td>
                      <td className="border border-slate-200 p-2">
                        <div className="flex flex-col gap-2">
                          <div className="flex justify-between items-center text-slate-800">
                            <span>{deviceType}</span>
                            <div className="flex items-center gap-3">
                              <label className="flex items-center gap-1 text-[10px] text-slate-500">
                                <input type="checkbox" {...register(`alat_terpasang.${index}.terpasang` as any)} className="accent-blue-500" />
                                Aktif
                              </label>
                              <label className="flex items-center gap-1 text-[10px] text-amber-500 font-bold">
                                <input type="checkbox" {...register(`alat_terpasang.${index}.ganti_baru` as any)} className="accent-amber-500" />
                                Ganti Baru
                              </label>
                            </div>
                          </div>
                          {deviceSaran && (
                            <div className={`p-2 rounded border text-[10px] ${deviceSaran.jenis_saran === 'LEPAS_ALAT' ? 'bg-red-50 border-red-200 text-red-700' : deviceSaran.jenis_saran === 'GANTI_ALAT' ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-blue-50 border-blue-200 text-blue-700'}`}>
                              <div className="font-semibold flex items-center gap-1.5">
                                <Lightbulb size={13} strokeWidth={2.2} />
                                Saran dari IPCN: {deviceSaran.jenis_saran === 'LEPAS_ALAT' ? 'Lepas Alat' : deviceSaran.jenis_saran === 'GANTI_ALAT' ? 'Ganti Alat' : 'Catatan'}
                                {deviceSaran.creator?.name && <span className="text-slate-600">({deviceSaran.creator.name})</span>}
                              </div>
                              <div className="mt-1">{deviceSaran.catatan}</div>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="border border-slate-200"><input {...register(`alat_terpasang.${index}.lokasi`)} className="w-full h-full p-1 bg-white text-slate-900 focus:outline-none" /></td>
                      <td className="border border-slate-200 p-1 text-center">
                        {activeDevice?.device_day || "-"}
                      </td>
                      <td className="border border-slate-200"><input {...register(`alat_terpasang.${index}.catatan`)} className="w-full h-full p-1 bg-white text-slate-900 focus:outline-none" /></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* VI. Komplikasi/Infeksi Rumah Sakit */}
        <section>
          <h3 className="font-bold border-b border-slate-200 mb-4 text-slate-900 flex items-center gap-2 uppercase">
            <span className="bg-blue-900 text-slate-900 w-6 h-6 rounded-full flex items-center justify-center text-xs">VI</span>
            Komplikasi/Infeksi Rumah Sakit
          </h3>
          <div className="pl-8 grid grid-cols-1 gap-6 text-sm text-slate-800">
            {[0, 1, 2, 3, 4, 5].map((index) => {
              const infectionType = DEFAULT_INFEKSI[index].jenis
              const activeInfection = initialData?.active_infections?.find((i: any) => i.jenis_infeksi === infectionType)
              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-center gap-8">
                    <label className="font-semibold w-48">{infectionType}</label>
                    <label className="flex items-center gap-1"><input type="checkbox" {...register(`infeksi.${index}.ada`)} className="accent-blue-500" /> Ada</label>
                    <div className="flex items-center gap-2 ml-4">
                      <span>Hari Ke</span>
                      <input 
                        {...register(`infeksi.${index}.hari_ke`)} 
                        readOnly 
                        className="border-b border-dotted border-slate-200 bg-slate-50 text-slate-700 w-24" 
                        value={activeInfection?.hari_ke || ""}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pl-4">
                    <label className="text-xs text-slate-600 w-44">Hasil Kultur/Catatan</label>
                    <span>:</span>
                    <input {...register(`infeksi.${index}.hasil_kultur`)} className="border-b border-dotted border-slate-200 bg-white text-slate-900 flex-1 focus:outline-none" />
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Footer Buttons */}
        <div className="pt-8 border-t border-slate-200 flex justify-end gap-4">
          <Button type="button" variant="outline" className="px-8 border-slate-200 text-slate-900 hover:bg-slate-50" onClick={() => router.refresh()}>Reset</Button>
          <Button type="submit" disabled={isSubmitting} className="px-12 bg-blue-900 hover:bg-blue-800">
            {isSubmitting ? "Menyimpan..." : "Simpan Formulir"}
          </Button>
        </div>
      </div>
    </form>
  )
}
