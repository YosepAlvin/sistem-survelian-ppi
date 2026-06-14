import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { countAntibiotikStatuses } from "@/lib/antibiotik-status"

export async function GET() {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json({
        success: true,
        data: {
          pasienAktif: 0,
          kejadianInfeksi: 0,
          tindakanOperasi: 0,
          antibiotics: { aktif: 0, akanSelesai: 0, overdue: 0, perluReview: 0, selesai: 0 },
        },
      })
    }

    const sessionUser = session.user as any
    let ruanganId = sessionUser?.ruanganId ? parseInt(String(sessionUser.ruanganId), 10) : null

    if (!ruanganId && sessionUser?.id) {
      const user = await db.user.findUnique({
        where: { id: parseInt(sessionUser.id, 10) },
        select: { ruanganId: true },
      })
      ruanganId = user?.ruanganId ? parseInt(String(user.ruanganId), 10) : null
    }

    // ── Antibiotic status counts using shared canonical logic ─────────────────
    const allAntibiotics = await db.penggunaanAntibiotik.findMany({
      where: {
        rawat_inap: {
          ruangan_id: ruanganId ?? undefined,
        },
      },
      include: { antibiotik: true },
    })

    const abCounts = countAntibiotikStatuses(allAntibiotics)

    // ── Other module counts ───────────────────────────────────────────────────
    const [pasienAktifCount, kejadianCount, operasiCount] = await db.$transaction([
      db.rawatInap.count({
        where: {
          status: "AKTIF",
          ruangan_id: ruanganId ?? undefined,
        },
      }),
      db.kejadianInfeksi.count({
        where: {
          status: { not: "SELESAI" },
          rawat_inap: { ruangan_id: ruanganId ?? undefined },
        },
      }),
      db.operasi.count({
        where: {
          rawat_inap: { ruangan_id: ruanganId ?? undefined },
        },
      }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        pasienAktif: pasienAktifCount,
        kejadianInfeksi: kejadianCount,
        tindakanOperasi: operasiCount,
        antibiotics: {
          aktif: abCounts.AKTIF,
          akanSelesai: abCounts.AKAN_SELESAI,
          overdue: abCounts.OVERDUE,
          perluReview: abCounts.perlu_review_total,
          selesai: abCounts.SELESAI,
        },
      },
    })
  } catch (error: any) {
    console.error("Error fetching IPCLN stats:", error)
    return NextResponse.json({
      success: true,
      data: {
        pasienAktif: 0,
        kejadianInfeksi: 0,
        tindakanOperasi: 0,
        antibiotics: { aktif: 0, akanSelesai: 0, overdue: 0, perluReview: 0, selesai: 0 },
      },
    })
  }
}
