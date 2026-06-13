import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

const DEFAULT_THRESHOLDS: Record<string, number> = {
  "Urine Kateter": 7,
  Ventilator: 14,
  CVC: 14,
  ETT: 14,
  NGT: 30,
  "Endotracheal Tube (ETT)": 14,
  Trakeostomi: 21,
  "Nasogastric Tube (NGT)": 30,
  "Drain operasi": 14,
  "Chest tube (WSD)": 14,
}

export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const existing = await db.deviceThresholdConfig.findMany({ orderBy: { jenisAlat: "asc" } })
    if (existing.length === 0) {
      const created = await db.$transaction(
        Object.entries(DEFAULT_THRESHOLDS).map(([jenisAlat, hariThreshold]) =>
          db.deviceThresholdConfig.create({ data: { jenisAlat, hariThreshold } })
        )
      )
      return NextResponse.json({ success: true, data: created })
    }

    return NextResponse.json({ success: true, data: existing })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { jenisAlat, hariThreshold } = await req.json()
    const updated = await db.deviceThresholdConfig.upsert({
      where: { jenisAlat },
      update: { hariThreshold: Number(hariThreshold) },
      create: { jenisAlat, hariThreshold: Number(hariThreshold) },
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
