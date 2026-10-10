"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Home, Database, Server, RefreshCw, CheckCircle, AlertTriangle, X } from "lucide-react"

type SystemStatus = {
  database: "online" | "offline"
  server: "online" | "offline"
  api: "online" | "offline"
  lastUpdate: string
}

export default function StatusPage() {
  const [status, setStatus] = useState<SystemStatus | null>(null)
  const [loading, setLoading] = useState(true)

  const checkStatus = async () => {
    try {
      setLoading(true)
      
      const healthRes = await fetch("/api/health")
      const health = healthRes.ok

      const statsRes = await fetch("/api/stats")
      const stats = statsRes.ok

      setStatus({
        database: health ? "online" : "offline",
        server: "online",
        api: stats ? "online" : "offline",
        lastUpdate: new Date().toLocaleString("id-ID")
      })
    } catch (err) {
      setStatus({
        database: "offline",
        server: "offline",
        api: "offline",
        lastUpdate: new Date().toLocaleString("id-ID")
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkStatus()
    const interval = setInterval(checkStatus, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const StatusBadge = ({ status, label }: { status: "online" | "offline", label: string }) => {
    const colors = {
      online: "text-emerald-700 bg-emerald-500/10 border-emerald-500/20",
      offline: "text-red-400 bg-red-500/10 border-red-500/20"
    }

    const icons = {
      online: CheckCircle,
      offline: X
    }

    const Icon = icons[status]

    return (
      <div className={`p-4 rounded-xl border ${colors[status]} flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <Icon className="h-5 w-5" />
          <span className="font-medium text-slate-900">{label}</span>
        </div>
        <span className={`text-xs font-bold uppercase ${status === "online" ? "text-emerald-700" : "text-red-400"}`}>
          {status === "online" ? "Online" : "Offline"}
        </span>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm mb-4">
            <Home className="h-4 w-4" />
            Kembali ke Halaman Utama
          </Link>
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-slate-900">Status Sistem</h1>
            <button
              onClick={checkStatus}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-300 border border-slate-300 text-slate-900 rounded-xl text-sm transition-all disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
          <p className="text-slate-600">Monitor kondisi sistem secara real-time</p>
          {status?.lastUpdate && (
            <p className="text-xs text-slate-500 mt-1">
              Terakhir diperbarui: {status.lastUpdate}
            </p>
          )}
        </div>

        {/* Status Cards */}
        <div className="grid gap-4 mb-8">
          {loading ? (
            Array(3).fill(null).map((_, i) => (
              <div key={i} className="p-4 rounded-xl border border-slate-200 bg-slate-50 animate-pulse h-16"></div>
            ))
          ) : status ? (
            <>
              <StatusBadge status={status.server} label="Server" />
              <StatusBadge status={status.database} label="Database" />
              <StatusBadge status={status.api} label="API" />
            </>
          ) : null}
        </div>

        {/* Info Box */}
        <div className="p-6 rounded-2xl border border-amber-500/20 bg-amber-500/5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-6 w-6 text-amber-600 mt-0.5" />
            <div>
              <h3 className="text-slate-900 font-medium mb-1">Informasi</h3>
              <p className="text-sm text-slate-700">
                Status sistem diperbarui setiap 30 detik. Jika ada indikator offline, silakan periksa koneksi server dan database.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Link href="/help" className="group">
            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50 hover:border-blue-500/30 hover:bg-blue-500/5 transition-all">
              <h3 className="text-slate-900 font-semibold mb-1">Pusat Bantuan</h3>
              <p className="text-sm text-slate-600">Lihat panduan dan FAQ</p>
            </div>
          </Link>
          <Link href="/auth/login" className="group">
            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50 hover:border-blue-500/30 hover:bg-blue-500/5 transition-all">
              <h3 className="text-slate-900 font-semibold mb-1">Login</h3>
              <p className="text-sm text-slate-600">Masuk ke sistem</p>
            </div>
          </Link>
          <Link href="/user-guide" className="group">
            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50 hover:border-blue-500/30 hover:bg-blue-500/5 transition-all">
              <h3 className="text-slate-900 font-semibold mb-1">User Guide</h3>
              <p className="text-sm text-slate-600">Lihat panduan lengkap</p>
            </div>
          </Link>
        </div>
      </div>
    </main>
  )
}