import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function GET() {
  try {
    const session = await auth()
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const roles = await db.role.findMany({
      orderBy: { name: "asc" },
    })

    return NextResponse.json(roles)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
