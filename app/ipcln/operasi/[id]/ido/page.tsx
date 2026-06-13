"use client"

import React, { use, useState, useEffect } from "react"
import Link from "next/navigation"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/ui/PageHeader"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card"
import { FormField, FormInput, FormSelect, FormTextarea } from "@/components/ui/FormField"
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton"
import { useToast } from "@/components/ui/Toast"
import axios from "axios"
import { ChevronLeft, Save } from "lucide-react"

export default function LaporIDOPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [operasi, setOperasi] = useState<any>(null)
  const [ido, setIdo] = useState<any>(null)
  const [isEditing, setIsEditing] = useState(false)
  
  const [formData, setFormData] = useState({
    ada_infeksi: false,
    tanggal_infeksi: new Date().toISOString().split('T')[0],
    ada_antibiotik: false,
    hasil_kultur: '',
    jenis_pus: ''
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const operasiRes = await axios.get(`/api/operasi/${id}`)
        setOperasi(operasiRes.data)
        
        // Cari apakah sudah ada IDO untuk operasi ini
        const idoRes = await axios.get("/api/surveilans-ido")
        const existingIdo = idoRes.data.find((item: any) => 
          item.operasi_id === parseInt(id) || item.operasi?.id === parseInt(id)
        )
        
        if (existingIdo) {
          setIdo(existingIdo)
          setIsEditing(true)
          setFormData({
            ada_infeksi: existingIdo.ada_infeksi || false,
            tanggal_infeksi: existingIdo.tanggal_infeksi ? new Date(existingIdo.tanggal_infeksi).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            ada_antibiotik: existingIdo.ada_antibiotik || false,
            hasil_kultur: existingIdo.hasil_kultur || '',
            jenis_pus: existingIdo.jenis_pus || ''
          })
        }
      } catch (err) {
        console.error("Gagal mengambil data:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsSubmitting(true)
      if (isEditing && ido?.id) {
        await axios.put(`/api/surveilans-ido`, {
          id: ido.id,
          ...formData
        })
        showToast({ type: "success", title: "Berhasil", message: "Laporan IDO berhasil diperbarui!" })
      } else {
        await axios.post(`/api/surveilans-ido`, {
          operasi_id: id,
          ...formData
        })
        showToast({ type: "success", title: "Berhasil", message: "Laporan IDO berhasil dikirim untuk verifikasi!" })
      }
      router.push("/ipcln/operasi")
    } catch (err: any) {
      showToast({ type: "error", title: "Gagal", message: err.response?.data?.error || err.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) return <div className="p-8"><LoadingSkeleton count={3} rows={4} /></div>

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <PageHeader
        title={isEditing ? "Edit Laporan Infeksi Daerah Operasi (IDO)" : "Laporan Infeksi Daerah Operasi (IDO)"}
        description={`${isEditing ? "Edit" : "Input"} temuan infeksi untuk tindakan operasi pada ${operasi?.tanggal}`}
        actions={
          <Button variant="outline" onClick={() => router.back()} className="flex items-center gap-2">
            <ChevronLeft size={18} /> Kembali
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        {/* Info Operasi */}
        <Card className="md:col-span-1 h-fit">
          <CardHeader className="bg-slate-900 text-white p-4">
            <CardTitle className="text-sm uppercase">Data Operasi</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3 text-sm">
            <div>
              <p className="text-gray-500">Pasien</p>
              <p className="font-bold">{operasi?.pasien} ({operasi?.no_rm})</p>
            </div>
            <div>
              <p className="text-gray-500">Diagnosa</p>
              <p>{operasi?.diagnosa}</p>
            </div>
            <div>
              <p className="text-gray-500">Jenis Operasi</p>
              <p className="font-semibold">{operasi?.jenis}</p>
            </div>
            <div>
              <p className="text-gray-500">ASA Score</p>
              <p>{operasi?.asa}</p>
            </div>
          </CardContent>
        </Card>

        {/* Form IDO */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Form Temuan IDO</CardTitle>
            <CardDescription>Laporkan jika ditemukan tanda-tanda infeksi pasca operasi</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={formData.ada_infeksi} 
                    onChange={e => setFormData({...formData, ada_infeksi: e.target.checked})}
                    className="w-5 h-5 accent-red-600"
                  />
                  <span className="font-bold text-red-800">Ditemukan Tanda-Tanda Infeksi (IDO)</span>
                </label>
              </div>

              {formData.ada_infeksi && (
                <div className="space-y-4 animate-in fade-in duration-500">
                  <FormField label="Tanggal Ditemukan Infeksi">
                    <FormInput 
                      type="date" 
                      value={formData.tanggal_infeksi} 
                      onChange={e => setFormData({...formData, tanggal_infeksi: e.target.value})} 
                    />
                  </FormField>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="Jenis Pus/Cairan">
                      <FormSelect 
                        value={formData.jenis_pus} 
                        onChange={e => setFormData({...formData, jenis_pus: e.target.value})}
                      >
                        <option value="">-- Pilih Jenis --</option>
                        <option value="Serous">Serous</option>
                        <option value="Sanguinous">Sanguinous</option>
                        <option value="Purulent">Purulent (Bernanah)</option>
                        <option value="Serosanguinous">Serosanguinous</option>
                      </FormSelect>
                    </FormField>

                    <div className="flex items-center gap-3 pt-8">
                      <input 
                        type="checkbox" 
                        id="antibiotik"
                        checked={formData.ada_antibiotik} 
                        onChange={e => setFormData({...formData, ada_antibiotik: e.target.checked})}
                        className="w-4 h-4"
                      />
                      <label htmlFor="antibiotik" className="text-sm font-medium">Diberikan Antibiotik?</label>
                    </div>
                  </div>

                  <FormField label="Hasil Kultur / Catatan Klinis">
                    <FormTextarea 
                      placeholder="Masukkan hasil lab kultur atau catatan klinis lainnya..." 
                      rows={4}
                      value={formData.hasil_kultur}
                      onChange={e => setFormData({...formData, hasil_kultur: e.target.value})}
                    />
                  </FormField>
                </div>
              )}

              <div className="pt-4 border-t">
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full bg-red-700 hover:bg-red-800 flex items-center justify-center gap-2"
                >
                  <Save size={18} />
                  {isSubmitting ? "Menyimpan..." : isEditing ? "Perbarui Laporan IDO" : "Simpan Laporan IDO"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
