import { db } from "@/lib/db"
import { countAntibiotikStatuses } from "@/lib/antibiotik-status"

export interface SystemStats {
  totalPasien: number
  totalSurveilansAktif: number
  totalKasusInfeksiTerverifikasi: number
  totalAntibiotikAktif: number
  totalDeviceDayBulanIni: number
  totalNotifikasiAktif: number
  totalLaporanBulanan: number
}

export async function getSystemStats(): Promise<SystemStats> {
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  const startOfMonth = new Date(currentYear, currentMonth, 1)
  const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999)

  const [
    totalPasien,
    totalSurveilansAktif,
    totalKasusInfeksiTerverifikasi,
    allAntibiotics,
    alatTerpasangList,
    totalNotifikasiAktif,
  ] = await db.$transaction([
    // Total active patients
    db.rawatInap.count({
      where: { status: "AKTIF" },
    }),
    // Total active surveillance (count submitted this month)
    db.surveilansHarian.count({
      where: {
        tanggal: {
          gte: startOfMonth,
        },
      },
    }),
    // Total verified infection cases
    db.kejadianInfeksi.count({
      where: { status_verifikasi: "VERIFIED" },
    }),
    // All antibiotics for active count
    db.penggunaanAntibiotik.findMany({
      include: { antibiotik: true },
    }),
    // Get all alatTerpasang with deviceDay for this month
    db.alatTerpasang.findMany({
      where: {
        OR: [
          { tanggal_pasang: { lte: endOfMonth } },
          { tanggal_lepas: { gte: startOfMonth } },
        ],
      },
    }),
    // Total active unread notifications
    db.notification.count({
      where: { isRead: false },
    }),
  ])

  // Calculate total device days this month
  let totalDeviceDayBulanIni = 0
  for (const alat of alatTerpasangList) {
    if (alat.device_day) {
      totalDeviceDayBulanIni += alat.device_day
    }
  }

  // Get total laporan bulanan (in separate query to avoid type issues)
  let totalLaporanBulanan = 0
  try {
    totalLaporanBulanan = await db.surveilansBulanan.count({
      where: {
        bulan: currentMonth + 1,
        tahun: currentYear,
      },
    })
  } catch {
    totalLaporanBulanan = 0
  }

  const abCounts = countAntibiotikStatuses(allAntibiotics)
  const totalAntibiotikAktif =
    abCounts.AKTIF +
    abCounts.AKAN_SELESAI +
    abCounts.OVERDUE +
    abCounts.PERLU_REVIEW +
    abCounts.SUDAH_DIREVIEW

  return {
    totalPasien,
    totalSurveilansAktif,
    totalKasusInfeksiTerverifikasi,
    totalAntibiotikAktif,
    totalDeviceDayBulanIni,
    totalNotifikasiAktif,
    totalLaporanBulanan,
  }
}
