import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import {
  hitungPhlebitisRate,
  hitungCautiRate,
  hitungVapRate,
} from "@/lib/calculations"

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const bulan = parseInt(searchParams.get("bulan") || (new Date().getMonth() + 1).toString())
    const tahun = parseInt(searchParams.get("tahun") || new Date().getFullYear().toString())

    const startDate = new Date(tahun, bulan - 1, 1)
    const endDate = new Date(tahun, bulan, 0, 23, 59, 59)

    const ruanganList = await (db as any).ruangan.findMany({
      include: {
        rawat_inaps: {
          where: {
            tanggal_masuk: { lte: endDate },
            OR: [
              { tanggal_keluar: null },
              { tanggal_keluar: { gte: startDate } }
            ]
          },
          include: {
            alat_terpasang: true,
            kejadian_infeksi: {
              where: {
                tanggal_kejadian: {
                  gte: startDate,
                  lte: endDate
                }
              }
            }
          }
        }
      }
    })

    const report = ruanganList.map((ruangan: any) => {
      const allAlat = (ruangan.rawat_inaps || []).flatMap((r: any) => r.alat_terpasang || [])
      const allEvents = (ruangan.rawat_inaps || []).flatMap((r: any) => r.kejadian_infeksi || [])
      const allInfeksi = allEvents.filter((event: any) => {
        const verificationStatus = String(event?.status_verifikasi || "PENDING").toUpperCase()
        const eventStatus = String(event?.status || "AKTIF").toUpperCase()
        const isClosed = eventStatus === "SELESAI" || Boolean(event?.tanggal_selesai)
        return verificationStatus === "VERIFIED" || verificationStatus === "PENDING" || verificationStatus === "REJECTED" || isClosed
      })
      const activeEvents = allEvents.filter((event: any) => {
        const eventStatus = String(event?.status || "AKTIF").toUpperCase()
        return eventStatus !== "SELESAI" && !event?.tanggal_selesai
      }).length
      const closedEvents = allEvents.filter((event: any) => {
        const eventStatus = String(event?.status || "AKTIF").toUpperCase()
        return eventStatus === "SELESAI" || Boolean(event?.tanggal_selesai)
      }).length

      const infusDay = allAlat.filter((a: any) => (a.jenis_alat || "").includes("Vena") || a.jenis_alat === "IVL").reduce((sum: number, a: any) => sum + Number(a.device_day || 0), 0)
      const kateterDay = allAlat.filter((a: any) => (a.jenis_alat || "").includes("kateter")).reduce((sum: number, a: any) => sum + Number(a.device_day || 0), 0)
      const ventilatorDay = allAlat.filter((a: any) => a.jenis_alat === "Ventilator" || a.jenis_alat === "Ventilasi").reduce((sum: number, a: any) => sum + Number(a.device_day || 0), 0)
      const ettDay = allAlat.filter((a: any) => (a.jenis_alat || "").includes("Endotracheal") || (a.jenis_alat || "").includes("ETT")).reduce((sum: number, a: any) => sum + Number(a.device_day || 0), 0)
      const trakeostomiDay = allAlat.filter((a: any) => (a.jenis_alat || "").includes("Trakeostomi")).reduce((sum: number, a: any) => sum + Number(a.device_day || 0), 0)
      const ngtDay = allAlat.filter((a: any) => (a.jenis_alat || "").includes("Nasogastric") || (a.jenis_alat || "").includes("NGT")).reduce((sum: number, a: any) => sum + Number(a.device_day || 0), 0)
      const drainOperasiDay = allAlat.filter((a: any) => (a.jenis_alat || "").includes("Drain operasi")).reduce((sum: number, a: any) => sum + Number(a.device_day || 0), 0)
      const chestTubeDay = allAlat.filter((a: any) => (a.jenis_alat || "").includes("Chest tube") || (a.jenis_alat || "").includes("WSD")).reduce((sum: number, a: any) => sum + Number(a.device_day || 0), 0)
      const totalHariRawat = Math.max(1, (ruangan.rawat_inaps || []).length * 3)

      const phlebitisCount = allInfeksi.filter((i: any) => i.jenis_infeksi === "PLEBITIS").length
      const iskCount = allInfeksi.filter((i: any) => i.jenis_infeksi === "ISK").length
      const vapCount = allInfeksi.filter((i: any) => i.jenis_infeksi === "VAP").length
      const iadpCount = allInfeksi.filter((i: any) => i.jenis_infeksi === "IADP").length
      const totalInfeksi = phlebitisCount + iskCount + vapCount + iadpCount

      return {
        ruangan: ruangan.nama || ruangan.namaRuangan,
        pasien: (ruangan.rawat_inaps || []).length,
        infus_day: infusDay,
        kateter_day: kateterDay,
        ventilator_day: ventilatorDay,
        ett_day: ettDay,
        trakeostomi_day: trakeostomiDay,
        ngt_day: ngtDay,
        drain_operasi_day: drainOperasiDay,
        chest_tube_day: chestTubeDay,
        total_infeksi: totalInfeksi,
        active_events: activeEvents,
        closed_events: closedEvents,
        infeksi: {
          phlebitis: phlebitisCount,
          isk: iskCount,
          vap: vapCount,
          iadp: iadpCount,
        },
        rates: {
          phlebitis: hitungPhlebitisRate(phlebitisCount, totalHariRawat),
          cauti: hitungCautiRate(iskCount, kateterDay),
          vap: hitungVapRate(vapCount, ventilatorDay),
        }
      }
    })

    return NextResponse.json({ success: true, data: report })
  } catch (error: any) {
    console.error("Report API Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
