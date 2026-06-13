import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const deviceActive = await db.alatTerpasang.findMany({
      where: { masih_terpasang: true },
      include: {
        rawat_inap: {
          include: {
            pasien: true,
            ruangan: true,
          }
        }
      },
      orderBy: { tanggal_pasang: "asc" }
    })

    const today = new Date()

    const formatted = deviceActive.map(d => {
      const tglPasang = new Date(d.tanggal_pasang)
      const diffTime = Math.abs(today.getTime() - tglPasang.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      return {
        id: d.id.toString(),
        pasien: d.rawat_inap.pasien.nama,
        no_rm: d.rawat_inap.pasien.no_rm,
        ruangan: d.rawat_inap.ruangan.nama,
        jenis_alat: [d.jenis_alat],
        tgl_pasang: d.tanggal_pasang.toISOString().split('T')[0],
        lama: `${diffDays} Hari`,
        status: 'MASIH TERPASANG'
      }
    })

    return NextResponse.json(formatted)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
