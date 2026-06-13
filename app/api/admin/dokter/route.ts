import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userRole = (session.user as any).role
    if (userRole !== 'ADMIN' && userRole !== 'IPCN' && userRole !== 'IPCLN') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const dokter = await db.dokter.findMany({
      where: { isActive: true },
      orderBy: { nama: 'asc' }
    })

    const formatted = dokter.map(d => ({
      id: d.id.toString(),
      nama: d.nama,
      spesialisasi: d.spesialisasi,
      isActive: d.isActive,
    }))

    return NextResponse.json(formatted)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { nama, spesialisasi } = await req.json()

    const newDokter = await db.dokter.create({
      data: {
        nama,
        spesialisasi,
        isActive: true,
      }
    })

    return NextResponse.json({ success: true, data: newDokter })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth()
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, nama, spesialisasi, isActive } = await req.json()
    if (!id) {
      return NextResponse.json({ error: 'Missing dokter id' }, { status: 400 })
    }

    const dataToUpdate: any = {}
    if (nama) dataToUpdate.nama = nama
    if (spesialisasi) dataToUpdate.spesialisasi = spesialisasi
    if (typeof isActive === 'boolean') dataToUpdate.isActive = isActive

    const updatedDokter = await db.dokter.update({
      where: { id: parseInt(id) },
      data: dataToUpdate
    })

    return NextResponse.json({ success: true, data: updatedDokter })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth()
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(req.url)
    const id = url.searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'Missing dokter id' }, { status: 400 })
    }

    await db.dokter.update({
      where: { id: parseInt(id) },
      data: { isActive: false }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
