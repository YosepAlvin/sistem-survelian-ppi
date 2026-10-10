"use client"

import { useState } from "react"
import Image from "next/image"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import {
  ShieldCheck, FileText, BarChart3, ArrowRight,
  Mail, Lock, Eye, EyeOff, AlertTriangle,
  TrendingDown, TrendingUp, LineChart
} from "lucide-react"

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  Configuration: "Masalah konfigurasi server autentikasi. Silakan hubungi admin.",
  AccessDenied: "Akses ditolak. Anda tidak memiliki izin untuk akun ini.",
  Verification: "Verifikasi permintaan login gagal. Coba lagi.",
  OAuthSignin: "Terjadi kesalahan saat mulai masuk via provider.",
  OAuthCallback: "Kesalahan callback provider login.",
  OAuthCreateAccount: "Gagal membuat akun dari provider.",
  EmailCreateAccount: "Gagal membuat akun dari email.",
  Callback: "Kesalahan callback autentikasi.",
  OAuthAccountNotLinked: "Email ini sudah terdaftar dengan provider lain.",
  EmailSignin: "Gagal mengirim email masuk (cepat habis / salah format).",
  CredentialsSignin: "Email atau password yang Anda masukkan salah.",
  SessionRequired: "Silakan login terlebih dahulu untuk mengakses halaman itu.",
  Default: "Terjadi kesalahan autentikasi. Silakan coba lagi.",
}

