import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { buildAuditTrailEntry } from "@/lib/audit-trail"
import { calcAntibiotikStatus, countAntibiotikStatuses } from "@/lib/antibiotik-status"

// ─── GET ─────────────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const role = (session.user as any).role
    const ruanganId = (session.user as any).ruanganId

    const [antibiotics, masterAntibiotics] = await Promise.all([
      db.penggunaanAntibiotik.findMany({
        where:
          role === "IPCLN" && ruanganId
            ? { rawat_inap: { ruangan_id: parseInt(ruanganId) } }
            : {},
        include: {
          rawat_inap: {
            include: { pasien: true, ruangan: true, dokter: true },
          },
          antibiotik: true,
        },
        orderBy: { tanggal_mulai: "desc" },
      }),
      db.antibiotik.findMany({ orderBy: { nama: "asc" } }),
    ])

    const formatted = antibiotics.map((ab: any) => {
      const { status, hari_ke, alasan_review } = calcAntibiotikStatus(
        ab.tanggal_mulai,
        ab.tanggal_rencana_selesai,
        ab.tanggal_selesai_aktual,
        ab.antibiotik.is_restriksi,
        ab.antibiotik.durasi_maks_hari,
        ab.efek_samping,
        ab.tanggal_review
      )

      return {
        id: ab.id.toString(),
        pasien: ab.rawat_inap.pasien.nama,
        no_rm: ab.rawat_inap.pasien.no_rm,
        ruangan: ab.rawat_inap.ruangan?.nama || "-",
        nama_ab: ab.antibiotik.nama,
        antibiotik_id: ab.antibiotik_id,
        dosis: ab.dosis || "-",
        rute: ab.rute || "-",
        tgl_mulai: ab.tanggal_mulai.toISOString().split("T")[0],
        tgl_selesai: ab.tanggal_selesai_aktual
          ? ab.tanggal_selesai_aktual.toISOString().split("T")[0]
          : "-",
        ke: ab.antibiotik_ke || 1,
        hari_ke,
        status,
        alasan_review,
        is_restriksi: ab.antibiotik.is_restriksi,
        efek_samping: ab.efek_samping,
        catatan_ipcn: ab.catatan_ipcn,
        rekomendasi_ipcn: ab.rekomendasi_ipcn,
        tanggal_review: ab.tanggal_review?.toISOString().split("T")[0],
        dokter: ab.rawat_inap.dokter?.nama,
      }
    })

    const abCounts = countAntibiotikStatuses(antibiotics)
    const stats = {
      total: formatted.length,
      aktif: abCounts.AKTIF,
      akan_selesai: abCounts.AKAN_SELESAI,
      overdue: abCounts.OVERDUE,
      perlu_review: abCounts.perlu_review_total,
      selesai: abCounts.SELESAI,
    }

    return NextResponse.json({ penggunaan: formatted, master: masterAntibiotics, stats })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// ─── POST ────────────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await req.json()

    const result = await db.$transaction(async (tx) => {
      // Find or create pasien
      let pasien = await tx.pasien.findUnique({ where: { no_rm: data.no_rm } })
      if (!pasien) {
        pasien = await tx.pasien.create({
          data: {
            no_rm: data.no_rm,
            nama: data.pasien,
            tanggal_lahir: new Date(),
            usia: 0,
            jenis_kelamin: "Laki-laki",
          },
        })
      }

      // Find or create rawat inap
      let rawatInap = await tx.rawatInap.findFirst({
        where: { pasien_id: pasien.id, status: "AKTIF" },
      })
      if (!rawatInap) {
        const ruanganId = (session.user as any).ruanganId || 1
        rawatInap = await tx.rawatInap.create({
          data: {
            pasien_id: pasien.id,
            ruangan_id: parseInt(ruanganId),
            dokter_id: 1,
            diagnosa_id: 1,
            tanggal_masuk: new Date(),
            status: "AKTIF",
          },
        })
      }

      // Find or create antibiotic master
      const abMaster = await tx.antibiotik.upsert({
        where: { kode: data.nama_ab.toUpperCase() },
        update: {},
        create: { nama: data.nama_ab, kode: data.nama_ab.toUpperCase(), golongan: "Umum" },
      })

      // Create penggunaan record
      const penggunaan = await tx.penggunaanAntibiotik.create({
        data: {
          rawat_inap_id: rawatInap.id,
          antibiotik_id: abMaster.id,
          tanggal_mulai: new Date(data.tgl_mulai),
          tanggal_rencana_selesai:
            data.tgl_selesai && data.tgl_selesai !== "-"
              ? new Date(data.tgl_selesai)
              : null,
          dosis: data.dosis,
          rute: data.rute || "IV",
          antibiotik_ke: parseInt(data.ke),
          efek_samping: data.efek_samping || null,
        } as any,
      })

      // Audit trail — CREATE
      await tx.auditTrail.create({
        data: buildAuditTrailEntry({
          action: "ANTIBIOTIK_CREATE",
          moduleName: "antibiotik",
          userId: parseInt((session.user as any).id),
          userName: (session.user as any).name || "User",
          entityType: "PenggunaanAntibiotik",
          entityId: penggunaan.id,
          field: null,
          previousValue: null,
          newValue: JSON.stringify({
            antibiotik: data.nama_ab,
            pasien: data.pasien,
            dosis: data.dosis,
            tgl_mulai: data.tgl_mulai,
            tgl_selesai: data.tgl_selesai || null,
            rute: data.rute || "IV",
          }),
          ipAddress: null,
          timestamp: new Date(),
        }),
      })

      return penggunaan
    })

    return NextResponse.json({ success: true, data: result })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// ─── PUT ─────────────────────────────────────────────────────────────────────

