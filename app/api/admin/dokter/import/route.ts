import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await req.json()
    if (!Array.isArray(data)) {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 })
    }

    const created: any[] = []
    const errors: any[] = []

    for (let i = 0; i < data.length; i++) {
      const item = data[i]
      try {
        const newDokter = await db.dokter.create({
          data: {
            nama: item.nama,
            spesialisasi: item.spesialisasi,
          }
        })
        created.push(newDokter)
      } catch (err: any) {
        errors.push({ index: i, message: err.message })
      }
    }

    return NextResponse.json({ success: true, created, errors })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
