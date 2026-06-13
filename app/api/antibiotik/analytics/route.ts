import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { calcAntibiotikStatus } from "@/lib/antibiotik-status"

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const tahun = parseInt(searchParams.get("tahun") || String(new Date().getFullYear()))

    const role = (session.user as any).role
    const ruanganId = (session.user as any).ruanganId

    const whereBase: any =
      role === "IPCLN" && ruanganId
        ? { rawat_inap: { ruangan_id: parseInt(ruanganId) } }
        : {}

    const allRecords = await db.penggunaanAntibiotik.findMany({
      where: whereBase,
      include: {
        antibiotik: true,
        rawat_inap: { include: { ruangan: true } },
      },
    })

    // Pre-compute status for all records once
    const recordsWithStatus = allRecords.map((ab: any) => ({
      ...ab,
      ...calcAntibiotikStatus(
        ab.tanggal_mulai,
        ab.tanggal_selesai,
        ab.antibiotik.is_restriksi,
        ab.antibiotik.durasi_maks_hari,
        ab.efek_samping
      ),
    }))

    // ── Tren Bulanan ─────────────────────────────────────────────────────────
    const trendBulanan = Array.from({ length: 12 }, (_, i) => {
      const m = i + 1
      return {
        bulan: new Date(tahun, i, 1).toLocaleString("id-ID", { month: "short" }),
        jumlah: allRecords.filter((ab: any) => {
          const d = new Date(ab.tanggal_mulai)
          return d.getFullYear() === tahun && d.getMonth() + 1 === m
        }).length,
      }
    })

    // ── Top 10 Antibiotik ────────────────────────────────────────────────────
    const abCount: Record<string, number> = {}
    allRecords.forEach((ab: any) => {
      const nama = ab.antibiotik.nama
      abCount[nama] = (abCount[nama] || 0) + 1
    })
    const top10Antibiotik = Object.entries(abCount)
      .map(([nama, jumlah]) => ({ nama, jumlah }))
      .sort((a, b) => b.jumlah - a.jumlah)
      .slice(0, 10)

    // ── Status Distribution (Pie) ────────────────────────────────────────────
    const sc = { AKTIF: 0, SELESAI: 0, OVERDUE: 0, AKAN_SELESAI: 0, PERLU_REVIEW: 0 }
    recordsWithStatus.forEach((r: any) => {
      if (r.status in sc) sc[r.status as keyof typeof sc]++
    })
    const statusTerapi = [
      { name: "Aktif",        value: sc.AKTIF,        color: "#22c55e" },
      { name: "Selesai",      value: sc.SELESAI,      color: "#64748b" },
      { name: "Overdue",      value: sc.OVERDUE,      color: "#ef4444" },
      { name: "Akan Selesai", value: sc.AKAN_SELESAI, color: "#f59e0b" },
      { name: "Perlu Review", value: sc.PERLU_REVIEW, color: "#a855f7" },
    ]

    // ── Distribusi per Ruangan ───────────────────────────────────────────────
    const ruanganCount: Record<string, number> = {}
    allRecords.forEach((ab: any) => {
      const nama = ab.rawat_inap?.ruangan?.nama || "Tidak Diketahui"
      ruanganCount[nama] = (ruanganCount[nama] || 0) + 1
    })
    const distribusiRuangan = Object.entries(ruanganCount)
      .map(([ruangan, jumlah]) => ({ ruangan, jumlah }))
      .sort((a, b) => b.jumlah - a.jumlah)

    // ── Executive Summary (current month) ───────────────────────────────────
    const now = new Date()
    const bulanIni = now.getMonth() + 1
    const tahunIni = now.getFullYear()

    const executiveSummary = {
      totalBulanIni: allRecords.filter((ab: any) => {
        const d = new Date(ab.tanggal_mulai)
        return d.getMonth() + 1 === bulanIni && d.getFullYear() === tahunIni
      }).length,
      totalRestriksi: allRecords.filter((ab: any) => ab.antibiotik.is_restriksi).length,
      totalPerluReview: recordsWithStatus.filter(
        (r: any) => r.status === "PERLU_REVIEW" || r.status === "OVERDUE"
      ).length,
      totalOverdue: recordsWithStatus.filter((r: any) => r.status === "OVERDUE").length,
      totalReviewSelesai: allRecords.filter((ab: any) => ab.tanggal_review !== null).length,
    }

    return NextResponse.json({
      trendBulanan,
      top10Antibiotik,
      statusTerapi,
      distribusiRuangan,
      executiveSummary,
    })
  } catch (error: any) {
    console.error("Analytics error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
