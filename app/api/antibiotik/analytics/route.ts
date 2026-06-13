import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const tahun = searchParams.get("tahun") || String(new Date().getFullYear())

    const role = (session.user as any).role
    const ruanganId = (session.user as any).ruanganId

    const whereBase: any =
      role === "IPCLN" && ruanganId
        ? { rawat_inap: { ruangan_id: parseInt(ruanganId) } }
        : {}

    // Ambil semua data dengan relasi
    const allRecords = await db.penggunaanAntibiotik.findMany({
      where: whereBase,
      include: {
        antibiotik: true,
        rawat_inap: {
          include: {
            pasien: true,
            ruangan: true,
          },
        },
      },
    })

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Hitung status tiap record
    const recordsWithStatus = allRecords.map((ab: any) => {
      const startDate = new Date(ab.tanggal_mulai)
      startDate.setHours(0, 0, 0, 0)
      let hariKe = 1 + Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      hariKe = Math.max(1, hariKe)

      let status = "AKTIF"
      let alasanReview: string[] = []

      if (ab.tanggal_selesai) {
        status = "SELESAI"
      } else {
        if (ab.antibiotik.is_restriksi) alasanReview.push("Antibiotik Restriksi")
        const durasiMaks = ab.antibiotik.durasi_maks_hari || 7
        if (hariKe > durasiMaks) alasanReview.push(`Durasi > ${durasiMaks} hari`)
        if (ab.efek_samping) alasanReview.push("Efek Samping")

        // Jika ada tanggal selesai yang sudah lewat → overdue
        if (ab.tanggal_selesai) {
          const selesaiDate = new Date(ab.tanggal_selesai)
          selesaiDate.setHours(0, 0, 0, 0)
          const daysTo = Math.ceil((selesaiDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
          if (daysTo < 0) {
            status = "OVERDUE"
            alasanReview.push("Overdue")
          } else if (daysTo <= 2) {
            status = "AKAN_SELESAI"
          }
        }

        if (alasanReview.length > 0 && status !== "OVERDUE") {
          status = "PERLU_REVIEW"
        }
      }

      return { ...ab, status, alasanReview }
    })

    // ─── Tren Bulanan (per bulan dalam tahun dipilih) ───
    const trendBulanan: { bulan: string; jumlah: number }[] = []
    for (let m = 1; m <= 12; m++) {
      const count = allRecords.filter((ab: any) => {
        const tgl = new Date(ab.tanggal_mulai)
        return tgl.getFullYear() === parseInt(tahun) && tgl.getMonth() + 1 === m
      }).length
      trendBulanan.push({
        bulan: new Date(parseInt(tahun), m - 1, 1).toLocaleString("id-ID", { month: "short" }),
        jumlah: count,
      })
    }

    // ─── Top 10 Antibiotik ───
    const abCount: Record<string, number> = {}
    allRecords.forEach((ab: any) => {
      const nama = ab.antibiotik.nama
      abCount[nama] = (abCount[nama] || 0) + 1
    })
    const top10Antibiotik = Object.entries(abCount)
      .map(([nama, jumlah]) => ({ nama, jumlah }))
      .sort((a, b) => b.jumlah - a.jumlah)
      .slice(0, 10)

    // ─── Status Terapi (Pie Chart) ───
    const statusCount = {
      AKTIF: recordsWithStatus.filter((r: any) => r.status === "AKTIF").length,
      SELESAI: recordsWithStatus.filter((r: any) => r.status === "SELESAI").length,
      OVERDUE: recordsWithStatus.filter((r: any) => r.status === "OVERDUE").length,
      AKAN_SELESAI: recordsWithStatus.filter((r: any) => r.status === "AKAN_SELESAI").length,
      PERLU_REVIEW: recordsWithStatus.filter(
        (r: any) => r.status === "PERLU_REVIEW" || r.status === "OVERDUE"
      ).length,
    }
    const statusTerapi = [
      { name: "Aktif", value: statusCount.AKTIF, color: "#22c55e" },
      { name: "Selesai", value: statusCount.SELESAI, color: "#64748b" },
      { name: "Overdue", value: statusCount.OVERDUE, color: "#ef4444" },
      { name: "Akan Selesai", value: statusCount.AKAN_SELESAI, color: "#f59e0b" },
      { name: "Perlu Review", value: statusCount.PERLU_REVIEW, color: "#a855f7" },
    ]

    // ─── Distribusi per Ruangan ───
    const ruanganCount: Record<string, number> = {}
    allRecords.forEach((ab: any) => {
      const nama = ab.rawat_inap?.ruangan?.nama || "Tidak Diketahui"
      ruanganCount[nama] = (ruanganCount[nama] || 0) + 1
    })
    const distribusiRuangan = Object.entries(ruanganCount)
      .map(([ruangan, jumlah]) => ({ ruangan, jumlah }))
      .sort((a, b) => b.jumlah - a.jumlah)

    // ─── Executive Summary (bulan ini) ───
    const now = new Date()
    const bulanIni = now.getMonth() + 1
    const tahunIni = now.getFullYear()
    const recordsBulanIni = allRecords.filter((ab: any) => {
      const tgl = new Date(ab.tanggal_mulai)
      return tgl.getMonth() + 1 === bulanIni && tgl.getFullYear() === tahunIni
    })

    const executiveSummary = {
      totalBulanIni: recordsBulanIni.length,
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
    console.error("Error analytics antibiotik:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