export default function LoginPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const callbackUrl = searchParams.get("callbackUrl") || "/"
  const authErrorCode = searchParams.get("error")
  const authErrorMessage = authErrorCode
    ? (AUTH_ERROR_MESSAGES[authErrorCode] || AUTH_ERROR_MESSAGES.Default)
    : null

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState(authErrorMessage || "")
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setIsLoading(true)
    try {
      const result = await signIn("credentials", { email, password, redirect: false })
      if (result?.error) { setError("Email atau password salah"); setIsLoading(false) }
      else if (result?.ok) { router.push(callbackUrl); router.refresh() }
    } catch { setError("Terjadi kesalahan, coba lagi nanti"); setIsLoading(false) }
  }

  return (
    <>
      {/* Global hide scrollbar utility */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none !important; }
        .no-scrollbar { -ms-overflow-style: none !important; scrollbar-width: none !important; }
      `}</style>

      {/* ===== 100% VIEWPORT — TIDAK BOLEH ADA SCROLL LUAR ===== */}
      <main className="relative h-screen w-full overflow-hidden">
        {/* BACKGROUND GEDUNG RS FULL COVER */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/rs-budi-rahayu.jpg.png"
            alt="Rumah Sakit Budi Rahayu"
            fill priority sizes="100vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/85 via-blue-950/70 to-indigo-950/85" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(59,130,246,0.25),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(129,140,248,0.28),transparent_55%)]" />
          <div className="pointer-events-none absolute -top-40 -left-24 h-[520px] w-[520px] rounded-full bg-blue-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-48 -right-28 h-[620px] w-[620px] rounded-full bg-indigo-500/20 blur-3xl" />
        </div>

        {/* LAYOUT FLEX 3 ZONA: topbar | MAIN (flex-1 min-h-0) | (footer inside card & hero) */}
        <div className="relative z-10 h-full flex flex-col">

          {/* === ZONA 1: TOPBAR === (sangat kecil, dijamin tidak makan tempat) */}
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

          {/* === ZONA 2: MAIN CONTENT (SISA TINGGI = 100vh - topbar) === */}
          <div className="flex-1 min-h-0 w-full flex items-center justify-center px-3 sm:px-6 lg:px-8 py-2">
            <div className="w-full max-w-7xl mx-auto h-full max-h-full grid gap-3 sm:gap-5 lg:gap-10 lg:grid-cols-2 lg:items-center overflow-hidden">

              {/* ============== LEFT: HERO BRANDING (lg+) ============== */}
              <section className="order-2 lg:order-1 text-white hidden lg:flex lg:flex-col gap-2.5 max-w-lg max-h-full overflow-hidden min-h-0">
                {/* Heading */}
                <div className="shrink-0">
                  <h1 className="text-2xl xl:text-[38px] 2xl:text-5xl font-black leading-[1.05] tracking-tight drop-shadow-lg">
                    Monitoring{" "}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-sky-300 to-indigo-200">
                      Healthcare-Associated
                    </span>{" "}
                    Infections
                  </h1>
                  <p className="mt-1 text-[13px] xl:text-base text-white/80 font-medium leading-snug">
                    Mendukung surveilans infeksi secara real-time, akurat, dan aman.
                  </p>
                </div>

                {/* Feature List: hanya muncul jika tinggi viewport >= 880px (monitor besar) */}
                <ul className="shrink-0 space-y-1.5 hidden min-h-[880px]:block">
                  {[
                    { Icon: ShieldCheck, title: "Monitor", desc: "Pantau infeksi nosokomial real-time", accent: "from-blue-400 to-blue-600" },
                    { Icon: FileText,    title: "Laporan", desc: "Kelola & analisis data secara akurat", accent: "from-indigo-400 to-indigo-600" },
                    { Icon: BarChart3,   title: "Surveilans", desc: "Tingkatkan kualitas pelayanan", accent: "from-sky-400 to-blue-600" },
                  ].map(({ Icon, title, desc, accent }) => (
                    <li key={title} className="flex items-center gap-2.5 p-1.5 pr-3 rounded-xl bg-white/10 backdrop-blur-md ring-1 ring-white/15">
                      <div className={`shrink-0 h-8 w-8 rounded-lg bg-gradient-to-br ${accent} text-white grid place-items-center shadow-md`}>
                        <Icon size={15} strokeWidth={2.4} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-bold text-white leading-tight">{title}</p>
                        <p className="text-[11px] text-white/75 leading-tight">{desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>

                {/* 3 Stat Cards (selalu muncul, compact) */}
                <div className="shrink-0 grid grid-cols-3 gap-1.5 xl:gap-2 mt-0.5">
                  <div className="rounded-xl bg-white/10 backdrop-blur-md ring-1 ring-white/15 p-2 shadow-lg">
                    <p className="text-[8px] xl:text-[9px] font-bold text-white/60 uppercase tracking-wider leading-none">Infection Rate</p>
                    <p className="mt-0.5 text-xl xl:text-3xl font-black text-blue-300 leading-none">2.45%</p>
                    <div className="mt-0.5 flex items-center gap-1 text-[9px] xl:text-[10px] font-semibold text-emerald-300 leading-none">
                      <TrendingDown size={9} />
                      <span>↓ 12%</span>
                    </div>
                  </div>
                  <div className="rounded-xl bg-white/10 backdrop-blur-md ring-1 ring-white/15 p-2 shadow-lg">
                    <div className="flex items-center justify-between">
                      <p className="text-[8px] xl:text-[9px] font-bold text-white/60 uppercase tracking-wider leading-none">Trend</p>
                      <LineChart size={10} className="text-blue-300 hidden xl:block" />
                    </div>
                    <svg viewBox="0 0 200 60" preserveAspectRatio="none" className="mt-0.5 w-full h-8 xl:h-11">
                      <defs>
                        <linearGradient id="tf-hero" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="#93c5fd" stopOpacity="0.55" />
                          <stop offset="100%" stopColor="#93c5fd" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <path d="M0 48 L25 42 L50 46 L75 36 L100 40 L125 28 L150 32 L175 18 L200 12 L200 60 L0 60 Z" fill="url(#tf-hero)" />
                      <path d="M0 48 L25 42 L50 46 L75 36 L100 40 L125 28 L150 32 L175 18 L200 12" fill="none" stroke="#bfdbfe" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div className="rounded-xl bg-white/10 backdrop-blur-md ring-1 ring-white/15 p-2 shadow-lg">
                    <p className="text-[8px] xl:text-[9px] font-bold text-white/60 uppercase tracking-wider leading-none">Total Laporan</p>
                    <p className="mt-0.5 text-xl xl:text-3xl font-black text-white leading-none">128</p>
                    <div className="mt-0.5 flex items-center gap-1 text-[9px] xl:text-[10px] font-semibold text-emerald-300 leading-none">
                      <TrendingUp size={9} />
                      <span>↑ 8%</span>
                    </div>
                  </div>
                </div>

                {/* Mini hero footer copyright */}
                <div className="mt-auto pt-2 shrink-0 text-white/80 drop-shadow">
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[10px] xl:text-[11px]">
                    <span className="font-medium leading-none">© 2026 Rumah Sakit Budi Rahayu</span>
                    <span className="text-white/40 leading-none">·</span>
                    <span className="font-medium leading-none text-white/80">Sistem Surveilans PPI</span>
                  </div>
                </div>
              </section>

              {/* ============== RIGHT: LOGIN CARD (SUDAH BERSIH — TIDAK ADA DEMO ACCOUNT) ============== */}
              <section className="order-1 lg:order-2 w-full h-full max-h-full min-h-0 flex items-center justify-center">
                <div className="relative mx-auto w-full max-w-lg rounded-[1.4rem] sm:rounded-[1.7rem] bg-white/95 backdrop-blur-2xl shadow-2xl shadow-slate-950/40 ring-1 ring-white/40 p-5 sm:p-7 lg:p-8 xl:p-9 overflow-y-auto max-h-full no-scrollbar flex flex-col min-h-0">

                  {/* BRAND ATAS */}
                  <div className="shrink-0 flex flex-col items-center text-center">
                    <div className="relative h-14 w-14 sm:h-18 sm:w-18 xl:h-20 xl:w-20 rounded-2xl bg-gradient-to-br from-white to-blue-50 ring-1 ring-blue-100 shadow-md flex items-center justify-center"
                         style={{ width: "72px", height: "72px" }}>
                      <Image src="/logo.png" alt="RS Budi Rahayu" width={56} height={56} className="object-contain" priority />
                    </div>
                    <h2 className="mt-4 text-[22px] sm:text-3xl xl:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                      Sistem Surveilans PPI
                    </h2>
                    <p className="mt-1 text-sm sm:text-lg xl:text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent leading-tight">
                      Rumah Sakit Budi Rahayu
                    </p>
                    <p className="mt-3 text-xs sm:text-sm xl:text-[15px] text-slate-600 max-w-xs leading-relaxed">
                      Silakan masuk menggunakan akun yang telah diberikan.
                    </p>
                  </div>

                  {/* === FORM (TANPA SHRINK, TANPA SCROLL INTERNAL) — SELURUH ISI PASTI TERURUT === */}
                  <form onSubmit={handleSubmit} className="mt-7 sm:mt-8 xl:mt-10 space-y-4 sm:space-y-5">

                    {/* EMAIL */}
                    <div className="space-y-2">
                      <label htmlFor="email" className="block text-sm font-semibold text-slate-800">
                        Email
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                          <Mail size={18} />
                        </span>
                        <input
                          id="email"
                          type="email"
                          required
                          autoComplete="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Masukkan email Anda"
                          className="w-full h-12 pl-12 pr-4 rounded-2xl bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-blue-400 focus:ring-4 focus:ring-blue-100 outline-none transition text-sm sm:text-base"
                        />
                      </div>
                    </div>

                    {/* PASSWORD — JARAK SAMA DENGAN EMAIL, TIDAK TUMPUK DENGAN APAPUN */}
                    <div className="space-y-2">
                      <label htmlFor="password" className="block text-sm font-semibold text-slate-800">
                        Password
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                          <Lock size={18} />
                        </span>
                        <input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          required
                          autoComplete="current-password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Masukkan password Anda"
                          className="w-full h-12 pl-12 pr-12 rounded-2xl bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-blue-400 focus:ring-4 focus:ring-blue-100 outline-none transition text-sm sm:text-base"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(s => !s)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 grid place-items-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                          aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                        >
                          {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                        </button>
                      </div>
                    </div>

                    {/* INGAT SAYA + LUPA PASSWORD */}
                    <div className="flex items-center justify-between pt-0.5">
                      <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={remember}
                          onChange={(e) => setRemember(e.target.checked)}
                          className="rounded-md border-slate-300 text-blue-600 focus:ring-blue-400 cursor-pointer"
                          style={{ width: "17px", height: "17px" }}
                        />
                        <span className="text-sm font-medium text-slate-700">Ingat saya</span>
                      </label>
                      <Link
                        href="#"
                        className="text-sm font-bold text-blue-600 hover:text-blue-700 hover:underline underline-offset-4 transition"
                      >
                        Lupa password?
                      </Link>
                    </div>

                    {/* ERROR BOX — lebih jelas, bedakan auth error vs submit error */}
                    {error && (
                      <div className={`rounded-2xl px-4 py-3 text-sm font-medium flex items-start gap-2.5 ring-1 ${
                        authErrorCode
                          ? "bg-amber-50 border-amber-200 ring-amber-200 text-amber-800"
                          : "bg-rose-50 border-rose-200 ring-rose-200 text-rose-700"
                      }`}>
                        {authErrorCode ? (
                          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-600" />
                        ) : (
                          <Lock size={16} className="mt-0.5 shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          {authErrorCode && (
                            <p className="text-[10px] font-black uppercase tracking-widest text-amber-700 mb-0.5">
                              Auth Error · {authErrorCode}
                            </p>
                          )}
                          <span className="leading-relaxed">{error}</span>
                        </div>
                      </div>
                    )}

                    {/* === TOMBOL LOGIN SECURE — PASTI SELALU TERLIHAT, JARAK CUKUP === */}
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="group relative w-full rounded-2xl overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-bold shadow-xl shadow-indigo-500/30 hover:shadow-2xl hover:shadow-indigo-500/40 hover:scale-[1.01] active:scale-[0.99] transition disabled:opacity-70 disabled:cursor-not-allowed"
                      style={{ height: "54px" }}
                    >
                      <span className="relative z-10 flex items-center justify-center gap-3 text-[15px] sm:text-base">
                        {isLoading ? (
                          <>
                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3"/>
                              <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                            </svg>
                            Memproses...
                          </>
                        ) : (
                          <>
                            <ShieldCheck size={19} />
                            Login Secure
                            <ArrowRight size={19} className="group-hover:translate-x-1 transition" />
                          </>
                        )}
                      </span>
                    </button>
                  </form>

                  {/* === FOOTER DI DALAM CARD (tidak makan tinggi luar) === */}
                  <div className="shrink-0 mt-auto pt-7 xl:pt-9 flex flex-col items-center text-center gap-1.5">
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <ShieldCheck size={14} className="text-emerald-600" />
                      <p className="text-xs font-bold">Data Anda aman bersama kami</p>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-0.5 text-[11px] text-slate-500">
                      <span className="font-medium">© 2026 Rumah Sakit Budi Rahayu</span>
                      <span className="text-slate-300">·</span>
                      <span className="font-medium">Sistem Surveilans PPI</span>
                    </div>
                    <div className="mt-0.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 ring-1 ring-slate-200">
                      <ShieldCheck size={10} className="text-emerald-600" />
                      <span className="text-[10px] font-bold text-slate-600">Version 1.0.0</span>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
