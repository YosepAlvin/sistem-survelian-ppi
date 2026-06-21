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

    const pasien = await db.pasien.findMany({
      orderBy: { nama: 'asc' }
    })

    const formatted = pasien.map(p => ({
      id: p.id.toString(),
      no_rm: p.no_rm,
      nama: p.nama,
      tanggal_lahir: p.tanggal_lahir.toISOString(),
      usia: p.usia,
      jenis_kelamin: p.jenis_kelamin,
      alamat: p.alamat || ''
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

    const { no_rm, nama, tanggal_lahir, usia, jenis_kelamin, alamat } = await req.json()

    const newPasien = await db.pasien.create({
      data: {
        no_rm,
        nama,
        tanggal_lahir: new Date(tanggal_lahir),
        usia: parseInt(usia) || 0,
        jenis_kelamin,
        alamat
      }
    })

    return NextResponse.json({ success: true, data: newPasien })
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

    const { id, no_rm, nama, tanggal_lahir, usia, jenis_kelamin, alamat } = await req.json()
    if (!id) {
      return NextResponse.json({ error: 'Missing pasien id' }, { status: 400 })
    }

    const dataToUpdate: any = {}
    if (no_rm) dataToUpdate.no_rm = no_rm
    if (nama) dataToUpdate.nama = nama
    if (tanggal_lahir) dataToUpdate.tanggal_lahir = new Date(tanggal_lahir)
    if (usia) dataToUpdate.usia = parseInt(usia)
    if (jenis_kelamin) dataToUpdate.jenis_kelamin = jenis_kelamin
    if (alamat) dataToUpdate.alamat = alamat

    const updatedPasien = await db.pasien.update({
      where: { id: parseInt(id) },
      data: dataToUpdate
    })

    return NextResponse.json({ success: true, data: updatedPasien })
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
      return NextResponse.json({ error: 'Missing pasien id' }, { status: 400 })
    }

    await db.pasien.delete({ where: { id: parseInt(id) } })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
