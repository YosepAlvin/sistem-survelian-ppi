import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const auditTrails = await db.auditTrail.findMany({
      where: { userId: parseInt(session.user.id) },
      orderBy: { timestamp: "desc" },
      take: 20,
    })

    return NextResponse.json({ success: true, data: auditTrails })

  } catch (error) {
    console.error("Get audit trails error:", error)
    return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 })
  }
}
