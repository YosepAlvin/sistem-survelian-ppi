import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { countAntibiotikStatuses } from "@/lib/antibiotik-status"

export async function GET() {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json({
        success: true,
        data: {
          pendingVerifikasi: 0,
          pasienAktif: 0,
          deviceDay: 0,
          kasusAktifHariIni: 0,
          kasusDitutupHariIni: 0,
          deviceAlertHariIni: 0,
          pendingNotifications: 0,
        },
      })
    }

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    const counts = await db.$transaction([
      db.kejadianInfeksi.count({
        where: {
          status_verifikasi: "PENDING",
          status: { not: "SELESAI" },
        }
      }),
      db.rawatInap.count({
        where: { status: "AKTIF" }
      }),
      db.alatTerpasang.count({
        where: { masih_terpasang: true }
      }),
      db.surveilansIdo.count({
        where: { status_verifikasi: "PENDING" }
      }),
      // Kasus Aktif: semua kejadian dengan status AKTIF (tidak hanya hari ini)
      db.kejadianInfeksi.count({
        where: {
          status: "AKTIF",
        },
      }),
      // Kasus Ditutup: semua kejadian dengan status SELESAI (tidak hanya hari ini)
      db.kejadianInfeksi.count({
        where: {
          status: "SELESAI",
        },
      }),
      db.kejadianInfeksi.count({
        where: { status: "PENDING_CLOSURE" }
      }),
    ])

    const deviceAlertsAll = await db.notification.count({
      where: {
        type: "DEVICE_ALERT",
      },
    })

    const pendingNotifications = await db.notification.count({
      where: {
        isRead: false,
        OR: [
          { recipientId: null },
          { recipientId: Number((session.user as any)?.id) },
        ],
      },
    })

    const deviceDaysSum = await db.alatTerpasang.aggregate({
      _sum: {
        device_day: true,
      },
    })

    const allAntibiotics = await db.penggunaanAntibiotik.findMany({
      include: { antibiotik: true },
    })

    const abCounts = countAntibiotikStatuses(allAntibiotics)
    const antibioticStats = {
      aktif: abCounts.AKTIF,
      akan_selesai: abCounts.AKAN_SELESAI,
      overdue: abCounts.OVERDUE,
      perlu_review: abCounts.perlu_review_total,
      selesai: abCounts.SELESAI,
    }

    return NextResponse.json({
      success: true,
      data: {
        pendingVerifikasi: counts[0] + counts[3],
        pasienAktif: counts[1],
        deviceDay: deviceDaysSum._sum.device_day || 0,
        kasusAktifHariIni: counts[4],
        kasusDitutupHariIni: counts[5],
        deviceAlertHariIni: deviceAlertsAll,
        pendingNotifications,
        pendingClosure: counts[6],
        antibiotics: antibioticStats,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
