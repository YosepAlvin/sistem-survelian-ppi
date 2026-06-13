import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { buildAuditTrailEntry, formatAuditValue } from "@/lib/audit-trail"

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const unreadOnly = searchParams.get("unread") === "1"

    let notifications = await db.notification.findMany({
      where: {
        OR: [
          { recipientId: null },
          { recipientId: Number((session.user as any)?.id) },
        ],
        ...(unreadOnly ? { isRead: false } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        creator: { select: { name: true } },
        pasien: { 
          select: { 
            nama: true, 
            no_rm: true,
            rawat_inaps: { 
              where: { 
                status: { not: "PULANG" } 
              }, 
              take: 1,
              select: { 
                status: true 
              } 
            } 
          } 
        },
      },
    })

    // Filter device alerts: only keep those where patient has active rawat_inap
    notifications = notifications.filter(item => {
      if (item.type !== "DEVICE_ALERT") return true
      if (!item.pasien?.rawat_inaps || item.pasien.rawat_inaps.length === 0) return false
      return true
    })

    const data = notifications.map((item: any) => {
      let payload = null;
      try {
        payload = item.payload ? JSON.parse(item.payload) : null;
      } catch (e) {
        console.error("Failed to parse notification payload", e);
      }

      return {
        id: item.id,
        type: item.type,
        category: item.category,
        title: item.title,
        message: item.message,
        payload,
        relatedEntityType: item.relatedEntityType,
        relatedEntityId: item.relatedEntityId,
        isRead: item.isRead,
        readAt: item.readAt?.toISOString() ?? null,
        createdAt: item.createdAt?.toISOString() ?? null,
        createdBy: item.creator?.name ?? null,
        pasien: item.pasien ? {
          nama: item.pasien.nama,
          no_rm: item.pasien.no_rm
        } : null,
      };
    })

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { id, isRead } = await req.json()
    const updated = await db.notification.update({
      where: { id: Number(id) },
      data: {
        isRead: Boolean(isRead),
        readAt: Boolean(isRead) ? new Date() : null,
      },
    })

    const entry = buildAuditTrailEntry({
      action: 'NOTIFICATION_READ',
      moduleName: 'notifications',
      userId: parseInt((session.user as any).id),
      userName: (session.user as any).name || 'User',
      entityType: 'Notification',
      entityId: updated.id,
      field: 'isRead',
      previousValue: !Boolean(isRead),
      newValue: Boolean(isRead),
      ipAddress: null,
      timestamp: new Date(),
    })

    await db.auditTrail.create({ 
      data: { 
        ...entry, 
        timestamp: entry.timestamp 
      } 
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
