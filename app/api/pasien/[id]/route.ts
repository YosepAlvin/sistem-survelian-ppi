import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const rawatInapId = parseInt(id)

    if (isNaN(rawatInapId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 })
    }

    const data = await req.json()

    await db.$transaction(async (tx) => {
      // 1. Ambil data rawat inap lama
      const rawatInap = await tx.rawatInap.findUnique({
        where: { id: rawatInapId },
        include: { pasien: true }
      })

      if (!rawatInap) {
        throw new Error("Data rawat inap tidak ditemukan")
      }

      // 2. Update data pasien
      await tx.pasien.update({
        where: { id: rawatInap.pasien_id },
        data: {
          nama: data.nama || rawatInap.pasien.nama,
          no_rm: data.no_rm || rawatInap.pasien.no_rm,
          jenis_kelamin: data.jk || rawatInap.pasien.jenis_kelamin,
          alamat: data.alamat || rawatInap.pasien.alamat,
          tanggal_lahir: data.tgl_lahir ? new Date(data.tgl_lahir) : rawatInap.pasien.tanggal_lahir,
        }
      })

      // 3. Prepare update data for rawat inap
      const rawatInapUpdate: any = {}
      
      if (data.tgl_masuk) {
        rawatInapUpdate.tanggal_masuk = new Date(data.tgl_masuk)
      }

      if (data.ruangan) {
        const ruanganId = parseInt(data.ruangan)
        if (!isNaN(ruanganId)) {
          rawatInapUpdate.ruangan_id = ruanganId
        }
      }

      if (data.dokter) {
        const dokterId = parseInt(data.dokter)
        if (!isNaN(dokterId)) {
          rawatInapUpdate.dokter_id = dokterId
        }
      }

      if (data.diagnosa) {
        const diagnosaName = data.diagnosa
        const diagnosa = await tx.diagnosa.upsert({
          where: { kode_icd: diagnosaName.toUpperCase().replace(/\s+/g, '_') },
          update: {},
          create: {
            kode_icd: diagnosaName.toUpperCase().replace(/\s+/g, '_'),
            nama: diagnosaName,
            kategori: "Umum",
          }
        })
        rawatInapUpdate.diagnosa_id = diagnosa.id
      }

      // 4. Update rawat inap
      if (Object.keys(rawatInapUpdate).length > 0) {
        await tx.rawatInap.update({
          where: { id: rawatInapId },
          data: rawatInapUpdate
        })
      }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const rawatInapId = parseInt(id)

    if (isNaN(rawatInapId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 })
    }

    await db.$transaction(async (tx) => {
      // Hapus data terkait
      await tx.surveilansHarian.deleteMany({ where: { rawat_inap_id: rawatInapId } })
      await tx.alatTerpasang.deleteMany({ where: { rawat_inap_id: rawatInapId } })
      
      // Hapus semua kejadian infeksi dan relasinya
      const kejadianInfeksi = await tx.kejadianInfeksi.findMany({
        where: { rawat_inap_id: rawatInapId },
        select: { id: true }
      })
      const kejadianIds = kejadianInfeksi.map(k => k.id)
      await tx.phlebitis.deleteMany({ where: { kejadian_infeksi_id: { in: kejadianIds } } })
      await tx.isk.deleteMany({ where: { kejadian_infeksi_id: { in: kejadianIds } } })
      await tx.hapVap.deleteMany({ where: { kejadian_infeksi_id: { in: kejadianIds } } })
      await tx.iadp.deleteMany({ where: { kejadian_infeksi_id: { in: kejadianIds } } })
      await tx.dekubitus.deleteMany({ where: { kejadian_infeksi_id: { in: kejadianIds } } })
      await tx.kejadianInfeksi.deleteMany({ where: { rawat_inap_id: rawatInapId } })
      
      // Hapus penggunaan antibiotik
      await tx.penggunaanAntibiotik.deleteMany({ where: { rawat_inap_id: rawatInapId } })
      
      // Hapus operasi dan surveilans ido
      const operasi = await tx.operasi.findMany({
        where: { rawat_inap_id: rawatInapId },
        select: { id: true }
      })
      const operasiIds = operasi.map(o => o.id)
      await tx.surveilansIdo.deleteMany({ where: { operasi_id: { in: operasiIds } } })
      await tx.operasi.deleteMany({ where: { rawat_inap_id: rawatInapId } })
      
      // Hapus hasil kultur
      await tx.hasilKultur.deleteMany({ where: { rawat_inap_id: rawatInapId } })
      
      // Hapus RawatInap
      await tx.rawatInap.delete({ where: { id: rawatInapId } })
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
