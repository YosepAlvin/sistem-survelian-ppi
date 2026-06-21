"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowRight, ChevronDown, Home, Shield, Stethoscope } from "lucide-react"

export default function HelpPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const faqs = [
    {
      question: "Bagaimana cara menambah pasien baru?",
      answer: (
        <ul className="list-disc ml-4 space-y-1 text-sm text-slate-300">
          <li>Login sebagai IPCLN</li>
          <li>Pilih menu "Pasien"</li>
          <li>Klik tombol "Tambah Pasien"</li>
          <li>Isi data pasien secara lengkap</li>
          <li>Klik "Simpan"</li>
        </ul>
      )
    },
    {
      question: "Bagaimana cara mengisi surveilans harian?",
      answer: (
        <ul className="list-disc ml-4 space-y-1 text-sm text-slate-300">
          <li>Login sebagai IPCLN</li>
          <li>Pilih menu "Surveilans Harian"</li>
          <li>Pilih pasien yang akan diisi</li>
          <li>Isi form surveilans sesuai formulir</li>
          <li>Klik "Simpan"</li>
        </ul>
      )
    },
    {
      question: "Bagaimana cara verifikasi kejadian infeksi?",
      answer: (
        <ul className="list-disc ml-4 space-y-1 text-sm text-slate-300">
          <li>Login sebagai IPCN</li>
          <li>Pilih menu "Verifikasi"</li>
          <li>Pilih kasus infeksi yang akan diverifikasi</li>
          <li>Periksa detail kasus</li>
          <li>Klik "Verifikasi" atau "Tolak" sesuai kondisi</li>
        </ul>
      )
    },
    {
      question: "Bagaimana cara memperbaiki data yang salah?",
      answer: (
        <ul className="list-disc ml-4 space-y-1 text-sm text-slate-300">
          <li>Untuk data pasien: Buka detail pasien → klik "Edit"</li>
          <li>Untuk surveilans: Buka surveilans harian → klik "Edit"</li>
          <li>Jika data sudah diverifikasi, hubungi IPCN atau Admin</li>
        </ul>
      )
    },
    {
      question: "Bagaimana cara melihat laporan?",
      answer: (
        <ul className="list-disc ml-4 space-y-1 text-sm text-slate-300">
          <li>Login sebagai IPCN atau Admin</li>
          <li>Pilih menu "Laporan"</li>
          <li>Pilih jenis laporan (harian, bulanan, IDO, dll.)</li>
          <li>Pilih rentang tanggal atau bulan</li>
          <li>Klik "Export" untuk mengunduh file Excel/PDF</li>
        </ul>
      )
    },
    {
      question: "Bagaimana mencatat alat medis yang dipasang?",
      answer: (
        <ul className="list-disc ml-4 space-y-1 text-sm text-slate-300">
          <li>Login sebagai IPCLN</li>
          <li>Buka detail pasien</li>
          <li>Pilih "Alat Medis"</li>
          <li>Klik "Pasang Alat"</li>
          <li>Pilih jenis alat dan tanggal pasang</li>
          <li>Saat dilepas, klik "Lepas Alat" dan isi tanggal lepas</li>
        </ul>
      )
    }
  ]

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm mb-4">
            <Home className="h-4 w-4" />
            Kembali ke Halaman Utama
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">Pusat Bantuan</h1>
          <p className="text-slate-400">Pertanyaan umum dan panduan penggunaan Sistem Surveilans PPI</p>
        </div>

        {/* Quick Links */}
        <div className="grid gap-4 mb-8 sm:grid-cols-3">
          <Link href="/auth/login" className="group">
            <div className="p-6 rounded-2xl border border-white/10 bg-white/5 hover:border-blue-500/30 hover:bg-blue-500/5 transition-all">
              <div className="flex items-center justify-between mb-2">
                <Shield className="h-6 w-6 text-blue-400" />
                <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-blue-400 transition-all" />
              </div>
              <h3 className="text-white font-semibold">Login</h3>
              <p className="text-sm text-slate-400 mt-1">Panduan login ke sistem</p>
            </div>
          </Link>
          <Link href="/auth/login" className="group">
            <div className="p-6 rounded-2xl border border-white/10 bg-white/5 hover:border-blue-500/30 hover:bg-blue-500/5 transition-all">
              <div className="flex items-center justify-between mb-2">
                <Stethoscope className="h-6 w-6 text-blue-400" />
                <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-blue-400 transition-all" />
              </div>
              <h3 className="text-white font-semibold">IPCLN</h3>
              <p className="text-sm text-slate-400 mt-1">Masuk sebagai IPCLN</p>
            </div>
          </Link>
          <Link href="/auth/login" className="group">
            <div className="p-6 rounded-2xl border border-white/10 bg-white/5 hover:border-blue-500/30 hover:bg-blue-500/5 transition-all">
              <div className="flex items-center justify-between mb-2">
                <Shield className="h-6 w-6 text-blue-400" />
                <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-blue-400 transition-all" />
              </div>
              <h3 className="text-white font-semibold">IPCN</h3>
              <p className="text-sm text-slate-400 mt-1">Masuk sebagai IPCN</p>
            </div>
          </Link>
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-white mb-4">Pertanyaan Umum</h2>
          {faqs.map((faq, index) => (
            <div 
              key={index}
              className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-4 flex items-center justify-between text-left"
              >
                <span className="font-medium text-white">{faq.question}</span>
                <ChevronDown 
                  className={`h-5 w-5 text-slate-400 transition-transform ${openIndex === index ? "rotate-180" : ""}`}
                />
              </button>
              {openIndex === index && (
                <div className="px-6 pb-4">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Need More Help */}
        <div className="mt-12 text-center p-8 rounded-2xl border border-blue-500/20 bg-blue-500/5">
          <h3 className="text-white font-semibold mb-2">Masih membutuhkan bantuan?</h3>
          <p className="text-slate-400 text-sm">Hubungi Admin Sistem atau Tim IPCN Rumah Sakit Budi Rahayu</p>
        </div>
      </div>
    </main>
  )
}