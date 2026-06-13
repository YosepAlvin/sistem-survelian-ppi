import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { z } from "zod"
import { buildAuditTrailEntry } from "@/lib/audit-trail"

// Schema validasi khusus untuk IDO sesuai input form
const idoCreateSchema = z.object({
  operasi_id: z.string().or(z.number()),
  ada_infeksi: z.boolean(),
  tanggal_infeksi: z.string().optional().nullable(),
  ada_antibiotik: z.boolean(),
  hasil_kultur: z.string().optional(),
  jenis_pus: z.string().optional(),
})

// Schema untuk update IDO
const idoUpdateSchema = z.object({
  id: z.string().or(z.number()),
  ada_infeksi: z.boolean().optional(),
  tanggal_infeksi: z.string().optional().nullable(),
  ada_antibiotik: z.boolean().optional(),
  hasil_kultur: z.string().optional(),
  jenis_pus: z.string().optional(),
  action: z.enum(["EDIT", "CLOSE_CASE"]).optional(),
})

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    
    // Validasi Zod
    const validation = idoCreateSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json({ 
        success: false, 
        error: "Validation Error", 
        details: validation.error.errors 
      }, { status: 400 })
    }

    const data: any = validation.data
    const userId = session.user && (session.user as any).id ? parseInt((session.user as any).id) : null

    const result = await (db.surveilansIdo as any).create({
      data: {
        operasi_id: typeof data.operasi_id === 'string' ? parseInt(data.operasi_id) : data.operasi_id,
        ada_infeksi: data.ada_infeksi,
        tanggal_infeksi: data.ada_infeksi && data.tanggal_infeksi ? new Date(data.tanggal_infeksi) : null,
        ada_antibiotik: data.ada_antibiotik,
        hasil_kultur: data.hasil_kultur,
        jenis_pus: data.jenis_pus,
        status_verifikasi: "PENDING",
        created_by: userId
      }
    })

    return NextResponse.json({ success: true, data: result })
  } catch (error: any) {
    console.error("API Error IDO:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const validation = idoUpdateSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json({ 
        success: false, 
        error: "Validation Error", 
        details: validation.error.errors 
      }, { status: 400 })
    }

    const data: any = validation.data
    const userId = session.user && (session.user as any).id ? parseInt((session.user as any).id) : null
    const userName = (session.user as any).name || 'Unknown User'
    const idoId = typeof data.id === 'string' ? parseInt(data.id) : data.id

    // Dapatkan data existing untuk audit trail
    const existingIdo = await (db.surveilansIdo as any).findUnique({
      where: { id: idoId }
    })
    if (!existingIdo) {
      return NextResponse.json({ success: false, error: "IDO not found" }, { status: 404 })
    }

    const updateData: any = {
      updated_by: userId
    }

    if (data.action === 'CLOSE_CASE') {
      // Fetch full IDO data with patient info for better notification
      const fullIdo = await (db.surveilansIdo as any).findUnique({
        where: { id: idoId },
        include: {
          operasi: {
            include: { rawat_inap: { include: { pasien: true } } }
          }
        }
      })
      
      updateData.status = 'SELESAI'
      updateData.tanggal_selesai = new Date()
      // Buat audit trail
      const auditEntry = buildAuditTrailEntry({
        action: 'CLOSE_CASE',
        moduleName: 'ido',
        userId: userId,
        userName: userName,
        entityType: 'SurveilansIdo',
        entityId: idoId,
        field: 'status',
        previousValue: existingIdo.status,
        newValue: 'SELESAI',
        ipAddress: null,
        timestamp: new Date(),
      })
      await db.auditTrail.create({ data: auditEntry })
      
      // Buat notifikasi dengan nama pasien
      const patientName = fullIdo?.operasi?.rawat_inap?.pasien?.nama || 'pasien'
      await (db.notification as any).create({
        data: {
          type: 'STATUS_UPDATE',
          category: 'Status Laporan',
          title: 'IDO Telah Sembuh',
          message: `Kasus IDO pasien ${patientName} telah ditandai sembuh.`,
          relatedEntityType: 'SurveilansIdo',
          relatedEntityId: idoId,
          pasienId: fullIdo?.operasi?.rawat_inap?.pasien_id || null,
          createdBy: userId
        }
      })
    } else {
      // EDIT
      if (data.ada_infeksi !== undefined) updateData.ada_infeksi = data.ada_infeksi
      if (data.tanggal_infeksi !== undefined) {
        updateData.tanggal_infeksi = data.tanggal_infeksi ? new Date(data.tanggal_infeksi) : null
      }
      if (data.ada_antibiotik !== undefined) updateData.ada_antibiotik = data.ada_antibiotik
      if (data.hasil_kultur !== undefined) updateData.hasil_kultur = data.hasil_kultur
      if (data.jenis_pus !== undefined) updateData.jenis_pus = data.jenis_pus
      
      // Reset status ke PENDING jika diedit oleh IPCLN
      if ((session.user as any).role === 'IPCLN') {
        updateData.status_verifikasi = 'PENDING'
      }
      
      // Audit trail
      const auditEntry = buildAuditTrailEntry({
        action: 'UPDATE',
        moduleName: 'ido',
        userId: userId,
        userName: userName,
        entityType: 'SurveilansIdo',
        entityId: idoId,
        field: 'data',
        previousValue: JSON.stringify(existingIdo),
        newValue: JSON.stringify(updateData),
        ipAddress: null,
        timestamp: new Date(),
      })
      await db.auditTrail.create({ data: auditEntry })
    }

    const result = await (db.surveilansIdo as any).update({
      where: { id: idoId },
      data: updateData,
    })

    return NextResponse.json({ success: true, data: result })
  } catch (error: any) {
    console.error("API Error IDO PUT:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const reports = await db.surveilansIdo.findMany({
      include: {
        operasi: {
          include: {
            rawat_inap: {
              include: {
                pasien: true,
                ruangan: true,
              }
            }
          }
        }
      },
      orderBy: { id: "desc" }
    })

    const formatted = reports.map((r: any) => ({
      id: r.id.toString(),
      tanggal: r.tanggal_infeksi ? r.tanggal_infeksi.toISOString().split('T')[0] : "-",
      ruangan: r.operasi.rawat_inap.ruangan.nama,
      pasien: r.operasi.rawat_inap.pasien.nama,
      no_rm: r.operasi.rawat_inap.pasien.no_rm,
      jenis_infeksi: "IDO",
      detail: r.hasil_kultur || "-",
      status: r.status_verifikasi,
      caseStatus: r.status,
      entityType: 'SurveilansIdo'
    }))

    return NextResponse.json(formatted)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