export async function PUT(req: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await req.json()
    if (!data.id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 })
    }

    const recordId = parseInt(data.id)
    const isMarkComplete = data.markComplete === true
    const isReview = data.is_review === true
    const role = (session.user as any).role

    // ── Load existing record BEFORE update (for audit previous value) ────────
    const existing = await db.penggunaanAntibiotik.findUnique({
      where: { id: recordId },
      include: { 
        antibiotik: true,
        rawat_inap: { include: { pasien: true } }
      },
    })
    if (!existing) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 })
    }

    // ── Build update payload ─────────────────────────────────────────────────
    const updateData: any = {}

    if (isMarkComplete) {
      updateData.tanggal_selesai_aktual = new Date()
    } else {
      if (data.tgl_mulai) updateData.tanggal_mulai = new Date(data.tgl_mulai)
      if (data.tgl_selesai && data.tgl_selesai !== "-") {
        updateData.tanggal_rencana_selesai = new Date(data.tgl_selesai)
      } else if (data.tgl_selesai === "-") {
        updateData.tanggal_rencana_selesai = null
      }
      if (data.dosis) updateData.dosis = data.dosis
      if (data.rute) updateData.rute = data.rute
      if (data.ke) updateData.antibiotik_ke = parseInt(data.ke)
      if (data.efek_samping !== undefined) updateData.efek_samping = data.efek_samping
      if (data.catatan_ipcn !== undefined) updateData.catatan_ipcn = data.catatan_ipcn
      if (data.rekomendasi_ipcn !== undefined) updateData.rekomendasi_ipcn = data.rekomendasi_ipcn
      if (isReview) {
      if (role !== "IPCN" && role !== "ADMIN") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
      updateData.tanggal_review = new Date()
      updateData.reviewed_by_id = Number((session.user as any).id)
      
      // Create notification for IPCLN
      await db.notification.create({
        data: {
          type: "ANTIBIOTIK_DIREVIEW",
          category: "antibiotik",
          title: "Review Antibiotik Baru",
          message: `${existing.antibiotik?.nama} pasien ${existing.rawat_inap?.pasien?.nama} telah direview oleh IPCN.`,
          relatedEntityType: "PenggunaanAntibiotik",
          relatedEntityId: existing.id,
          pasienId: existing.rawat_inap?.pasien_id,
          createdBy: Number((session.user as any).id),
          isRead: false,
        }
      })
    }
      if (data.nama_ab) {
        const abMaster = await db.antibiotik.upsert({
          where: { kode: data.nama_ab.toUpperCase() },
          update: {},
          create: { nama: data.nama_ab, kode: data.nama_ab.toUpperCase(), golongan: "Umum" },
        })
        updateData.antibiotik_id = abMaster.id
      }
    }

    const updated = await db.$transaction(async (tx) => {
      // Update the record
      const record = await tx.penggunaanAntibiotik.update({
        where: { id: recordId },
        data: updateData,
      })

      // Manage notifications based on new state
      if (isMarkComplete) {
        // Mark all related notifications as read or delete them
        await tx.notification.updateMany({
          where: {
            relatedEntityType: "PenggunaanAntibiotik",
            relatedEntityId: recordId,
            isRead: false,
          },
          data: {
            isRead: true,
            readAt: new Date(),
          },
        })
      }

      if (isReview) {
        // Mark any "PERLU_REVIEW" type notifications as read
        await tx.notification.updateMany({
          where: {
            relatedEntityType: "PenggunaanAntibiotik",
            relatedEntityId: recordId,
            type: { in: ["ANTIBIOTIK_PERLU_REVIEW", "ANTIBIOTIK_OVERDUE"] },
            isRead: false,
          },
          data: {
            isRead: true,
            readAt: new Date(),
          },
        })
      }

      return record
    })

    // ── Build audit trail with meaningful before/after values ────────────────
    let auditAction: string
    let previousValue: string
    let newValue: string
    let auditField: string

    if (isMarkComplete) {
      auditAction = "ANTIBIOTIK_SELESAI"
      auditField = "tanggal_selesai"
      previousValue = "Terapi masih aktif"
      newValue = `Terapi ditandai selesai pada ${new Date().toLocaleDateString("id-ID")}`
    } else if (isReview) {
      auditAction = "ANTIBIOTIK_REVIEW"
      auditField = "review"
      previousValue = JSON.stringify({
        catatan_ipcn: (existing as any).catatan_ipcn || null,
        rekomendasi_ipcn: (existing as any).rekomendasi_ipcn || null,
        tanggal_review: (existing as any).tanggal_review
          ? new Date((existing as any).tanggal_review).toISOString().split("T")[0]
          : null,
      })
      newValue = JSON.stringify({
        catatan_ipcn: data.catatan_ipcn || null,
        rekomendasi_ipcn: data.rekomendasi_ipcn || null,
        tanggal_review: new Date().toISOString().split("T")[0],
      })
    } else {
      // Generic update — record each changed field with old → new
      auditAction = "ANTIBIOTIK_UPDATE"
      auditField = "update"

      const prevSnapshot: Record<string, any> = {}
      const newSnapshot: Record<string, any> = {}

      if (data.dosis && data.dosis !== (existing as any).dosis) {
        prevSnapshot.dosis = (existing as any).dosis
        newSnapshot.dosis = data.dosis
      }
      if (data.rute && data.rute !== (existing as any).rute) {
        prevSnapshot.rute = (existing as any).rute
        newSnapshot.rute = data.rute
      }
      if (data.tgl_mulai) {
        const prevDate = new Date((existing as any).tanggal_mulai).toISOString().split("T")[0]
        if (data.tgl_mulai !== prevDate) {
          prevSnapshot.tgl_mulai = prevDate
          newSnapshot.tgl_mulai = data.tgl_mulai
        }
      }
      if (data.tgl_selesai !== undefined) {
        const prevTglSelesai = (existing as any).tanggal_rencana_selesai
          ? new Date((existing as any).tanggal_rencana_selesai).toISOString().split("T")[0]
          : null
        if (data.tgl_selesai !== prevTglSelesai) {
          prevSnapshot.tgl_selesai = prevTglSelesai
          newSnapshot.tgl_selesai = data.tgl_selesai || null
        }
      }
      if (data.efek_samping !== undefined && data.efek_samping !== (existing as any).efek_samping) {
        prevSnapshot.efek_samping = (existing as any).efek_samping
        newSnapshot.efek_samping = data.efek_samping
      }
      if (data.nama_ab && data.nama_ab !== (existing as any).antibiotik?.nama) {
        prevSnapshot.antibiotik = (existing as any).antibiotik?.nama
        newSnapshot.antibiotik = data.nama_ab
      }
      if (data.ke && parseInt(data.ke) !== (existing as any).antibiotik_ke) {
        prevSnapshot.ke = (existing as any).antibiotik_ke
        newSnapshot.ke = data.ke
      }

      previousValue =
        Object.keys(prevSnapshot).length > 0 ? JSON.stringify(prevSnapshot) : "Tidak ada perubahan terdeteksi"
      newValue =
        Object.keys(newSnapshot).length > 0 ? JSON.stringify(newSnapshot) : "Tidak ada perubahan terdeteksi"
    }

    await db.auditTrail.create({
      data: buildAuditTrailEntry({
        action: auditAction,
        moduleName: "antibiotik",
        userId: parseInt((session.user as any).id),
        userName: (session.user as any).name || "User",
        entityType: "PenggunaanAntibiotik",
        entityId: recordId,
        field: auditField,
        previousValue,
        newValue,
        ipAddress: null,
        timestamp: new Date(),
      }),
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// ─── DELETE ──────────────────────────────────────────────────────────────────

export async function DELETE(req: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const url = new URL(req.url)
    const id = url.searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 })
    }

    // Load before delete so we can log what was removed
    const existing = await db.penggunaanAntibiotik.findUnique({
      where: { id: parseInt(id) },
      include: { antibiotik: true, rawat_inap: { include: { pasien: true } } },
    })

    await db.$transaction(async (tx) => {
      // First delete all related notifications
      await tx.notification.deleteMany({
        where: {
          relatedEntityType: "PenggunaanAntibiotik",
          relatedEntityId: parseInt(id),
        },
      })
      // Then delete the record
      await tx.penggunaanAntibiotik.delete({
        where: { id: parseInt(id) },
      })
    })

    // Audit trail — DELETE
    if (existing) {
      await db.auditTrail.create({
        data: buildAuditTrailEntry({
          action: "ANTIBIOTIK_DELETE",
          moduleName: "antibiotik",
          userId: parseInt((session.user as any).id),
          userName: (session.user as any).name || "User",
          entityType: "PenggunaanAntibiotik",
          entityId: parseInt(id),
          field: null,
          previousValue: JSON.stringify({
            antibiotik: (existing as any).antibiotik?.nama,
            pasien: (existing as any).rawat_inap?.pasien?.nama,
            dosis: (existing as any).dosis,
            tgl_mulai: new Date((existing as any).tanggal_mulai).toISOString().split("T")[0],
          }),
          newValue: "Record dihapus",
          ipAddress: null,
          timestamp: new Date(),
        }),
      })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
