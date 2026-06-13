import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const idoId = parseInt(id)
    const ido = await (db.surveilansIdo as any).findUnique({
      where: { id: idoId },
      include: {
        operasi: {
          include: {
            rawat_inap: {
              include: {
                pasien: true,
                ruangan: true
              }
            }
          }
        }
      }
    })

    if (!ido) {
      return NextResponse.json({ error: "IDO not found" }, { status: 404 })
    }

    return NextResponse.json(ido)
  } catch (error: any) {
    console.error("API Error IDO GET by ID:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
