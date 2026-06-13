import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const pasienAktif = await db.rawatInap.findMany({
      where: { status: "AKTIF" },
      include: {
        pasien: true,
        ruangan: true,
        diagnosa: true,
        alat_terpasang: {
          where: { masih_terpasang: true }
        }
      },
      orderBy: { tanggal_masuk: "desc" }
    })

    const formatted = pasienAktif.map(ri => ({
      id: ri.id,
      no_rm: ri.pasien.no_rm,
      nama: ri.pasien.nama,
      ruangan: ri.ruangan.nama,
      ruanganObj: ri.ruangan,
      diagnosa: ri.diagnosa.nama,
      tgl_masuk: ri.tanggal_masuk.toISOString().split('T')[0],
      rawat_inap: {
        id: ri.id,
        pasien: ri.pasien,
        ruangan: ri.ruangan
      },
      alat_terpasang: ri.alat_terpasang.map(a => ({
        id: a.id,
        jenis_alat: a.jenis_alat,
        tanggal_pasang: a.tanggal_pasang,
        tanggal_lepas: a.tanggal_lepas,
        masih_terpasang: a.masih_terpasang
      })),
      alat: ri.alat_terpasang.map(a => a.jenis_alat),
    }))

    console.log("Formatted pasien aktif:", formatted)
    return NextResponse.json(formatted)
  } catch (error: any) {
    console.error("Error in pasien-aktif:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
