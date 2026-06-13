import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get query params
    const { searchParams } = new URL(req.url)
    const month = searchParams.get("month")
    const year = searchParams.get("year")
    const ruangan = searchParams.get("ruangan")
    const antibiotik = searchParams.get("antibiotik")

    // Build where clauses
    const where: any = {}
    if (ruangan) {
      where.rawat_inap = { ruangan: { nama: ruangan } }
    }

    // Get all antibiotic records
    const allRecords = await db.penggunaanAntibiotik.findMany({
      where,
      include: {
        antibiotik: true,
        rawat_inap: {
          include: {
            pasien: true,
            ruangan: true,
            diagnosa: true,
            dokter: true
          }
        }
      },
      orderBy: { tanggal_mulai: "desc" }
    })

    // Filter by month/year if provided
    const filteredRecords = allRecords.filter((ab: any) => {
      if (!month || !year) return true;
      const tglMulai = new Date(ab.tanggal_mulai)
      return tglMulai.getMonth() + 1 === parseInt(month) && tglMulai.getFullYear() === parseInt(year)
    })

    // Filter by antibiotic name if provided
    const finalRecords = filteredRecords.filter((ab: any) => {
      if (!antibiotik) return true
      return ab.antibiotik.nama === antibiotik
    })

    // --- Prepare Sheet1: Detail Penggunaan Antibiotik ---
    const sheet1Headers = ["Tanggal Input", "No RM", "Nama Pasien", "Ruangan", "Diagnosa", "Antibiotik", "Dosis", "Tanggal Mulai", "Tanggal Selesai", "Hari Ke", "Status"]
    const sheet1Data = finalRecords.map((ab: any) => {
      const today = new Date()
      today.setHours(0,0,0,0)
      const startDate = new Date(ab.tanggal_mulai)
      startDate.setHours(0,0,0,0)
      let hariKe = 1 + Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      hariKe = Math.max(1, hariKe)

      let status = 'AKTIF'
      if (ab.tanggal_selesai) {
        status = 'SELESAI'
      } else {
        if (ab.tanggal_selesai) {
          const selesaiDate = new Date(ab.tanggal_selesai)
          selesaiDate.setHours(0,0,0,0)
          const daysUntil = Math.ceil((selesaiDate.getTime() - today.getTime())/(1000*60*60*24))
          if (daysUntil < 0) status = 'OVERDUE'
          else if (daysUntil <=2) status = 'AKAN_SELESAI'
        }
      }

      return [
        new Date().toISOString().split('T')[0], // Tanggal Input (now for demo, but maybe use created_at?)
        ab.rawat_inap.pasien.no_rm,
        ab.rawat_inap.pasien.nama,
        ab.rawat_inap.ruangan?.nama || '-',
        ab.rawat_inap.diagnosa?.nama || '-',
        ab.antibiotik.nama,
        ab.dosis || '-',
        ab.tanggal_mulai.toISOString().split('T')[0],
        ab.tanggal_selesai ? ab.tanggal_selesai.toISOString().split('T')[0] : '-',
        hariKe,
        status
      ]
    })

    // --- Prepare Sheet2: Ringkasan Penggunaan Antibiotik ---
    const sheet2Headers = ["Nama Antibiotik", "Jumlah Pasien", "Total Hari Penggunaan", "Jumlah Kasus Review"]
    const antibioticGroups: Record<string, any> = {}
    finalRecords.forEach((ab: any) => {
      const name = ab.antibiotik.nama
      if (!antibioticGroups[name]) {
        antibioticGroups[name] = { count: 0, totalDays: 0, reviewCases:0 }
      }
      antibioticGroups[name].count++

      // Calculate total days for this record
      const startDate = new Date(ab.tanggal_mulai)
      const endDate = ab.tanggal_selesai ? new Date(ab.tanggal_selesai) : new Date()
      const days = Math.ceil((endDate.getTime() - startDate.getTime())/(1000*60*60*24))
      antibioticGroups[name].totalDays += Math.max(1, days)

      // Check if needs review
      const today = new Date()
      today.setHours(0,0,0,0)
      const hariKe = 1 + Math.floor((today.getTime() - startDate.getTime())/(1000*60*60*24))
      const durasiMaks = ab.antibiotik.durasi_maks_hari ||7
      let needsReview = false
      if (ab.antibiotik.is_restriksi) needsReview = true
      if (hariKe > durasiMaks) needsReview = true
      if (ab.efek_samping) needsReview = true
      if (!ab.tanggal_selesai) {
        const selesaiDate = ab.tanggal_selesai ? new Date(ab.tanggal_selesai) : null
        if (selesaiDate) {
          selesaiDate.setHours(0,0,0,0)
          if (selesaiDate < today) needsReview = true
        }
      }
      if (needsReview) antibioticGroups[name].reviewCases++
    })
    const sheet2Data = Object.entries(antibioticGroups).map(([name, data]: any) => {
      return [name, data.count, data.totalDays, data.reviewCases]
    })

    // --- Prepare Sheet3: Monitoring IPCN ---
    const sheet3Headers = ["Status", "Jumlah"]
    let aktifCount = 0, akanSelesaiCount=0, overdueCount=0, perluReviewCount=0, selesaiCount=0
    finalRecords.forEach((ab: any) => {
      const today = new Date()
      today.setHours(0,0,0,0)
      const startDate = new Date(ab.tanggal_mulai)
      startDate.setHours(0,0,0,0)
      
      if (ab.tanggal_selesai) {
        selesaiCount++
        return
      }

      let status = "AKTIF"
      let needsReview = false
      if (ab.antibiotik.is_restriksi) needsReview = true
      
      const hariKe = 1 + Math.floor((today.getTime() - startDate.getTime())/(1000*60*60*24))
      const durasiMaks = ab.antibiotik.durasi_maks_hari ||7
      if (hariKe > durasiMaks) needsReview = true
      
      if (ab.efek_samping) needsReview = true
      
      if (ab.tanggal_selesai) {
        const selesaiDate = new Date(ab.tanggal_selesai)
        selesaiDate.setHours(0,0,0,0)
        const daysUntil = Math.ceil((selesaiDate.getTime() - today.getTime())/(1000*60*60*24))
        if (daysUntil <0) {
          status = "OVERDUE"
          needsReview = true
        } else if (daysUntil <=2) status = "AKAN_SELESAI"
      }

      if (status === "AKTIF") aktifCount++
      else if (status === "AKAN_SELESAI") akanSelesaiCount++
      else if (status === "OVERDUE") overdueCount++
      
      if (needsReview) perluReviewCount++
    })
    const sheet3Data = [
      ["Terapi Aktif", aktifCount],
      ["Akan Selesai", akanSelesaiCount],
      ["Overdue", overdueCount],
      ["Perlu Review", perluReviewCount],
      ["Selesai", selesaiCount]
    ]

    // --- Prepare Sheet4: Review IPCN ---
    const sheet4Headers = ["Nama Pasien", "Antibiotik", "Alasan Review", "Catatan IPCN", "Rekomendasi IPCN", "Tanggal Review"]
    const reviewRecords = finalRecords.filter((ab: any) => {
      const today = new Date()
      today.setHours(0,0,0,0)
      const startDate = new Date(ab.tanggal_mulai)
      startDate.setHours(0,0,0,0)
      
      if (ab.tanggal_selesai) return false
      
      let needsReview = false
      if (ab.antibiotik.is_restriksi) needsReview = true
      
      const hariKe = 1 + Math.floor((today.getTime() - startDate.getTime())/(1000*60*60*24))
      const durasiMaks = ab.antibiotik.durasi_maks_hari ||7
      if (hariKe > durasiMaks) needsReview = true
      
      if (ab.efek_samping) needsReview = true
      
      if (ab.tanggal_selesai) {
        const selesaiDate = new Date(ab.tanggal_selesai)
        selesaiDate.setHours(0,0,0,0)
        if (selesaiDate < today) needsReview = true
      }
      
      return needsReview
    })
    const sheet4Data = reviewRecords.map((ab: any) => {
      const reasons: string[] = []
      if (ab.antibiotik.is_restriksi) reasons.push("Antibiotik Restriksi")
      const today = new Date()
      today.setHours(0,0,0,0)
      const startDate = new Date(ab.tanggal_mulai)
      startDate.setHours(0,0,0,0)
      const hariKe = 1 + Math.floor((today.getTime() - startDate.getTime())/(1000*60*60*24))
      const durasiMaks = ab.antibiotik.durasi_maks_hari ||7
      if (hariKe > durasiMaks) reasons.push(`Durasi > ${durasiMaks} hari`)
      if (ab.efek_samping) reasons.push("Efek Samping")
      if (ab.tanggal_selesai) {
        const selesaiDate = new Date(ab.tanggal_selesai)
        selesaiDate.setHours(0,0,0,0)
        if (selesaiDate < today) reasons.push("Overdue")
      }
      
      return [
        ab.rawat_inap.pasien.nama,
        ab.antibiotik.nama,
        reasons.join(", "),
        ab.catatan_ipcn || "-",
        ab.rekomendasi_ipcn || "-",
        ab.tanggal_review ? ab.tanggal_review.toISOString().split('T')[0] : "-"
      ]
    })

    return NextResponse.json({
      sheet1: { headers: sheet1Headers, data: sheet1Data },
      sheet2: { headers: sheet2Headers, data: sheet2Data },
      sheet3: { headers: sheet3Headers, data: sheet3Data },
      sheet4: { headers: sheet4Headers, data: sheet4Data }
    })
  } catch (error: any) {
    console.error(error)
    return NextResponse.json({ error: "Failed to export" }, { status: 500 })
  }
}
