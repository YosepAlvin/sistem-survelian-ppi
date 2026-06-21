import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { calcAntibiotikStatus } from "@/lib/antibiotik-status"

/**
 * POST /api/antibiotik/notifications
 * Generate antibiotic alert notifications using the canonical status logic.
 * Skips duplicates (existing unread notification for same entity + type).
 * Accessible by IPCN and ADMIN only.
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

    // Only process therapies that have no manual completion date
    // (tanggal_selesai = null means the therapy is still tracked)
    const activeRecords = await db.penggunaanAntibiotik.findMany({
      where: { tanggal_selesai_aktual: null },
      include: {
        antibiotik: true,
        rawat_inap: { include: { pasien: true, ruangan: true } },
      },
    })

    let created = 0
    let skipped = 0
    let deleted = 0

    for (const ab of activeRecords) {
      const { status } = calcAntibiotikStatus(
        ab.tanggal_mulai,
        ab.tanggal_rencana_selesai,
        ab.tanggal_selesai_aktual,
        (ab.antibiotik as any).is_restriksi,
        (ab.antibiotik as any).durasi_maks_hari,
        ab.efek_samping,
        (ab as any).tanggal_review
      )

      const pasienNama = ab.rawat_inap.pasien.nama
      const abNama = (ab.antibiotik as any).nama

      // Build candidate notifications based on canonical status
      const candidates: { type: string; title: string; message: string }[] = []

      if (status === "OVERDUE") {
        candidates.push({
          type: "ANTIBIOTIK_OVERDUE",
          title: "⚠️ Antibiotik Overdue",
          message: `${abNama} pasien ${pasienNama} telah melewati batas durasi terapi.`,
        })
      }

      if (status === "AKAN_SELESAI") {
        candidates.push({
          type: "ANTIBIOTIK_AKAN_SELESAI",
          title: "⏳ Antibiotik Akan Selesai",
          message: `${abNama} pasien ${pasienNama} mendekati batas durasi terapi.`,
        })
      }

      if (status === "PERLU_REVIEW") {
        candidates.push({
          type: "ANTIBIOTIK_PERLU_REVIEW",
          title: "🔍 Perlu Review IPCN",
          message: `${abNama} pasien ${pasienNama} memerlukan review IPCN.`,
        })
      }

      // First, delete any stale notifications for this record (types not in candidates)
      const deleteResult = await db.notification.deleteMany({
        where: {
          relatedEntityType: "PenggunaanAntibiotik",
          relatedEntityId: ab.id,
          type: { notIn: candidates.map(c => c.type) },
          isRead: false,
        },
      })
      deleted += deleteResult.count

      // Then, add new notifications if not already present
      for (const candidate of candidates) {
        // Deduplication: skip if unread notification of same type already exists for this record
        const existing = await db.notification.findFirst({
          where: {
            type: candidate.type,
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
            type: candidate.type,
            category: "antibiotik",
            title: candidate.title,
            message: candidate.message,
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
      message: `Notifikasi dibuat: ${created}, dilewati (duplikat): ${skipped}, dihapus (stale): ${deleted}`,
      created,
      skipped,
      deleted,
    })
  } catch (error: any) {
    console.error("Error generate antibiotik notifications:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * GET /api/antibiotik/notifications
 * Returns unread antibiotic notifications for the notification center.
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
      relatedEntityType: n.relatedEntityType,
      pasien: n.pasien ? { nama: n.pasien.nama, no_rm: n.pasien.no_rm } : null,
    }))

    return NextResponse.json({ success: true, data, unreadCount: data.length })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
