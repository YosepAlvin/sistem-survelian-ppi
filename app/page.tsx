"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useSession } from "next-auth/react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (session?.user) {
      const userRole = (session.user as any)?.role?.toUpperCase()
      switch (userRole) {
        case "ADMIN":
          router.push("/admin/dashboard")
          break
        case "IPCN":
          router.push("/ipcn/dashboard")
          break
        case "IPCLN":
          router.push("/ipcln/dashboard")
          break
        default:
          break
      }
    }
  }, [session, router])

  // Show loading state
  if (status === "loading") {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
        <div className="text-white text-2xl">Loading...</div>
      </main>
    )
  }

  // If user is not authenticated, show landing page
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800">
      <div className="container mx-auto px-4 py-20">
        <div className="flex flex-col items-center justify-center min-h-screen">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-white mb-4">
              Sistem Surveilans PPI
            </h1>
            <p className="text-xl text-blue-100 mb-2">
              Pencegahan dan Pengendalian Infeksi
            </p>
            <p className="text-lg text-blue-200">
              Rumah Sakit Budi Rahayu
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-8 mb-12 max-w-4xl">
            {/* Admin */}
            <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition">
              <div className="text-3xl mb-4">👤</div>
              <h3 className="text-xl font-bold mb-2 text-gray-800">Admin</h3>
              <p className="text-gray-600 mb-6">
                Kelola users, ruangan, dokter, dan master data sistem
              </p>
              <Link href="/auth/login">
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  Login sebagai Admin
                </Button>
              </Link>
            </div>

            {/* IPCN */}
            <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition">
              <div className="text-3xl mb-4">📊</div>
              <h3 className="text-xl font-bold mb-2 text-gray-800">IPCN</h3>
              <p className="text-gray-600 mb-6">
                Monitor data surveilans, verifikasi infeksi, dan laporan bulanan
              </p>
              <Link href="/auth/login">
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  Login sebagai IPCN
                </Button>
              </Link>
            </div>

            {/* IPCLN */}
            <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition">
              <div className="text-3xl mb-4">🏥</div>
              <h3 className="text-xl font-bold mb-2 text-gray-800">IPCLN</h3>
              <p className="text-gray-600 mb-6">
                Input data pasien, surveilans, dan infeksi harian
              </p>
              <Link href="/auth/login">
                <Button className="w-full bg-purple-600 hover:bg-purple-700">
                  Login sebagai IPCLN
                </Button>
              </Link>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-white bg-opacity-10 backdrop-blur rounded-lg p-8 max-w-2xl text-white">
            <h2 className="text-2xl font-bold mb-4">Test Credentials</h2>
            <div className="space-y-3 text-sm">
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
        </div>
      </div>
    </main>
  )
}
