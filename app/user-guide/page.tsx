"use client"

import { useState } from "react"
import Link from "next/link"
import { Home, ChevronDown, Shield, Stethoscope, UserCog } from "lucide-react"

export default function UserGuidePage() {
  const [openSection, setOpenSection] = useState<string | null>(null)

  const sections = [
    {
      id: "umum",
      title: "Panduan Umum",
      items: [
        {
          question: "Bagaimana cara login ke sistem",
          answer: (
            <ol className="list-decimal ml-5 space-y-1 text-sm text-slate-700">
              <li>Buka browser dan akses alamat sistem</li>
              <li>Klik tombol &ldquo;Masuk ke Sistem&rdquo; atau &ldquo;Login&rdquo;</li>
              <li>Masukkan email dan password yang telah diberikan</li>
              <li>Klik tombol &ldquo;Login&rdquo;</li>
              <li>Jika berhasil, Anda akan diarahkan ke dashboard sesuai role</li>
            </ol>
          )
        },
        {
          question: "Bagaimana cara logout dari sistem",
          answer: (
            <ol className="list-decimal ml-5 space-y-1 text-sm text-slate-700">
              <li>Klik nama pengguna di pojok kanan atas</li>
              <li>Pilih opsi &ldquo;Logout&rdquo; atau &ldquo;Keluar&rdquo;</li>
            </ol>
          )
        },
        {
          question: "Apa yang harus dilakukan jika lupa password",
          answer: (
            <p className="text-sm text-slate-700">
              Hubungi Admin Sistem untuk mereset password Anda.
            </p>
          )
        }
      ]
    },
    {
      id: "admin",
      title: "Panduan Admin",
      icon: UserCog,
      items: [
        {
          question: "Bagaimana menambah pengguna baru",
          answer: (
            <ol className="list-decimal ml-5 space-y-1 text-sm text-slate-700">
              <li>Login sebagai admin</li>
              <li>Buka menu &ldquo;Admin&rdquo; → &ldquo;Users&rdquo;</li>
              <li>Klik tombol &ldquo;Tambah User&rdquo;</li>
              <li>Isi data pengguna (nama, email, password, role, ruangan)</li>
              <li>Klik &ldquo;Simpan&rdquo;</li>
            </ol>
          )
        },
        {
          question: "Bagaimana mengedit data pengguna",
          answer: (
            <ol className="list-decimal ml-5 space-y-1 text-sm text-slate-700">
              <li>Login sebagai admin</li>
              <li>Buka menu &ldquo;Admin&rdquo; → &ldquo;Users&rdquo;</li>
              <li>Cari pengguna yang akan diedit</li>
              <li>Klik tombol &ldquo;Edit&rdquo;</li>
              <li>Ubah data sesuai kebutuhan</li>
              <li>Klik &ldquo;Simpan&rdquo;</li>
            </ol>
          )
        },
        {
          question: "Bagaimana menghapus pengguna",
          answer: (
            <ol className="list-decimal ml-5 space-y-1 text-sm text-slate-700">
              <li>Login sebagai admin</li>
              <li>Buka menu &ldquo;Admin&rdquo; → &ldquo;Users&rdquo;</li>
              <li>Cari pengguna yang akan dihapus</li>
              <li>Klik tombol &ldquo;Hapus&rdquo;</li>
              <li>Konfirmasi penghapusan</li>
            </ol>
          )
        },
        {
          question: "Bagaimana menambah ruangan baru",
          answer: (
            <ol className="list-decimal ml-5 space-y-1 text-sm text-slate-700">
              <li>Login sebagai admin</li>
              <li>Buka menu &ldquo;Admin&rdquo; → &ldquo;Ruangan&rdquo;</li>
              <li>Klik &ldquo;Tambah Ruangan&rdquo;</li>
              <li>Isi nama ruangan, kode, dan jenis</li>
              <li>Klik &ldquo;Simpan&rdquo;</li>
            </ol>
          )
        },
        {
          question: "Bagaimana melihat audit trail",
          answer: (
            <ol className="list-decimal ml-5 space-y-1 text-sm text-slate-700">
              <li>Login sebagai admin</li>
              <li>Buka menu &ldquo;Audit Trail&rdquo; atau &ldquo;Log Aktivitas&rdquo;</li>
              <li>Lihat riwayat aktivitas pengguna di sistem</li>
            </ol>
          )
        }
      ]
    },
    {
      id: "ipcn",
      title: "Panduan IPCN",
      icon: Shield,
      items: [
        {
          question: "Bagaimana melihat dashboard rumah sakit",
          answer: (
            <ol className="list-decimal ml-5 space-y-1 text-sm text-slate-700">
              <li>Login sebagai IPCN</li>
              <li>Anda akan langsung diarahkan ke dashboard</li>
              <li>Lihat statistik dan grafik monitoring pasien</li>
            </ol>
          )
        },
        {
          question: "Bagaimana memantau pasien aktif",
          answer: (
            <ol className="list-decimal ml-5 space-y-1 text-sm text-slate-700">
              <li>Login sebagai IPCN</li>
              <li>Buka menu &ldquo;Pasien&rdquo; atau &ldquo;Monitoring&rdquo;</li>
              <li>Lihat daftar pasien yang sedang dirawat</li>
            </ol>
          )
        },
        {
          question: "Bagaimana memantau device day",
          answer: (
            <ol className="list-decimal ml-5 space-y-1 text-sm text-slate-700">
              <li>Login sebagai IPCN</li>
              <li>Buka menu &ldquo;Device Day&rdquo;</li>
              <li>Lihat daftar alat medis yang sedang digunakan</li>
            </ol>
          )
        },
        {
          question: "Bagaimana verifikasi kasus infeksi",
          answer: (
            <ol className="list-decimal ml-5 space-y-1 text-sm text-slate-700">
              <li>Login sebagai IPCN</li>
              <li>Buka menu &ldquo;Verifikasi&rdquo;</li>
              <li>Pilih kasus infeksi yang akan diverifikasi</li>
              <li>Periksa detail kasus dengan seksama</li>
              <li>Jika valid, klik &ldquo;Verifikasi&rdquo;</li>
              <li>Jika tidak valid, klik &ldquo;Tolak&rdquo; dan berikan alasan</li>
            </ol>
          )
        },
        {
          question: "Bagaimana melihat dan export laporan",
          answer: (
            <ol className="list-decimal ml-5 space-y-1 text-sm text-slate-700">
              <li>Login sebagai IPCN</li>
              <li>Buka menu &ldquo;Laporan&rdquo;</li>
              <li>Pilih jenis laporan (harian, bulanan, IDO, dll.)</li>
              <li>Pilih rentang tanggal atau bulan</li>
              <li>Klik &ldquo;Export&rdquo; untuk mengunduh laporan</li>
            </ol>
          )
        }
      ]
    },
    {
      id: "ipcln",
      title: "Panduan IPCLN",
      icon: Stethoscope,
      items: [
        {
          question: "Bagaimana menambah pasien baru",
          answer: (
            <ol className="list-decimal ml-5 space-y-1 text-sm text-slate-700">
              <li>Login sebagai IPCLN</li>
              <li>Buka menu &ldquo;Pasien&rdquo;</li>
              <li>Klik tombol &ldquo;Tambah Pasien&rdquo;</li>
              <li>Isi data pasien secara lengkap</li>
              <li>Klik &ldquo;Simpan&rdquo;</li>
            </ol>
          )
        },
        {
          question: "Bagaimana melihat dan mengedit data pasien",
          answer: (
            <ol className="list-decimal ml-5 space-y-1 text-sm text-slate-700">
              <li>Login sebagai IPCLN</li>
              <li>Buka menu &ldquo;Pasien&rdquo;</li>
              <li>Pilih pasien yang ingin dilihat</li>
              <li>Untuk mengedit, klik tombol &ldquo;Edit&rdquo;</li>
              <li>Ubah data sesuai kebutuhan</li>
              <li>Klik &ldquo;Simpan&rdquo;</li>
            </ol>
          )
        },
        {
          question: "Bagaimana mengisi surveilans harian",
          answer: (
            <ol className="list-decimal ml-5 space-y-1 text-sm text-slate-700">
              <li>Login sebagai IPCLN</li>
              <li>Pilih menu &ldquo;Surveilans Harian&rdquo;</li>
              <li>Pilih pasien yang akan diisi</li>
              <li>Isi form surveilans sesuai formulir (suhu, alat, dll.)</li>
              <li>Klik &ldquo;Simpan&rdquo;</li>
            </ol>
          )
        },
        {
          question: "Bagaimana mengedit surveilans harian yang sudah diisi",
          answer: (
            <ol className="list-decimal ml-5 space-y-1 text-sm text-slate-700">
              <li>Login sebagai IPCLN</li>
              <li>Buka riwayat surveilans pasien</li>
              <li>Pilih surveilans yang ingin diedit</li>
              <li>Klik tombol &ldquo;Edit&rdquo;</li>
              <li>Ubah data sesuai kebutuhan</li>
              <li>Klik &ldquo;Simpan&rdquo;</li>
            </ol>
          )
        },
        {
          question: "Bagaimana mencatat alat medis yang dipasang",
          answer: (
            <ol className="list-decimal ml-5 space-y-1 text-sm text-slate-700">
              <li>Login sebagai IPCLN</li>
              <li>Buka detail pasien</li>
              <li>Pilih &ldquo;Alat Medis&rdquo;</li>
              <li>Klik &ldquo;Pasang Alat&rdquo;</li>
              <li>Pilih jenis alat dan tanggal pasang</li>
              <li>Saat dilepas, klik &ldquo;Lepas Alat&rdquo; dan isi tanggal lepas</li>
            </ol>
          )
        },
        {
          question: "Bagaimana mencatat kejadian infeksi",
          answer: (
            <ol className="list-decimal ml-5 space-y-1 text-sm text-slate-700">
              <li>Login sebagai IPCLN</li>
              <li>Buka detail pasien</li>
              <li>Pilih &ldquo;Kejadian Infeksi&rdquo;</li>
              <li>Klik &ldquo;Tambah Kejadian&rdquo;</li>
              <li>Isi data kejadian infeksi dengan lengkap</li>
              <li>Klik &ldquo;Simpan&rdquo;</li>
            </ol>
          )
        }
      ]
    }
  ]

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm mb-4">
            <Home className="h-4 w-4" />
            Kembali ke Halaman Utama
          </Link>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Panduan Pengguna</h1>
          <p className="text-slate-600">Panduan lengkap penggunaan Sistem Surveilans PPI Rumah Sakit Budi Rahayu</p>
        </div>

        <div className="space-y-4">
          {sections.map((section) => {
            const Icon = section.icon
            return (
              <div key={section.id} className="rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden">
                <button
                  onClick={() => setOpenSection(openSection === section.id ? null : section.id)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-3">
                    {Icon && <Icon className="h-5 w-5 text-blue-400" />}
                    <span className="font-medium text-slate-900">{section.title}</span>
                  </div>
                  <ChevronDown
                    className={`h-5 w-5 text-slate-600 transition-transform ${
                      openSection === section.id ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {openSection === section.id && (
                  <div className="px-6 pb-4 space-y-4">
                    {section.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <h4 className="font-medium text-slate-900 mb-2">{item.question}</h4>
                        {item.answer}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="mt-12 text-center p-8 rounded-2xl border border-blue-500/20 bg-blue-500/5">
          <h3 className="text-slate-900 font-semibold mb-2">Masih membutuhkan bantuan</h3>
          <p className="text-slate-600 text-sm">Hubungi Admin Sistem atau Tim IPCN Rumah Sakit Budi Rahayu</p>
        </div>
      </div>
    </main>
  )
}
