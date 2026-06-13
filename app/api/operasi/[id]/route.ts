import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { z } from "zod"

const operasiUpdateSchema = z.object({
  no_rm: z.string().min(1).optional(),
  pasien: z.string().optional(),
  dx_operasi: z.string().optional(),
  jenis_operasi: z.string().optional(),
  t_time: z.union([z.string(), z.number()]).optional(),
  asa: z.string().optional(),
  tanggal_operasi: z.string().optional(),
}).passthrough()

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const operation = await db.operasi.findUnique({
      where: { id: parseInt(id) },
      include: {
        rawat_inap: {
          include: {
            pasien: true,
          }
        }
      }
    })

    if (!operation) {
      return NextResponse.json({ error: "Data operasi tidak ditemukan" }, { status: 404 })
    }

    const formatted = {
      id: operation.id.toString(),
      tanggal: operation.tanggal_operasi.toISOString().split('T')[0],
      pasien: operation.rawat_inap.pasien.nama,
      no_rm: operation.rawat_inap.pasien.no_rm,
      diagnosa: operation.dx_operasi || "-",
      jenis: operation.jenis_operasi,
      asa: operation.asa_klasifikasi || "-",
      t_time: operation.t_time_jam || 0,
      skor_risiko: operation.risk_score || 0
    }

    return NextResponse.json(formatted)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const validation = operasiUpdateSchema.safeParse(body)
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
      // Find existing operasi
      const existingOperasi = await tx.operasi.findUnique({
        where: { id: parseInt(id) },
        include: { rawat_inap: { include: { pasien: true } } }
      })
      if (!existingOperasi) throw new Error("Data operasi tidak ditemukan")

      // Update pasien if needed
      if (data.no_rm) {
        let pasien = await tx.pasien.findUnique({ where: { no_rm: data.no_rm } })
        if (!pasien) {
          pasien = await tx.pasien.create({
            data: {
              no_rm: data.no_rm,
              nama: data.pasien || existingOperasi.rawat_inap.pasien.nama,
              tanggal_lahir: new Date(),
              jenis_kelamin: "L",
              alamat: "-"
            }
          })
        }

        // Ensure rawat inap exists for pasien
        let rawatInap = await tx.rawatInap.findFirst({
          where: { pasien_id: pasien.id, status: "AKTIF" },
          orderBy: { tanggal_masuk: "desc" }
        })
        if (!rawatInap) {
          const ruangan = await tx.ruangan.findFirst()
          const dokter = await tx.dokter.findFirst()
          const diagnosa = await tx.diagnosa.findFirst()
          rawatInap = await tx.rawatInap.create({
            data: {
              pasien_id: pasien.id,
              ruangan_id: ruangan?.id || 1,
              dokter_id: dokter?.id || 1,
              diagnosa_id: diagnosa?.id || 1,
              tanggal_masuk: new Date(),
              status: "AKTIF"
            }
          })
        }

        // Update rawat_inap_id if needed
        if (existingOperasi.rawat_inap_id !== rawatInap.id) {
          await tx.operasi.update({
            where: { id: parseInt(id) },
            data: { rawat_inap_id: rawatInap.id }
          })
        }
      }

      // Update operasi data
      const updateData: any = {}
      if (data.dx_operasi) updateData.dx_operasi = data.dx_operasi
      if (data.jenis_operasi) updateData.jenis_operasi = data.jenis_operasi
      if (data.asa) updateData.asa_klasifikasi = data.asa
      if (data.t_time !== undefined) updateData.t_time_jam = typeof data.t_time === 'string' ? parseFloat(data.t_time) : data.t_time
      if (data.tanggal_operasi) updateData.tanggal_operasi = new Date(data.tanggal_operasi)
      if (userId) updateData.ipcln_id = userId

      return await tx.operasi.update({
        where: { id: parseInt(id) },
        data: updateData
      })
    })

    return NextResponse.json({ success: true, data: result })
  } catch (error: any) {
    console.error("API Error Update Operasi:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await db.operasi.delete({ where: { id: parseInt(id) } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
