import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session || (session.user as any).role !== "IPCN") {
      return NextResponse.json({ error: "Unauthorized. IPCN role required." }, { status: 401 })
    }

    const { alatTerpasangId, jenisSaran, catatan } = await req.json()
    const userId = parseInt((session.user as any).id)

    // @ts-ignore
    const suggestion = await db.alatSuggestion.create({
      data: {
        alat_terpasang_id: alatTerpasangId,
        jenis_saran: jenisSaran,
        catatan: catatan,
        created_by: userId,
      },
    })

    // Send notification to IPCLN
    const alat = await db.alatTerpasang.findUnique({
      where: { id: alatTerpasangId },
      include: { rawat_inap: { include: { pasien: true, ruangan: true } } },
    })

    if (alat) {
      await db.notification.create({
        data: {
          type: "SUGGESTION_ALAT",
          category: "Saran Alat",
          title: `Saran dari IPCN untuk ${alat.jenis_alat}`,
          message: `IPCN memberikan saran ${jenisSaran} untuk alat ${alat.jenis_alat} pasien ${alat.rawat_inap.pasien.nama} (RM ${alat.rawat_inap.pasien.no_rm}).`,
          payload: JSON.stringify({
            alatTerpasangId,
            jenisSaran,
            patientName: alat.rawat_inap.pasien.nama,
            noRm: alat.rawat_inap.pasien.no_rm,
          }),
          relatedEntityType: "AlatSuggestion",
          relatedEntityId: suggestion.id,
          createdBy: userId,
        },
      })
    }

    return NextResponse.json({ success: true, data: suggestion })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id, status, tanggapan } = await req.json()
    const userId = parseInt((session.user as any).id)

    // @ts-ignore
    const updated = await db.alatSuggestion.update({
      where: { id: parseInt(id) },
      data: {
        status: status,
        tanggapan: tanggapan,
        updated_by: userId,
        updated_at: new Date(),
      },
      include: {
        alatTerpasang: {
          include: { rawat_inap: { include: { pasien: true } } }
        },
        creator: true
      }
    })

    // Send notification back to the creator (IPCN)
    if (updated.creator) {
      await db.notification.create({
        data: {
          type: "SUGGESTION_RESPONSE",
          category: "Respon Saran Alat",
          title: `Respon untuk saran ${updated.alatTerpasang.jenis_alat}`,
          message: `Saran untuk alat ${updated.alatTerpasang.jenis_alat} pasien ${updated.alatTerpasang.rawat_inap.pasien.nama} (RM ${updated.alatTerpasang.rawat_inap.pasien.no_rm}) mendapat tanggapan: ${status}`,
          payload: JSON.stringify({
            alatTerpasangId: updated.alat_terpasang_id,
            suggestionId: updated.id,
            status: status
          }),
          relatedEntityType: "AlatSuggestion",
          relatedEntityId: updated.id,
          recipientId: updated.creator.id,
          createdBy: userId
        }
      })
    }

    return NextResponse.json({ success: true, data: updated })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // @ts-ignore
    const suggestions = await db.alatSuggestion.findMany({
      include: {
        alatTerpasang: {
          include: { rawat_inap: { include: { pasien: true, ruangan: true } } },
        },
        creator: { select: { id: true, name: true } },
        updater: { select: { id: true, name: true } },
      },
      orderBy: { created_at: "desc" },
    })

    return NextResponse.json(suggestions)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
