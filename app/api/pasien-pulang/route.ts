import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const rawatInap = await db.rawatInap.findMany({
      where: { 
        status: "PULANG"
      },
      include: {
        pasien: true,
        ruangan: true,
        diagnosa: true,
        kejadian_infeksi: true,
        alat_terpasang: true
      },
      orderBy: { tanggal_keluar: "desc" },
    })

    const formatted = await Promise.all(rawatInap.map(async (ri) => {
      const birthDate = new Date(ri.pasien.tanggal_lahir)
      const today = new Date()
      let age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--
      }

      return {
        id: ri.id.toString(),
        no_rm: ri.pasien.no_rm,
        nama: ri.pasien.nama,
        diagnosa: ri.diagnosa.nama,
        tgl_masuk: ri.tanggal_masuk.toISOString().split("T")[0],
        tgl_keluar: ri.tanggal_keluar?.toISOString().split("T")[0] || "",
        kondisi_keluar: ri.kondisi_keluar || "",
        umur: age.toString(),
        jk: ri.pasien.jenis_kelamin,
        alamat: ri.pasien.alamat,
        ruangan: ri.ruangan.nama,
        jumlah_infeksi: ri.kejadian_infeksi.length,
        jumlah_alat: ri.alat_terpasang.length,
      }
    }))

    return NextResponse.json(formatted)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
