"use client"

import { useState, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { PageHeader } from "@/components/ui/PageHeader"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card"
import { Button } from "@/components/ui/button"
import { FormField, FormInput } from "@/components/ui/FormField"
import { User, Mail, Shield, Calendar, MapPin, Activity, Lock, Eye, EyeOff, Camera } from "lucide-react"
import { useSession } from "next-auth/react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, "Password lama harus diisi"),
  newPassword: z.string().min(6, "Password baru minimal 6 karakter"),
  confirmPassword: z.string().min(1, "Konfirmasi password harus diisi"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Password baru dan konfirmasi tidak sama",
  path: ["confirmPassword"],
})

type ChangePasswordValues = z.infer<typeof changePasswordSchema>

export default function ProfilePage() {
  const { data: session, update } = useSession()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [showOldPassword, setShowOldPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
  })

  const onSubmit = async (values: ChangePasswordValues) => {
    setIsSubmitting(true)
    setMessage(null)

    try {
      const res = await fetch("/api/user/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Gagal mengubah password")

      setMessage({ type: "success", text: data.message || "Password berhasil diubah!" })
      reset()
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Terjadi kesalahan" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    console.log("Starting file upload, file selected:", file)
    setIsUploading(true)
    setMessage(null)

    try {
      const formData = new FormData()
      formData.append("image", file)

      const res = await fetch("/api/user/profile-image", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()
      console.log("API response data:", data)
      if (!res.ok) throw new Error(data.error || "Gagal mengunggah foto")

      // Update session with new profile image
      console.log("[PROFILE] Calling update() with profileImage:", data.imageUrl)
      const updatePayload = {
        user: {
          profileImage: data.imageUrl
        }
      }
      console.log("[PROFILE] update payload:", JSON.stringify(updatePayload, null, 2))
      const updatedSession = await update(updatePayload)
      console.log("[PROFILE] updatedSession returned:", JSON.stringify(updatedSession, null, 2))
      console.log("[PROFILE] session.user.profileImage after:", (session?.user as any)?.profileImage)

      // Force a hard refresh of page data so all components (AppHeader) see the new photo
      // Use setTimeout to let NextAuth finish persisting the new JWT cookie first
      setTimeout(() => {
        window.location.reload()
      }, 300)
      
      setMessage({ type: "success", text: "Foto profile berhasil diubah!" })
    } catch (err: any) {
      console.error("Error in handleFileChange:", err)
      setMessage({ type: "error", text: err.message || "Terjadi kesalahan" })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Account Settings" 
        description="Manage your profile information and security preferences."
        backHref="/"
        backLabel="Kembali ke Dashboard"
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card variant="premium" className="md:col-span-1">
          <CardHeader className="flex flex-col items-center">
            <div className="relative group">
              {session?.user && (session.user as any).profileImage ? (
                <div className="relative w-24 h-24">
                  <Image
                    src={(session.user as any).profileImage}
                    alt="Profile"
                    fill
                    sizes="96px"
                    className="rounded-3xl object-cover border border-primary/30"
                  />
                </div>
              ) : (
                <div className="w-24 h-24 rounded-3xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary">
                  <User size={48} />
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform"
                disabled={isUploading}
              >
                {isUploading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Camera size={16} />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
                disabled={isUploading}
              />
            </div>
            <CardTitle className="mt-4">{session?.user?.name}</CardTitle>
            <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">
              {(session?.user as any)?.role || 'User'}
            </p>
          </CardHeader>
        </Card>
        
        <div className="md:col-span-2 space-y-6">
          {message && (
            <div className={`p-4 rounded-xl ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {message.text}
            </div>
          )}

          <Card variant="glass">
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <Mail className="text-primary" size={20} />
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Email Address</p>
                  <p className="text-slate-900 font-medium">{session?.user?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <Shield className="text-primary" size={20} />
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Access Role</p>
                  <p className="text-slate-900 font-medium">{(session?.user as any)?.role || 'Standard Access'}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <MapPin className="text-primary" size={20} />
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ruangan</p>
                  <p className="text-slate-900 font-medium">{(session?.user as any)?.ruangan || 'Belum ditetapkan'}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <Calendar className="text-primary" size={20} />
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tanggal Bergabung</p>
                  <p className="text-slate-900 font-medium">
                    {(session?.user as any)?.createdAt 
                      ? new Date((session!.user as any).createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) 
                      : '-'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="glass">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Lock className="text-primary" size={20} />
                <CardTitle>Keamanan Akun</CardTitle>
              </div>
              <CardDescription>Ubah password akun Anda untuk keamanan yang lebih baik.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <FormField label="Password Lama" error={errors.oldPassword?.message} required>
                  <div className="relative">
                    <FormInput
                      {...register("oldPassword")}
                      type={showOldPassword ? "text" : "password"}
                      placeholder="Masukkan password lama"
                      error={!!errors.oldPassword}
                    />
                    <button
                      type="button"
                      onClick={() => setShowOldPassword(!showOldPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                    >
                      {showOldPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </FormField>

                <FormField label="Password Baru" error={errors.newPassword?.message} required>
                  <div className="relative">
                    <FormInput
                      {...register("newPassword")}
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Masukkan password baru"
                      error={!!errors.newPassword}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                    >
                      {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </FormField>

                <FormField label="Konfirmasi Password Baru" error={errors.confirmPassword?.message} required>
                  <div className="relative">
                    <FormInput
                      {...register("confirmPassword")}
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Masukkan kembali password baru"
                      error={!!errors.confirmPassword}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                    >
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </FormField>

                <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto">
                  {isSubmitting ? "Menyimpan..." : "Ubah Password"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card variant="glass">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Activity className="text-primary" size={20} />
                <CardTitle>Riwayat Aktivitas</CardTitle>
              </div>
              <CardDescription>Lihat semua log aktivitas akun Anda di sistem.</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/profile/activity">
                <Button className="w-full md:w-auto">
                  <Activity size={16} className="mr-2" />
                  Lihat Riwayat Aktivitas
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
