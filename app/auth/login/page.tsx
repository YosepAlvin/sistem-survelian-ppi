"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError("Email atau password salah")
        setIsLoading(false)
      } else if (result?.ok) {
        // Keep loading true while navigating
        router.push("/")
        await router.refresh()
      }
    } catch (err) {
      setError("Terjadi kesalahan. Silakan coba lagi.")
      setIsLoading(false)
    }
    // Note: We don't set isLoading(false) here because the SessionLoadingWrapper will take over
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex items-center justify-center px-3 sm:px-4">
      {/* Background Effects */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-[20%] -left-[10%] h-[600px] w-[600px] rounded-full bg-blue-600/20 blur-[120px]" />
        <div className="absolute -bottom-[20%] -right-[10%] h-[600px] w-[600px] rounded-full bg-indigo-600/20 blur-[120px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl sm:rounded-3xl shadow-xl p-5 sm:p-8">
          {/* Logo & Header */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="flex justify-center mb-4 sm:mb-6">
              <div className="flex h-20 w-20 sm:h-32 sm:w-32 items-center justify-center rounded-2xl sm:rounded-3xl">
                <img src="/logo.png" alt="Logo RS Budi Rahayu" className="h-full w-full object-contain" />
              </div>
            </div>
            <h1 className="text-xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">
              Sistem Surveilans PPI
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Rumah Sakit Budi Rahayu
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 sm:p-4 bg-red-500/20 border border-red-500/50 text-red-300 rounded-xl sm:rounded-2xl text-xs sm:text-sm">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            {/* Email */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-200 mb-1 sm:mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contoh: admin@rs.com"
                className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/10 border border-white/20 text-white rounded-xl sm:rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-400 text-xs sm:text-sm"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-200 mb-1 sm:mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-white/10 border border-white/20 text-white rounded-xl sm:rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-400 text-xs sm:text-sm"
                required
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 sm:py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl sm:rounded-2xl transition-all hover:scale-[1.02] disabled:bg-slate-500 disabled:hover:scale-100 text-xs sm:text-sm flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sedang login...
                </>
              ) : (
                "Login"
              )}
            </button>
          </form>

          {/* Test Credentials */}
          <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-white/20">
            <p className="text-xs sm:text-sm font-semibold text-slate-200 mb-2 sm:mb-3">
              Test Credentials:
            </p>
            <div className="space-y-1 sm:space-y-2 text-[10px] sm:text-xs text-slate-300 bg-white/5 p-3 sm:p-4 rounded-xl sm:rounded-2xl">
              <div>
                <strong>Admin:</strong> admin@rs.com / admin123
              </div>
              <div>
                <strong>IPCN:</strong> ipcn@rs.com / admin123
              </div>
              <div>
                <strong>IPCLN:</strong> ipcln.icu@rs.com / admin123
              </div>
            </div>
          </div>

          {/* Back to Home */}
          <div className="mt-4 sm:mt-6 text-center">
            <Link href="/" className="text-xs sm:text-sm text-blue-300 hover:text-blue-200 font-medium transition-colors">
              ← Kembali ke halaman awal
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
