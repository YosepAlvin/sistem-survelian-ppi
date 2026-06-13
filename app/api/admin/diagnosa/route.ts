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
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const diagnosa = await db.diagnosa.findMany({
      orderBy: { kode_icd: 'asc' }
    })

    const formatted = diagnosa.map(d => ({
      id: d.id.toString(),
      kode: d.kode_icd,
      nama: d.nama,
      kategori: d.kategori,
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

    const { kode, nama, kategori } = await req.json()

    const newDiagnosa = await db.diagnosa.create({
      data: {
        kode_icd: kode,
        nama,
        kategori,
      }
    })

    return NextResponse.json({ success: true, data: newDiagnosa })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth()
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id, kode, nama, kategori } = await req.json()

    const updatedDiagnosa = await db.diagnosa.update({
      where: { id: parseInt(id) },
      data: {
        kode_icd: kode,
        nama,
        kategori,
      }
    })

    return NextResponse.json({ success: true, data: updatedDiagnosa })
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
      return NextResponse.json({ error: 'Missing diagnosa id' }, { status: 400 })
    }

    await db.diagnosa.delete({ where: { id: parseInt(id) } })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
