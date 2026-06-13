import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const ruangan = await db.ruangan.findMany({
      where: { isActive: true },
      orderBy: { nama: "asc" },
    })

    return NextResponse.json(ruangan)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
