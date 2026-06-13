import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const role = (session.user as any).role
    const ruanganId = (session.user as any).ruanganId

    const rawatInap = await db.rawatInap.findMany({
      where: { 
        status: "AKTIF",
        ...(role === 'IPCLN' && ruanganId ? { ruangan_id: parseInt(ruanganId) } : {})
      },
      include: {
        pasien: true,
        ruangan: true,
        diagnosa: true,
        surveilans_harian: {
          orderBy: { tanggal: 'asc' }
        },
        alat_terpasang: true,
        kejadian_infeksi: true
      },
      orderBy: { tanggal_masuk: "desc" },
    })

    const formatted = await Promise.all(rawatInap.map(async (ri: any) => {
      // Hitung umur dinamis
      const birthDate = new Date(ri.pasien.tanggal_lahir)
      const today = new Date()
      let age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--
      }

      // Cek apakah masih ada infeksi aktif
      const hasActiveInfection = ri.kejadian_infeksi.some((infeksi: any) => infeksi.status === "AKTIF")
      
      // Cek apakah masih ada alat terpasang
      const hasActiveDevice = ri.alat_terpasang.some((alat: any) => alat.masih_terpasang)

      return {
        id: ri.id.toString(),
        no_rm: ri.pasien.no_rm,
        nama: ri.pasien.nama,
        diagnosa: ri.diagnosa.nama,
        tgl_masuk: ri.tanggal_masuk.toISOString().split("T")[0],
        tgl_lahir: ri.pasien.tanggal_lahir.toISOString().split("T")[0],
        umur: age.toString(),
        jk: ri.pasien.jenis_kelamin,
        alamat: ri.pasien.alamat,
        ruangan: ri.ruangan.nama,
        hasActiveInfection,
        hasActiveDevice,
        status_pulang: ri.status_pulang,
        riwayat_surveilans: ri.surveilans_harian.map((sh: any, idx: number) => ({
          hari_ke: idx + 1,
          tanggal: sh.tanggal.toISOString().split("T")[0],
          suhu: sh.suhu,
          infeksi: sh.ada_infeksi ? "Ya" : "Tidak"
        })),
        riwayat_alat: await db.alatTerpasang.findMany({
          where: { rawat_inap_id: ri.id },
          orderBy: { tanggal_pasang: 'asc' }
        })
      }
    }))

    return NextResponse.json(formatted)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await req.json()

    const result = await db.$transaction(async (tx) => {
      // 1. Upsert Pasien
      const pasien = await tx.pasien.upsert({
        where: { no_rm: data.no_rm },
        update: {
          nama: data.nama,
          jenis_kelamin: data.jk || "Laki-laki",
          alamat: data.alamat,
          tanggal_lahir: data.tgl_lahir ? new Date(data.tgl_lahir) : new Date(),
        },
        create: {
          no_rm: data.no_rm,
          nama: data.nama,
          jenis_kelamin: data.jk || "Laki-laki",
          alamat: data.alamat,
          tanggal_lahir: data.tgl_lahir ? new Date(data.tgl_lahir) : new Date(),
        },
      })

      // 2. Get Ruangan
      let ruangan;
      if (data.ruangan) {
        const ruanganId = parseInt(data.ruangan);
        ruangan = await tx.ruangan.findUnique({ where: { id: ruanganId } })
      }
      if (!ruangan && (session.user as any).ruanganId) {
        ruangan = await tx.ruangan.findUnique({ where: { id: (session.user as any).ruanganId } })
      }
      if (!ruangan) {
        ruangan = await tx.ruangan.findFirst()
      }

      if (!ruangan) {
        throw new Error("Ruangan tidak ditemukan. Pastikan master data ruangan sudah diinput oleh Admin.")
      }

      // 3. Upsert Diagnosa (Gunakan nama sebagai identitas agar tidak menimpa UNKNOWN)
      const diagnosaName = data.diagnosa || "Observasi"
      const diagnosa = await tx.diagnosa.upsert({
        where: { kode_icd: diagnosaName.toUpperCase().replace(/\s+/g, '_') },
        update: {},
        create: {
          kode_icd: diagnosaName.toUpperCase().replace(/\s+/g, '_'),
          nama: diagnosaName,
          kategori: "Umum",
        },
      })

      // 4. Get Dokter
      let dokter;
      if (data.dokter) {
        const dokterId = parseInt(data.dokter);
        dokter = await tx.dokter.findUnique({ where: { id: dokterId } })
      }
      if (!dokter) {
        dokter = await tx.dokter.findFirst()
      }
      if (!dokter) {
        throw new Error("Master data dokter belum diinput oleh Admin.")
      }

      // 5. Create RawatInap
      const rawatInap = await tx.rawatInap.create({
        data: {
          pasien_id: pasien.id,
          ruangan_id: ruangan.id,
          dokter_id: dokter.id,
          diagnosa_id: diagnosa.id,
          tanggal_masuk: data.tgl_masuk ? new Date(data.tgl_masuk) : new Date(),
          status: "AKTIF",
        },
      })

      return rawatInap
    })

    return NextResponse.json({ success: true, data: result })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
