"use client"

import React, { useState, useEffect } from 'react'
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import axios from "axios"
import { PageHeader } from "@/components/ui/PageHeader"
import { StatCard } from "@/components/ui/StatCard"
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton"
import { Users, Building2, Stethoscope, ClipboardList, ArrowRight, Activity } from 'lucide-react'
import Link from 'next/link'

export default function AdminDashboard() {
  const { data: session } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState({
    users: 0,
    ruangan: 0,
    dokter: 0,
    diagnosa: 0,
    alatKesehatan: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get("/api/admin/stats")
        setStats(res.data)
      } catch (err) {
        console.error("Gagal mengambil statistik admin")
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  return (
    <>
      <PageHeader
        title="Dashboard Admin"
        description="Kelola sistem, user, dan data master rumah sakit"
      />

      {/* Welcome Card */}
      <div className="mb-8 p-4 md:p-6 bg-gradient-to-r from-blue-900 to-blue-800 rounded-lg text-white shadow-lg dark:shadow-2xl">
        <p className="text-lg font-medium">
          Selamat datang kembali, <strong>{session?.user?.name}</strong>
        </p>
        <p className="text-blue-200 text-sm mt-1">
          Anda login sebagai Admin Sistem
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        {loading ? (
          <>
            <LoadingSkeleton count={5} rows={3} />
          </>
        ) : (
          <>
            <StatCard
              title="Total User"
              value={stats.users}
              description="Akun pengguna aktif"
              icon={<Users size={28} />}
              color="blue"
              onClick={() => router.push("/admin/users")}
            />

            <StatCard
              title="Ruangan"
              value={stats.ruangan}
              description="Master data ruangan"
              icon={<Building2 size={28} />}
              color="green"
              onClick={() => router.push("/admin/ruangan")}
            />

            <StatCard
              title="Total Dokter"
              value={stats.dokter}
              description="Dokter terdaftar"
              icon={<Stethoscope size={28} />}
              color="purple"
              onClick={() => router.push("/admin/dokter")}
            />

            <StatCard
              title="Diagnosa"
              value={stats.diagnosa}
              description="Data diagnosa tersedia"
              icon={<ClipboardList size={28} />}
              color="amber"
              onClick={() => router.push("/admin/diagnosa")}
            />

            <StatCard
              title="Alat Kesehatan"
              value={stats.alatKesehatan}
              description="Master data alat"
              icon={<Activity size={28} />}
              color="red"
              onClick={() => router.push("/admin/alat-kesehatan")}
            />
          </>
        )}
      </div>

      {/* Info Section */}
      <div className="bg-[#172033]/50 backdrop-blur-xl rounded-[2rem] border border-white/5 p-8 shadow-2xl">
        <h3 className="text-xl font-black text-white tracking-tight mb-6">
          Menu Manajemen
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/admin/users" className="group p-6 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-primary/30 transition-all duration-300">
            <p className="font-bold text-white mb-2 flex items-center gap-2">
              📋 Data Master
              <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </p>
            <p className="text-slate-400 text-sm font-medium">Kelola user, ruangan, dokter, dan diagnosa sistem secara terpusat.</p>
          </Link>
          <Link href="/admin/settings" className="group p-6 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-primary/30 transition-all duration-300">
            <p className="font-bold text-white mb-2 flex items-center gap-2">
              ⚙️ Pengaturan
              <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </p>
            <p className="text-slate-400 text-sm font-medium">Konfigurasi parameter sistem, audit log, dan hak akses keamanan.</p>
          </Link>
        </div>
      </div>
    </>
  )
}

