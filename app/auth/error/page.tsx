"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  AlertTriangle, ArrowLeft, RotateCcw, ShieldCheck, Home
} from "lucide-react"

const AUTH_ERROR_MESSAGES: Record<string, { title: string; desc: string }> = {
  Configuration: {
    title: "Masalah Konfigurasi Server",
    desc: "Ada masalah pada konfigurasi autentikasi server. Silakan hubungi Administrator.",
  },
  AccessDenied: {
    title: "Akses Ditolak",
    desc: "Anda tidak memiliki izin untuk mengakses halaman ini. Silakan login dengan akun yang sesuai.",
  },
  Verification: {
    title: "Verifikasi Gagal",
    desc: "Kami tidak dapat memverifikasi permintaan Anda. Silakan coba lagi.",
  },
  Default: {
    title: "Gagal Login",
    desc: "Terjadi kesalahan saat mencoba masuk. Silakan periksa email & password Anda, atau coba lagi nanti.",
  },
}

export default function AuthErrorPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const errorCode = (searchParams.get("error") || "Default") as keyof typeof AUTH_ERROR_MESSAGES
  const error = AUTH_ERROR_MESSAGES[errorCode] || AUTH_ERROR_MESSAGES.Default

  return (
    <main className="relative h-screen w-full overflow-hidden">
      {/* BACKGROUND GEDUNG RS FULL COVER */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/rs-budi-rahayu.jpg.png"
          alt="Rumah Sakit Budi Rahayu"
          fill priority sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-blue-950/75 to-rose-950/60" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(239,68,68,0.22),transparent_55%),radial-gradient(ellipse_at_bottom_left,rgba(129,140,248,0.28),transparent_55%)]" />
        <div className="pointer-events-none absolute top-24 right-20 h-[480px] w-[480px] rounded-full bg-rose-500/15 blur-3xl" />
        <div className="pointer-events-none absolute bottom-28 left-16 h-[540px] w-[540px] rounded-full bg-indigo-500/15 blur-3xl" />
      </div>

      <div className="relative z-10 h-full flex flex-col">

        {/* Topbar mini logo */}
        <div className="shrink-0 px-4 sm:px-7 pt-2">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="relative h-8 w-8 rounded-lg bg-white/80 backdrop-blur-md border border-white/20 shadow-sm flex items-center justify-center group-hover:scale-105 transition">
              <Image src="/logo.png" alt="RS Budi Rahayu" width={22} height={22} className="object-contain" />
            </div>
            <span className="text-[9px] font-black tracking-tight text-white/95 leading-tight drop-shadow">
              RS BUDI<br/>RAHAYU
            </span>
          </Link>
        </div>

        {/* Konten Tengah */}
        <div className="flex-1 min-h-0 w-full flex items-center justify-center px-3 sm:px-6 lg:px-8 py-4">
          <div className="w-full max-w-xl mx-auto rounded-[1.6rem] sm:rounded-[2rem] bg-white/95 backdrop-blur-2xl shadow-2xl shadow-slate-950/40 ring-1 ring-white/40 p-6 sm:p-8 lg:p-10 text-center">

            {/* Icon Error + pulse */}
            <div className="relative mx-auto h-20 w-20 sm:h-24 sm:w-24">
              <div className="absolute inset-0 rounded-full bg-rose-100 animate-ping opacity-60" />
              <div className="relative h-full w-full rounded-full bg-gradient-to-br from-rose-100 via-orange-100 to-amber-100 ring-4 ring-white shadow-xl grid place-items-center">
                <AlertTriangle size={40} strokeWidth={2.2} className="text-rose-600 sm:size-[44px]" />
              </div>
            </div>

            {/* Judul */}
            <h1 className="mt-6 text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-tight">
              Oops, ada kesalahan!
            </h1>
            <p className="mt-1 text-sm sm:text-base font-bold bg-gradient-to-r from-rose-600 to-orange-600 bg-clip-text text-transparent leading-tight">
              {error.title}
            </p>
            <p className="mt-3 text-xs sm:text-sm lg:text-[15px] text-slate-600 max-w-md mx-auto leading-relaxed">
              {error.desc}
            </p>

            {/* Kode Error Box (minimal) */}
            <div className="mt-5 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 ring-1 ring-slate-200">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Error code</span>
              <span className="text-[11px] font-black text-rose-700">{errorCode}</span>
            </div>

            {/* 3 Tombol aksi */}
            <div className="mt-7 grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 max-w-lg mx-auto">
              <button
                onClick={() => router.back()}
                className="group inline-flex items-center justify-center gap-2 h-11 rounded-2xl bg-slate-100 text-slate-800 hover:bg-slate-200 font-bold text-xs sm:text-sm transition shadow-sm"
              >
                <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition" />
                Kembali
              </button>
              <button
                onClick={() => window.location.reload()}
                className="group inline-flex items-center justify-center gap-2 h-11 rounded-2xl bg-amber-50 text-amber-800 hover:bg-amber-100 font-bold text-xs sm:text-sm transition ring-1 ring-amber-200 shadow-sm"
              >
                <RotateCcw size={15} className="group-hover:rotate-180 transition-transform duration-500" />
                Coba Lagi
              </button>
              <Link
                href="/auth/login"
                className="group inline-flex items-center justify-center gap-2 h-11 rounded-2xl overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-bold text-xs sm:text-sm shadow-xl shadow-indigo-500/30 hover:shadow-2xl hover:shadow-indigo-500/40 hover:scale-[1.01] transition"
              >
                <ShieldCheck size={15} />
                Login Ulang
              </Link>
            </div>

            {/* Divider */}
            <div className="relative my-7 flex items-center">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="mx-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Atau</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            {/* Tombol Home + Bantuan */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-4">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-slate-900 transition"
              >
                <Home size={15} />
                Kembali ke Beranda
              </Link>
              <span className="hidden sm:inline text-slate-300">•</span>
              <p className="text-xs text-slate-500">
                Masih bermasalah? Hubungi{" "}
                <span className="font-bold text-blue-600 hover:text-blue-700 underline underline-offset-4 cursor-pointer">
                  Admin / IPCN
                </span>
              </p>
            </div>

            {/* Footer Badge */}
            <div className="mt-7 pt-6 border-t border-slate-100 flex flex-col items-center gap-1">
              <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-0.5 text-[11px] text-slate-500">
                <span className="inline-flex items-center gap-1 font-medium">
                  <ShieldCheck size={12} className="text-emerald-600" />
                  © 2026 Rumah Sakit Budi Rahayu
                </span>
                <span className="text-slate-300">·</span>
                <span className="font-medium">Sistem Surveilans PPI</span>
              </div>
              <div className="mt-1 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 ring-1 ring-slate-200">
                <ShieldCheck size={10} className="text-emerald-600" />
                <span className="text-[10px] font-bold text-slate-600">v1.0.0</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
