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
        const newPasien = await db.pasien.create({
          data: {
            no_rm: item.no_rm,
            nama: item.nama,
            tanggal_lahir: new Date(item.tanggal_lahir),
            usia: parseInt(item.usia) || 0,
            jenis_kelamin: item.jenis_kelamin,
            alamat: item.alamat
          }
        })
        created.push(newPasien)
      } catch (err: any) {
        errors.push({ index: i, message: err.message })
      }
    }

    return NextResponse.json({ success: true, created, errors })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
