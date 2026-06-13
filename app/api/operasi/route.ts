import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { z } from "zod"

const operasiSchema = z.object({
  no_rm: z.string().min(1),
  pasien: z.string(),
  dx_operasi: z.string(),
  jenis_operasi: z.string(),
  t_time: z.string().or(z.number()),
  asa: z.string().optional(),
  tanggal_operasi: z.string().optional(),
}).passthrough()

export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const role = (session.user as any).role
    const ruanganId = (session.user as any).ruanganId

    const operations = await db.operasi.findMany({
      where: role === 'IPCLN' && ruanganId ? {
        rawat_inap: { ruangan_id: parseInt(ruanganId) }
      } : {},
      include: {
        rawat_inap: {
          include: {
            pasien: true,
            ruangan: true,
          }
        },
        surveilans_ido: true
      },
      orderBy: { tanggal_operasi: "desc" }
    })

    const formatted = operations.map(op => {
      const ido = op.surveilans_ido.length > 0 ? (op.surveilans_ido[0] as any) : null
      return {
        id: op.id.toString(),
        tanggal: op.tanggal_operasi.toISOString().split('T')[0],
        pasien: op.rawat_inap.pasien.nama,
        no_rm: op.rawat_inap.pasien.no_rm,
        ruangan: op.rawat_inap.ruangan.nama,
        diagnosa: op.dx_operasi || "-",
        jenis: op.jenis_operasi,
        asa: op.asa_klasifikasi || "-",
        t_time: op.t_time_jam || 0,
        skor_risiko: op.risk_score || 0,
        status_ido: ido ? ido.status_verifikasi : "PENDING",
        ido_id: ido ? ido.id.toString() : null,
        case_status: ido ? ido.status : null,
        surveilans_ido: op.surveilans_ido
      }
    })

    return NextResponse.json(formatted)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    
    // Validasi Zod
    const validation = operasiSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json({ 
        success: false, 
        error: "Validation Error", 
        details: validation.error.errors 
      }, { status: 400 })
    }

    const data: any = validation.data
    const userId = session.user && (session.user as any).id ? parseInt((session.user as any).id) : null

    const result = await db.$transaction(async (tx) => {
      // 1. Cari Pasien berdasarkan No. RM
      let pasien = await tx.pasien.findUnique({
        where: { no_rm: data.no_rm },
      })

      // Jika pasien belum ada, buat baru
      if (!pasien) {
        pasien = await tx.pasien.create({
          data: {
            no_rm: data.no_rm,
            nama: data.pasien as string,
            tanggal_lahir: new Date(), // Placeholder
            jenis_kelamin: "L", // Placeholder
            alamat: "-", // Placeholder
          },
        })
      }

      // 2. Cari atau buat RawatInap AKTIF untuk pasien ini
      let rawatInap = await tx.rawatInap.findFirst({
        where: {
          pasien_id: pasien.id,
          status: "AKTIF"
        },
        orderBy: { tanggal_masuk: 'desc' }
      })

      if (!rawatInap) {
        // Cari Ruangan default
        const ruangan = await tx.ruangan.findFirst()
        if (!ruangan) throw new Error("Data ruangan tidak tersedia")

        // Cari Dokter default
        const dokter = await tx.dokter.findFirst()
        if (!dokter) throw new Error("Data dokter tidak tersedia")

        // Cari Diagnosa default
        const diagnosa = await tx.diagnosa.findFirst()
        if (!diagnosa) throw new Error("Data diagnosa tidak tersedia")

        rawatInap = await tx.rawatInap.create({
          data: {
            pasien_id: pasien.id,
            ruangan_id: ruangan.id,
            dokter_id: dokter.id,
            diagnosa_id: diagnosa.id,
            tanggal_masuk: new Date(),
            status: "AKTIF",
          }
        })
      }

      // 3. Simpan data operasi
      return await tx.operasi.create({
        data: {
          rawat_inap_id: rawatInap.id,
          tanggal_operasi: data.tanggal_operasi ? new Date(data.tanggal_operasi) : new Date(),
          dx_operasi: data.dx_operasi as string,
          jenis_operasi: data.jenis_operasi as string,
          kategori_operasi: "UMUM", // Default
          asa_klasifikasi: data.asa as string || "-",
          t_time_jam: typeof data.t_time === 'string' ? parseFloat(data.t_time) : data.t_time as number,
          risk_score: Math.floor(Math.random() * 3), // Mock risk score logic
          ipcln_id: userId
        }
      })
    })

    return NextResponse.json({ success: true, data: result })
  } catch (error: any) {
    console.error("API Error Operasi:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
