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

    const antibiotik = await db.antibiotik.findMany({
      orderBy: { nama: 'asc' }
    })

    const formatted = antibiotik.map(a => ({
      id: a.id.toString(),
      nama: a.nama,
      kode: a.kode || '',
      golongan: a.golongan || '',
      is_restriksi: a.is_restriksi,
      durasi_maks_hari: a.durasi_maks_hari || 7,
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

    const { nama, kode, golongan, is_restriksi, durasi_maks_hari } = await req.json()

    const newAntibiotik = await db.antibiotik.create({
      data: {
        nama,
        kode,
        golongan,
        is_restriksi: Boolean(is_restriksi),
        durasi_maks_hari: parseInt(durasi_maks_hari) || 7,
      }
    })

    return NextResponse.json({ success: true, data: newAntibiotik })
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

    const { id, nama, kode, golongan, is_restriksi, durasi_maks_hari } = await req.json()
    if (!id) {
      return NextResponse.json({ error: 'Missing antibiotik id' }, { status: 400 })
    }

    const dataToUpdate: any = {}
    if (nama) dataToUpdate.nama = nama
    if (kode) dataToUpdate.kode = kode
    if (golongan) dataToUpdate.golongan = golongan
    if (is_restriksi !== undefined) dataToUpdate.is_restriksi = Boolean(is_restriksi)
    if (durasi_maks_hari) dataToUpdate.durasi_maks_hari = parseInt(durasi_maks_hari)

    const updatedAntibiotik = await db.antibiotik.update({
      where: { id: parseInt(id) },
      data: dataToUpdate
    })

    return NextResponse.json({ success: true, data: updatedAntibiotik })
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
      return NextResponse.json({ error: 'Missing antibiotik id' }, { status: 400 })
    }

    await db.antibiotik.delete({ where: { id: parseInt(id) } })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
