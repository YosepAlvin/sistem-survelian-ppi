import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

/**
 * GET /api/antibiotik/audit?id={penggunaanAntibiotikId}
 * Returns audit trail entries for a single PenggunaanAntibiotik record,
 * sorted newest-first.
 */
export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 })
    }

    const entries = await db.auditTrail.findMany({
      where: {
        entityType: "PenggunaanAntibiotik",
        entityId: parseInt(id),
      },
      include: {
        user: { select: { id: true, name: true } },
      },
      orderBy: { timestamp: "desc" },
    })

    const data = entries.map((e: any) => ({
      id: e.id,
      action: e.action,
      moduleName: e.moduleName,
      field: e.field,
      previousValue: e.previousValue,
      newValue: e.newValue,
      userName: e.userName || e.user?.name || "Sistem",
      userId: e.userId,
      timestamp: e.timestamp?.toISOString(),
    }))

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
