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
      return NextResponse.json({ error: "Unauthorized. Admin, IPCN, or IPCLN role required." }, { status: 403 })
    }

    const ruangan = await db.ruangan.findMany({
      orderBy: { nama: 'asc' }
    })

    const formatted = ruangan.map(r => ({
      id: r.id.toString(),
      nama: r.nama,
      kode: r.kode,
      kategori: r.jenis,
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

    const { nama, kode, kategori } = await req.json()

    const newRuangan = await db.ruangan.create({
      data: {
        nama,
        kode,
        jenis: kategori,
      }
    })

    return NextResponse.json({ success: true, data: newRuangan })
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

    const { id, nama, kode, kategori } = await req.json()
    if (!id) {
      return NextResponse.json({ error: 'Missing ruangan id' }, { status: 400 })
    }

    const dataToUpdate: any = {}
    if (nama) dataToUpdate.nama = nama
    if (kode) dataToUpdate.kode = kode
    if (kategori) dataToUpdate.jenis = kategori

    const updatedRuangan = await db.ruangan.update({
      where: { id: parseInt(id) },
      data: dataToUpdate
    })

    return NextResponse.json({ success: true, data: updatedRuangan })
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
      return NextResponse.json({ error: 'Missing ruangan id' }, { status: 400 })
    }

    await db.ruangan.delete({ where: { id: parseInt(id) } })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
