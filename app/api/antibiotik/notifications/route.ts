import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

/**
 * POST /api/antibiotik/notifications
 * Generate notifikasi otomatis untuk antibiotik:
 * - OVERDUE: terapi melewati tanggal selesai
 * - AKAN_SELESAI: terapi selesai dalam ≤2 hari
 * - PERLU_REVIEW: antibiotik restriksi / durasi melebihi batas / efek samping
 *
 * Cron job atau trigger manual bisa memanggil endpoint ini.
 * Notifikasi tidak akan duplikat (skip jika sudah ada yang belum dibaca).
 */
export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const role = (session.user as any).role
    if (role !== "IPCN" && role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Ambil semua terapi yang belum selesai
    const activeRecords = await db.penggunaanAntibiotik.findMany({
      where: { tanggal_selesai: null },
      include: {
        antibiotik: true,
        rawat_inap: {
          include: { pasien: true, ruangan: true },
        },
      },
    })

    let created = 0
    let skipped = 0

    for (const ab of activeRecords) {
      const startDate = new Date(ab.tanggal_mulai)
      startDate.setHours(0, 0, 0, 0)
      const hariKe = Math.max(
        1,
        1 + Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      )
      const durasiMaks = (ab.antibiotik as any).durasi_maks_hari || 7
      const pasienNama = ab.rawat_inap.pasien.nama
      const abNama = (ab.antibiotik as any).nama

      const notifTypes: { type: string; category: string; title: string; message: string }[] = []

      // 1. OVERDUE: hariKe > durasiMaks dan tidak ada tanggal selesai
      if (hariKe > durasiMaks) {
        notifTypes.push({
          type: "ANTIBIOTIK_OVERDUE",
          category: "antibiotik",
          title: `⚠️ Antibiotik Overdue`,
          message: `${abNama} pasien ${pasienNama} telah melewati batas durasi (hari ke-${hariKe}, maks ${durasiMaks} hari).`,
        })
      }

      // 2. AKAN_SELESAI: tanggal_selesai ada dan ≤2 hari lagi
      if ((ab as any).tanggal_selesai) {
        const selesaiDate = new Date((ab as any).tanggal_selesai)
        selesaiDate.setHours(0, 0, 0, 0)
        const daysTo = Math.ceil((selesaiDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        if (daysTo >= 0 && daysTo <= 2) {
          notifTypes.push({
            type: "ANTIBIOTIK_AKAN_SELESAI",
            category: "antibiotik",
            title: `⏳ Antibiotik Akan Selesai`,
            message: `${abNama} pasien ${pasienNama} akan selesai ${daysTo === 0 ? "hari ini" : daysTo === 1 ? "besok" : "dalam 2 hari"}.`,
          })
        }
      }

      // 3. PERLU_REVIEW: restriksi atau efek samping
      if ((ab.antibiotik as any).is_restriksi || ab.efek_samping) {
        notifTypes.push({
          type: "ANTIBIOTIK_PERLU_REVIEW",
          category: "antibiotik",
          title: `🔍 Perlu Review IPCN`,
          message: `${abNama} pasien ${pasienNama} memerlukan review IPCN${(ab.antibiotik as any).is_restriksi ? " (antibiotik restriksi)" : ""}${ab.efek_samping ? ` (efek samping: ${ab.efek_samping})` : ""}.`,
        })
      }

      for (const notif of notifTypes) {
        // Cek duplikat: sudah ada notif yang sama untuk entitas ini yang belum dibaca
        const existing = await db.notification.findFirst({
          where: {
            type: notif.type,
            relatedEntityType: "PenggunaanAntibiotik",
            relatedEntityId: ab.id,
            isRead: false,
          },
        })

        if (existing) {
          skipped++
          continue
        }

        await db.notification.create({
          data: {
            type: notif.type,
            category: notif.category,
            title: notif.title,
            message: notif.message,
            relatedEntityType: "PenggunaanAntibiotik",
            relatedEntityId: ab.id,
            pasienId: ab.rawat_inap.pasien.id,
            createdBy: Number((session.user as any).id),
            isRead: false,
          },
        })
        created++
      }
    }

    return NextResponse.json({
      success: true,
      message: `Notifikasi dibuat: ${created}, dilewati (duplikat): ${skipped}`,
      created,
      skipped,
    })
  } catch (error: any) {
    console.error("Error generate antibiotik notifications:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * GET /api/antibiotik/notifications
 * Ambil notifikasi antibiotik yang belum dibaca untuk badge & notification center
 */
export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const notifications = await db.notification.findMany({
      where: {
        category: "antibiotik",
        isRead: false,
        OR: [
          { recipientId: null },
          { recipientId: Number((session.user as any).id) },
        ],
      },
      include: {
        pasien: { select: { nama: true, no_rm: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    })

    const data = notifications.map((n: any) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      isRead: n.isRead,
      createdAt: n.createdAt?.toISOString(),
      relatedEntityId: n.relatedEntityId,
      pasien: n.pasien ? { nama: n.pasien.nama, no_rm: n.pasien.no_rm } : null,
    }))

    return NextResponse.json({ success: true, data, unreadCount: data.length })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
