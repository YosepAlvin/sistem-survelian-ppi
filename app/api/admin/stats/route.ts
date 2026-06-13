import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function GET() {
  try {
    const session = await auth()
    
    // If no session, return empty stats
    if (!session) {
      return NextResponse.json({
        users: 0,
        ruangan: 0,
        dokter: 0,
        diagnosa: 0,
      })
    }

    const counts = await db.$transaction([
      db.user.count(),
      db.ruangan.count(),
      db.dokter.count(),
      db.diagnosa.count(),
      db.deviceThresholdConfig.count(),
    ])

    return NextResponse.json({
      users: counts[0],
      ruangan: counts[1],
      dokter: counts[2],
      diagnosa: counts[3],
      alatKesehatan: counts[4],
    })
  } catch (error: any) {
    console.error("Error fetching admin stats:", error)
    return NextResponse.json({
      users: 0,
      ruangan: 0,
      dokter: 0,
      diagnosa: 0,
    })
  }
}
