import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const alatKesehatan = await db.deviceThresholdConfig.findMany({
      where: { isActive: true },
      orderBy: { jenisAlat: 'asc' }
    })

    return NextResponse.json(alatKesehatan)
  } catch (error: any) {
    console.error("Error fetching alat kesehatan:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
