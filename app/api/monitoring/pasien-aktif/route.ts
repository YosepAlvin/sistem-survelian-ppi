import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { calcAntibiotikStatus } from "@/lib/antibiotik-status"

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
          where: { masih_terpasang: true },
        },
        // Include active antibiotic therapies (no tanggal_selesai = still being tracked)
        penggunaan_antibiotik: {
          include: { antibiotik: true },
          orderBy: { tanggal_mulai: "desc" },
        },
      },
      orderBy: { tanggal_masuk: "desc" },
    })

    const formatted = pasienAktif.map((ri) => {
      // Find the most recent active antibiotic (no tanggal_selesai)
      const activeAntibiotik = ri.penggunaan_antibiotik.find(
        (ab: any) => !ab.tanggal_selesai
      ) ?? null

      let antibiotikInfo: {
        nama: string
        dosis: string
        tgl_mulai: string
        hari_ke: number
        status: string
        efek_samping: string | null
        catatan_ipcn: string | null
        rekomendasi_ipcn: string | null
      } | null = null

      if (activeAntibiotik) {
        const { status, hari_ke } = calcAntibiotikStatus(
          (activeAntibiotik as any).tanggal_mulai,
          (activeAntibiotik as any).tanggal_selesai,
          (activeAntibiotik as any).antibiotik.is_restriksi,
          (activeAntibiotik as any).antibiotik.durasi_maks_hari,
          (activeAntibiotik as any).efek_samping
        )
        antibiotikInfo = {
          nama: (activeAntibiotik as any).antibiotik.nama,
          dosis: (activeAntibiotik as any).dosis || "-",
          tgl_mulai: new Date((activeAntibiotik as any).tanggal_mulai)
            .toISOString()
            .split("T")[0],
          hari_ke,
          status,
          efek_samping: (activeAntibiotik as any).efek_samping || null,
          catatan_ipcn: (activeAntibiotik as any).catatan_ipcn || null,
          rekomendasi_ipcn: (activeAntibiotik as any).rekomendasi_ipcn || null,
        }
      }

      return {
        id: ri.id,
        no_rm: ri.pasien.no_rm,
        nama: ri.pasien.nama,
        ruangan: ri.ruangan.nama,
        ruanganObj: ri.ruangan,
        diagnosa: ri.diagnosa.nama,
        tgl_masuk: ri.tanggal_masuk.toISOString().split("T")[0],
        rawat_inap: {
          id: ri.id,
          pasien: ri.pasien,
          ruangan: ri.ruangan,
        },
        alat_terpasang: ri.alat_terpasang.map((a: any) => ({
          id: a.id,
          jenis_alat: a.jenis_alat,
          tanggal_pasang: a.tanggal_pasang,
          tanggal_lepas: a.tanggal_lepas,
          masih_terpasang: a.masih_terpasang,
        })),
        alat: ri.alat_terpasang.map((a: any) => a.jenis_alat),
        // New: active antibiotic info (null if none)
        antibiotik: antibiotikInfo,
      }
    })

    return NextResponse.json(formatted)
  } catch (error: any) {
    console.error("Error in pasien-aktif:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
