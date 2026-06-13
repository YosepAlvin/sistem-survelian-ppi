import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

const { buildMonthlySurveillanceRows, buildMonthlySurveillanceSummary } = require("@/lib/ipcln-rekap")

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const url = new URL(req.url)
    const month = url.searchParams.get("month") || new Date().toISOString().slice(0, 7)

    const sessionUser = session.user as any
    let ruanganId: number | null = sessionUser?.ruanganId ? parseInt(sessionUser.ruanganId, 10) : null

    if (!ruanganId && sessionUser?.id) {
      const user = await db.user.findUnique({
        where: { id: parseInt(sessionUser.id, 10) },
        select: { ruanganId: true },
      })
      ruanganId = user?.ruanganId ? parseInt(String(user.ruanganId), 10) : null
    }

    const admissions = await db.rawatInap.findMany({
      where: ruanganId ? { ruangan_id: ruanganId } : {},
      include: {
        pasien: true,
        ruangan: true,
        surveilans_harian: true,
        kejadian_infeksi: {
          include: {
            phlebitis: true,
            isk: true,
            hap_vap: true,
            iadp: true,
            dekubitus: true,
          },
        },
      },
      orderBy: { tanggal_masuk: "desc" },
    })

    const rows = buildMonthlySurveillanceRows(admissions, month, ruanganId)
    const totals = buildMonthlySurveillanceSummary(rows)
    const roomName = ruanganId && admissions.length > 0
      ? admissions.find((item) => item.ruangan_id === ruanganId)?.ruangan?.nama || "Ruangan Anda"
      : "Semua Ruangan"

    return NextResponse.json({
      success: true,
      data: {
        month,
        roomId: ruanganId,
        roomName,
        rows,
        totals,
      },
    })
  } catch (error: any) {
    console.error("Error fetching IPCLN monthly recap:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
