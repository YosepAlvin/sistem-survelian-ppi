import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { calcAntibiotikStatus, statusLabel } from "@/lib/antibiotik-status"

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const month = searchParams.get("month")
    const year = searchParams.get("year")
    const ruangan = searchParams.get("ruangan")
    const antibiotikFilter = searchParams.get("antibiotik")

    // Build base query — filter by ruangan if provided
    const where: any = {}
    if (ruangan) {
      where.rawat_inap = { ruangan: { nama: ruangan } }
    }

    const allRecords = await db.penggunaanAntibiotik.findMany({
      where,
      include: {
        antibiotik: true,
        rawat_inap: {
          include: { pasien: true, ruangan: true, diagnosa: true },
        },
      },
      orderBy: { tanggal_mulai: "desc" },
    })

    // Filter by month / year on tanggal_mulai
    const byMonth = allRecords.filter((ab: any) => {
      if (!month || !year) return true
      const d = new Date(ab.tanggal_mulai)
      return d.getMonth() + 1 === parseInt(month) && d.getFullYear() === parseInt(year)
    })

    // Filter by antibiotic name
    const finalRecords = byMonth.filter((ab: any) =>
      antibiotikFilter ? ab.antibiotik.nama === antibiotikFilter : true
    )

    // ── Sheet 1: Detail Penggunaan Antibiotik ──────────────────────────────
    const sheet1Headers = [
      "Tanggal Input",
      "No RM",
      "Nama Pasien",
      "Ruangan",
      "Diagnosa",
      "Antibiotik",
      "Dosis",
      "Tanggal Mulai",
      "Tanggal Selesai",
      "Hari Ke",
      "Status",
    ]

    const sheet1Data = finalRecords.map((ab: any) => {
      const { status, hari_ke } = calcAntibiotikStatus(
        ab.tanggal_mulai,
        ab.tanggal_selesai,
        ab.antibiotik.is_restriksi,
        ab.antibiotik.durasi_maks_hari,
        ab.efek_samping
      )
      return [
        new Date(ab.tanggal_mulai).toISOString().split("T")[0], // Tanggal Input = tanggal_mulai
        ab.rawat_inap.pasien.no_rm,
        ab.rawat_inap.pasien.nama,
        ab.rawat_inap.ruangan?.nama || "-",
        ab.rawat_inap.diagnosa?.nama || "-",
        ab.antibiotik.nama,
        ab.dosis || "-",
        new Date(ab.tanggal_mulai).toISOString().split("T")[0],
        ab.tanggal_selesai ? new Date(ab.tanggal_selesai).toISOString().split("T")[0] : "-",
        hari_ke,
        statusLabel(status),
      ]
    })

    // ── Sheet 2: Ringkasan per Antibiotik ─────────────────────────────────
    const sheet2Headers = [
      "Nama Antibiotik",
      "Jumlah Pasien",
      "Total Hari Penggunaan",
      "Jumlah Kasus Review",
    ]

    const groups: Record<string, { count: number; totalDays: number; reviewCases: number }> = {}

    finalRecords.forEach((ab: any) => {
      const name = ab.antibiotik.nama
      if (!groups[name]) groups[name] = { count: 0, totalDays: 0, reviewCases: 0 }

      groups[name].count++

      const startDate = new Date(ab.tanggal_mulai)
      const endDate = ab.tanggal_selesai ? new Date(ab.tanggal_selesai) : new Date()
      const days = Math.max(
        1,
        Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      )
      groups[name].totalDays += days

      const { status } = calcAntibiotikStatus(
        ab.tanggal_mulai,
        ab.tanggal_selesai,
        ab.antibiotik.is_restriksi,
        ab.antibiotik.durasi_maks_hari,
        ab.efek_samping
      )
      if (status === "PERLU_REVIEW" || status === "OVERDUE") groups[name].reviewCases++
    })

    const sheet2Data = Object.entries(groups).map(([nama, g]) => [
      nama,
      g.count,
      g.totalDays,
      g.reviewCases,
    ])

    // ── Sheet 3: Monitoring IPCN — status counts ───────────────────────────
    const sheet3Headers = ["Status", "Jumlah"]
    const statusCounts = { AKTIF: 0, AKAN_SELESAI: 0, OVERDUE: 0, PERLU_REVIEW: 0, SELESAI: 0 }

    finalRecords.forEach((ab: any) => {
      const { status } = calcAntibiotikStatus(
        ab.tanggal_mulai,
        ab.tanggal_selesai,
        ab.antibiotik.is_restriksi,
        ab.antibiotik.durasi_maks_hari,
        ab.efek_samping
      )
      if (status in statusCounts) statusCounts[status as keyof typeof statusCounts]++
    })

    const sheet3Data = [
      ["Terapi Aktif", statusCounts.AKTIF],
      ["Akan Selesai", statusCounts.AKAN_SELESAI],
      ["Overdue", statusCounts.OVERDUE],
      ["Perlu Review IPCN", statusCounts.PERLU_REVIEW],
      ["Selesai", statusCounts.SELESAI],
    ]

    // ── Sheet 4: Review IPCN — records that need or had review ────────────
    const sheet4Headers = [
      "Nama Pasien",
      "Antibiotik",
      "Alasan Review",
      "Catatan IPCN",
      "Rekomendasi IPCN",
      "Tanggal Review",
    ]

    const sheet4Data = finalRecords
      .filter((ab: any) => {
        const { status } = calcAntibiotikStatus(
          ab.tanggal_mulai,
          ab.tanggal_selesai,
          ab.antibiotik.is_restriksi,
          ab.antibiotik.durasi_maks_hari,
          ab.efek_samping
        )
        // Include records that need/needed review, OR already have review notes
        return (
          status === "PERLU_REVIEW" ||
          status === "OVERDUE" ||
          ab.catatan_ipcn ||
          ab.tanggal_review
        )
      })
      .map((ab: any) => {
        const { alasan_review } = calcAntibiotikStatus(
          ab.tanggal_mulai,
          ab.tanggal_selesai,
          ab.antibiotik.is_restriksi,
          ab.antibiotik.durasi_maks_hari,
          ab.efek_samping
        )
        return [
          ab.rawat_inap.pasien.nama,
          ab.antibiotik.nama,
          alasan_review.join(", ") || "-",
          ab.catatan_ipcn || "-",
          ab.rekomendasi_ipcn || "-",
          ab.tanggal_review
            ? new Date(ab.tanggal_review).toISOString().split("T")[0]
            : "-",
        ]
      })

    return NextResponse.json({
      sheet1: { headers: sheet1Headers, data: sheet1Data },
      sheet2: { headers: sheet2Headers, data: sheet2Data },
      sheet3: { headers: sheet3Headers, data: sheet3Data },
      sheet4: { headers: sheet4Headers, data: sheet4Data },
    })
  } catch (error: any) {
    console.error("Export error:", error)
    return NextResponse.json({ error: "Failed to export" }, { status: 500 })
  }
}
