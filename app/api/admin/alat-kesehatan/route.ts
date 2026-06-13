import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function GET() {
  try {
    const session = await auth()
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const alatKesehatan = await db.deviceThresholdConfig.findMany({
      orderBy: { jenisAlat: 'asc' }
    })

    return NextResponse.json(alatKesehatan)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { jenisAlat, hariThreshold, isActive } = body

    if (!jenisAlat) {
      return NextResponse.json({ error: "Jenis alat harus diisi" }, { status: 400 })
    }

    const alatKesehatan = await db.deviceThresholdConfig.create({
      data: {
        jenisAlat,
        hariThreshold: hariThreshold || 7,
        isActive: isActive ?? true
      }
    })

    return NextResponse.json({ success: true, data: alatKesehatan })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth()
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { id, jenisAlat, hariThreshold, isActive } = body

    if (!id) {
      return NextResponse.json({ error: "ID alat harus diisi" }, { status: 400 })
    }

    const dataToUpdate: any = {}
    if (jenisAlat) dataToUpdate.jenisAlat = jenisAlat
    if (hariThreshold !== undefined) dataToUpdate.hariThreshold = hariThreshold
    if (isActive !== undefined) dataToUpdate.isActive = isActive

    const alatKesehatan = await db.deviceThresholdConfig.update({
      where: { id: parseInt(id) },
      data: dataToUpdate
    })

    return NextResponse.json({ success: true, data: alatKesehatan })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth()
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const url = new URL(req.url)
    const id = url.searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: "ID alat harus diisi" }, { status: 400 })
    }

    await db.deviceThresholdConfig.delete({
      where: { id: parseInt(id) }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
