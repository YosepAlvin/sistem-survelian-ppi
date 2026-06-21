import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { getStatusMeta } from "@/lib/reporting"
import { buildAuditTrailEntry } from "@/lib/audit-trail"

export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch kejadianInfeksi (regular infection reports)
    const kejadianReports = await (db.kejadianInfeksi as any).findMany({
      include: {
        rawat_inap: {
          include: {
            pasien: true,
            ruangan: true,
            alat_terpasang: {
              include: { saran: true }
            },
          },
        },
        createdBy: {
          select: {
            name: true,
          },
        },
        verifiedBy: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { tanggal_kejadian: "desc" },
    })

    // Fetch surveilansIdo (IDO reports from operasi)
    const idoReports = await (db.surveilansIdo as any).findMany({
      include: {
        operasi: {
          include: {
            rawat_inap: {
              include: {
                pasien: true,
                ruangan: true,
                alat_terpasang: {
                  include: { saran: true }
                },
              },
            }
          },
        },
        createdBy: {
          select: {
            name: true,
          },
        },
        verifiedBy: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { id: "desc" },
    })

    const allRawatInapIds = Array.from(new Set([
      ...kejadianReports.map((r: any) => r.rawat_inap_id),
      ...idoReports.map((r: any) => r.operasi.rawat_inap_id),
    ]))
    const infectionEvents = allRawatInapIds.length > 0
      ? await (db.kejadianInfeksi as any).findMany({
          where: { rawat_inap_id: { in: allRawatInapIds } },
          include: {
            createdBy: { select: { name: true } },
            verifiedBy: { select: { name: true } },
          },
          orderBy: { tanggal_kejadian: "asc" },
        })
      : []

    const userIds = Array.from(new Set([
      ...kejadianReports.map((r: any) => r.created_by).filter(Boolean),
      ...kejadianReports.map((r: any) => r.updated_by).filter(Boolean),
      ...kejadianReports.map((r: any) => r.verified_by).filter(Boolean),
      ...idoReports.map((r: any) => r.created_by).filter(Boolean),
      ...idoReports.map((r: any) => r.verified_by).filter(Boolean),
    ] as number[]))

    const users = userIds.length > 0
      ? await db.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, name: true },
        })
      : []

    const userMap = new Map(users.map((user) => [user.id, user.name]))

    // Format kejadian infeksi reports
    const formattedKejadian = kejadianReports.map((r: any) => {
      const statusMeta = getStatusMeta(r.status_verifikasi)
      const admissionDate = new Date(r.rawat_inap.tanggal_masuk)
      const today = new Date()
      const lamaRawatHari = Math.max(1, Math.floor((today.getTime() - admissionDate.getTime()) / 86400000) + 1)

      const riwayatInfeksi = infectionEvents
        .filter((event: any) => event.rawat_inap_id === r.rawat_inap_id)
        .map((event: any) => ({
          jenis_infeksi: event.jenis_infeksi,
          tanggal_kejadian: event.tanggal_kejadian.toISOString(),
          tanggal_selesai: event.tanggal_selesai?.toISOString() ?? null,
          hari_ke: event.hari_ke ?? null,
          status: event.status,
          catatan: event.catatan ?? "-",
        }))

      const alatTerpasang = (r.rawat_inap.alat_terpasang || [])
        .map((device: any) => ({
          id: device.id,
          jenis_alat: device.jenis_alat,
          tanggal_pasang: device.tanggal_pasang?.toISOString() ?? null,
          tanggal_lepas: device.tanggal_lepas?.toISOString() ?? null,
          masih_terpasang: Boolean(device.masih_terpasang),
          device_day: device.device_day ?? 0,
          saran: device.saran,
        }))

      return {
        id: r.id.toString(),
        entityType: 'KejadianInfeksi',
        rawat_inap_id: r.rawat_inap_id,
        tanggal: r.tanggal_kejadian.toISOString().split("T")[0],
        tanggalKejadian: r.tanggal_kejadian.toISOString(),
        ruangan: r.rawat_inap.ruangan.nama,
        pasien: r.rawat_inap.pasien.nama,
        no_rm: r.rawat_inap.pasien.no_rm,
        jenis_infeksi: r.jenis_infeksi,
        detail: r.catatan || "-",
        hariKe: r.hari_ke ?? null,
        sumberInfeksi: r.sumber_infeksi ?? null,
        status: r.status_verifikasi,
        statusLabel: statusMeta.label,
        statusTone: statusMeta.tone,
        caseStatus: r.status,
        caseStatusLabel: r.status,
        createdAt: r.created_at?.toISOString() ?? null,
        updatedAt: r.updated_at?.toISOString() ?? null,
        verifiedAt: r.verified_at?.toISOString() ?? null,
        createdBy: r.createdBy?.name ?? userMap.get(r.created_by as number) ?? null,
        verifiedBy: r.verifiedBy?.name ?? userMap.get(r.verified_by as number) ?? null,
        updatedBy: userMap.get(r.updated_by as number) ?? null,
        tanggal_masuk: r.rawat_inap.tanggal_masuk.toISOString(),
        lama_rawat_hari: lamaRawatHari,
        alat_terpasang: alatTerpasang,
        riwayat_infeksi: riwayatInfeksi,
        audit_trail: {
          dibuat_oleh: userMap.get(r.created_by as number) ?? r.createdBy?.name ?? null,
          dibuat_pada: r.created_at?.toISOString() ?? null,
          diubah_oleh: userMap.get(r.updated_by as number) ?? null,
          diubah_pada: r.updated_at?.toISOString() ?? null,
          diverifikasi_oleh: userMap.get(r.verified_by as number) ?? r.verifiedBy?.name ?? null,
          diverifikasi_pada: r.verified_at?.toISOString() ?? null,
        },
        summary: `${r.jenis_infeksi} • ${r.rawat_inap.ruangan.nama} • Hari ${r.hari_ke ?? '-'}`,
      }
    })

    // Format SurveilansIdo reports
    const formattedIdo = idoReports.map((r: any) => {
      const statusMeta = getStatusMeta(r.status_verifikasi)
      const admissionDate = new Date(r.operasi.rawat_inap.tanggal_masuk)
      const today = new Date()
      const lamaRawatHari = Math.max(1, Math.floor((today.getTime() - admissionDate.getTime()) / 86400000) + 1)

      const riwayatInfeksi = infectionEvents
        .filter((event: any) => event.rawat_inap_id === r.operasi.rawat_inap_id)
        .map((event: any) => ({
          jenis_infeksi: event.jenis_infeksi,
          tanggal_kejadian: event.tanggal_kejadian.toISOString(),
          tanggal_selesai: event.tanggal_selesai?.toISOString() ?? null,
          hari_ke: event.hari_ke ?? null,
          status: event.status,
          catatan: event.catatan ?? "-",
        }))

      const alatTerpasang = (r.operasi.rawat_inap.alat_terpasang || [])
        .map((device: any) => ({
          id: device.id,
          jenis_alat: device.jenis_alat,
          tanggal_pasang: device.tanggal_pasang?.toISOString() ?? null,
          tanggal_lepas: device.tanggal_lepas?.toISOString() ?? null,
          masih_terpasang: Boolean(device.masih_terpasang),
          device_day: device.device_day ?? 0,
          saran: device.saran,
        }))

      return {
        id: r.id.toString(),
        entityType: 'SurveilansIdo',
        rawat_inap_id: r.operasi.rawat_inap_id,
        tanggal: r.tanggal_infeksi ? r.tanggal_infeksi.toISOString().split("T")[0] : "-",
        tanggalKejadian: r.tanggal_infeksi ? r.tanggal_infeksi.toISOString() : null,
        ruangan: r.operasi.rawat_inap.ruangan.nama,
        pasien: r.operasi.rawat_inap.pasien.nama,
        no_rm: r.operasi.rawat_inap.pasien.no_rm,
        jenis_infeksi: 'IDO',
        detail: r.hasil_kultur || `Jenis pus: ${r.jenis_pus || "-"}, Antibiotik: ${r.ada_antibiotik ? "Ya" : "Tidak"}`,
        hariKe: null,
        sumberInfeksi: null,
        status: r.status_verifikasi,
        statusLabel: statusMeta.label,
        statusTone: statusMeta.tone,
        caseStatus: r.status,
        caseStatusLabel: r.status,
        createdAt: null, // surveilansIdo doesn't have created_at
        updatedAt: null,
        verifiedAt: r.verified_at?.toISOString() ?? null,
        createdBy: r.createdBy?.name ?? userMap.get(r.created_by as number) ?? null,
        verifiedBy: r.verifiedBy?.name ?? userMap.get(r.verified_by as number) ?? null,
        updatedBy: null,
        tanggal_masuk: r.operasi.rawat_inap.tanggal_masuk.toISOString(),
        lama_rawat_hari: lamaRawatHari,
        alat_terpasang: alatTerpasang,
        riwayat_infeksi: riwayatInfeksi,
        audit_trail: {
          dibuat_oleh: userMap.get(r.created_by as number) ?? r.createdBy?.name ?? null,
          dibuat_pada: null,
          diubah_oleh: null,
          diubah_pada: null,
          diverifikasi_oleh: userMap.get(r.verified_by as number) ?? r.verifiedBy?.name ?? null,
          diverifikasi_pada: r.verified_at?.toISOString() ?? null,
        },
        summary: `IDO • ${r.operasi.rawat_inap.ruangan.nama}`,
      }
    })

    // Combine both lists and sort by date (newest first)
    const allReports = [...formattedKejadian, ...formattedIdo].sort((a, b) => {
      const dateA = a.tanggalKejadian ? new Date(a.tanggalKejadian).getTime() : 0;
      const dateB = b.tanggalKejadian ? new Date(b.tanggalKejadian).getTime() : 0;
      return dateB - dateA; // newest first
    });

    return NextResponse.json(allReports)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth()
    if (!session || (session.user as any).role !== "IPCN") {
      return NextResponse.json({ error: "Unauthorized. IPCN role required." }, { status: 401 })
    }

    const { id, status, reason, entityType = 'KejadianInfeksi', action } = await req.json() // action: 'VERIFY', 'REJECT', 'CLOSE_CASE'
    const userId = parseInt((session.user as any).id)
    const userName = (session.user as any).name || 'IPCN'

    let updated: any;
    let previousStatus: string | null | undefined;
    const today = new Date()
    let notifTitle: string = "";
    let notifMessage: string = "";
    let relatedRawatInapId: number | null = null;
    let pasienIdForNotification: number | null = null;

    // Wrap everything in a transaction!
    updated = await db.$transaction(async (tx) => {
      if (entityType === 'SurveilansHarian') {
        const existing = await tx.surveilansHarian.findUnique({ 
          where: { id: parseInt(id) },
          include: { rawat_inap: { include: { pasien: true } } }
        })
        previousStatus = (existing as any)?.status
        const updateResult = await (tx.surveilansHarian as any).update({
          where: { id: parseInt(id) },
          data: {
            status: status, // VERIFIED, REVISI
            catatan_revisi: status === 'REVISI' ? reason : undefined,
            verified_by: userId,
            verified_at: today,
          },
        })
        relatedRawatInapId = (existing as any)?.rawat_inap_id;
        pasienIdForNotification = (existing as any)?.rawat_inap?.pasien_id ?? null;
        if (status === 'VERIFIED') {
          notifTitle = "Surveilans Harian Terverifikasi";
          notifMessage = `Surveilans harian pasien ${(existing as any).rawat_inap.pasien.nama} telah diverifikasi.`;
        } else if (status === 'REVISI') {
          notifTitle = "Surveilans Harian Perlu Direvisi";
          notifMessage = `Surveilans harian pasien ${(existing as any).rawat_inap.pasien.nama} perlu direvisi: ${reason}`;
        }
        return updateResult;
      } else if (entityType === 'SurveilansIdo') {
        const existing = await (tx.surveilansIdo as any).findUnique({ 
          where: { id: parseInt(id) },
          include: { operasi: { include: { rawat_inap: { include: { pasien: true } } } } }
        })
        previousStatus = existing?.status_verifikasi
        relatedRawatInapId = existing?.operasi.rawat_inap_id;
        pasienIdForNotification = existing?.operasi.rawat_inap?.pasien_id ?? null;

        const updateData: any = {}

        if (action === 'VERIFY') {
          updateData.status_verifikasi = 'VERIFIED'
          updateData.verified_by = userId
          updateData.verified_at = today
          notifTitle = "Laporan IDO Terverifikasi";
          notifMessage = `Laporan IDO pasien ${existing.operasi.rawat_inap.pasien.nama} telah diverifikasi.`;
        } else if (action === 'REJECT') {
          updateData.status_verifikasi = 'REJECTED'
          updateData.verified_by = userId
          updateData.verified_at = today
          notifTitle = "Laporan IDO Perlu Direvisi";
          notifMessage = `Laporan IDO pasien ${existing.operasi.rawat_inap.pasien.nama} perlu direvisi: ${reason}`;
        } else if (action === 'CLOSE_CASE') {
          updateData.status = 'SELESAI'
          updateData.tanggal_selesai = today
          updateData.updated_by = userId
          notifTitle = "Kasus IDO Ditutup";
          notifMessage = `Kasus IDO pasien ${existing.operasi.rawat_inap.pasien.nama} telah ditutup (sembuh).`;
          
          // Also create audit trail for CLOSE_CASE
          const auditEntry = buildAuditTrailEntry({
            action: 'CLOSE_CASE',
            moduleName: 'verifikasi',
            userId: userId,
            userName: userName,
            entityType: 'SurveilansIdo',
            entityId: parseInt(id),
            field: 'status',
            previousValue: existing.status,
            newValue: 'SELESAI',
            ipAddress: null,
            timestamp: today,
          })
          await tx.auditTrail.create({ data: auditEntry })

          // Mark any pending closure notifications as read!
          await tx.notification.updateMany({
            where: {
              relatedEntityType: 'SurveilansIdo',
              relatedEntityId: parseInt(id),
              isRead: false,
              type: {in: ['INFECTION_PENDING_CLOSURE']}
            },
            data: {
              isRead: true,
              readAt: today
            }
          })
        }

        if (action === 'VERIFY' || action === 'REJECT') {
          // Mark pending verification notifications as read!
          await tx.notification.updateMany({
            where: {
              relatedEntityType: 'SurveilansIdo',
              relatedEntityId: parseInt(id),
              isRead: false,
              type: {in: ['PENDING_VERIFICATION']}
            },
            data: {
              isRead: true,
              readAt: today
            }
          })
        }

        const updateResult = await (tx.surveilansIdo as any).update({
          where: { id: parseInt(id) },
          data: updateData,
        })

        return updateResult;
      } else {
        const existing = await tx.kejadianInfeksi.findUnique({ 
          where: { id: parseInt(id) },
          include: { 
            rawat_inap: { include: { pasien: true } }
          }
        })
        previousStatus = (existing as any)?.status_verifikasi
        relatedRawatInapId = (existing as any)?.rawat_inap_id;
        pasienIdForNotification = (existing as any)?.rawat_inap?.pasien_id ?? null;
        
        const updateData: any = {}

        if (action === 'VERIFY') {
          updateData.status_verifikasi = 'VERIFIED'
          updateData.verified_by = userId
          updateData.verified_at = today
          notifTitle = "Laporan Infeksi Terverifikasi";
          notifMessage = `Laporan infeksi ${(existing as any).jenis_infeksi} pasien ${(existing as any).rawat_inap.pasien.nama} telah diverifikasi.`;

          // Mark pending verification notification as read!
          await tx.notification.updateMany({
            where: {
              relatedEntityType: 'KejadianInfeksi',
              relatedEntityId: parseInt(id),
              isRead: false,
              type: 'PENDING_VERIFICATION'
            },
            data: {
              isRead: true,
              readAt: today
            }
          })
        } else if (action === 'REJECT') {
          updateData.status_verifikasi = 'REJECTED'
          updateData.catatan_revisi = reason
          updateData.verified_by = userId
          updateData.verified_at = today
          notifTitle = "Laporan Infeksi Perlu Direvisi";
          notifMessage = `Laporan infeksi ${(existing as any).jenis_infeksi} pasien ${(existing as any).rawat_inap.pasien.nama} perlu direvisi: ${reason}`;

          // Mark pending verification notification as read!
          await tx.notification.updateMany({
            where: {
              relatedEntityType: 'KejadianInfeksi',
              relatedEntityId: parseInt(id),
              isRead: false,
              type: 'PENDING_VERIFICATION'
            },
            data: {
              isRead: true,
              readAt: today
            }
          })
        } else if (action === 'CLOSE_CASE') {
          updateData.status = 'SELESAI'
          updateData.tanggal_selesai = today
          updateData.updated_by = userId
          updateData.updated_at = today
          notifTitle = "Kasus Infeksi Ditutup";
          notifMessage = `Kasus infeksi ${(existing as any).jenis_infeksi} pasien ${(existing as any).rawat_inap.pasien.nama} telah ditutup (sembuh).`;

          // Mark any pending closure notifications as read!
          await tx.notification.updateMany({
            where: {
              relatedEntityType: 'KejadianInfeksi',
              relatedEntityId: parseInt(id),
              isRead: false,
              type: {in: ['INFECTION_PENDING_CLOSURE']}
            },
            data: {
              isRead: true,
              readAt: today
            }
          })
        }

        const updateResult = await (tx.kejadianInfeksi as any).update({
          where: { id: parseInt(id) },
          data: updateData,
        })

        return updateResult;
      }
    })

    const actionType = action === 'CLOSE_CASE' ? 'CLOSE_CASE' : (action === 'VERIFY' ? 'VERIFY_EVENT' : 'REJECT_EVENT')
    const entry = buildAuditTrailEntry({
      action: actionType,
      moduleName: 'verifikasi',
      userId: userId,
      userName: userName,
      entityType: entityType,
      entityId: updated?.id,
      field: action === 'CLOSE_CASE' ? 'case_status' : 'status',
      previousValue: previousStatus,
      newValue: action === 'CLOSE_CASE' ? 'SELESAI' : (action === 'VERIFY' ? 'VERIFIED' : 'REJECTED'),
      ipAddress: null,
      timestamp: today,
    })

    // Create audit trail if not already created for CLOSE_CASE (we did it inside transaction for SurveilansIdo)
    if (!(entityType === 'SurveilansIdo' && action === 'CLOSE_CASE')) {
      await db.auditTrail.create({ 
        data: { 
          ...entry,
          timestamp: entry.timestamp 
        } 
      })
    }

    if (notifTitle && notifMessage) {
      await (db.notification as any).create({
        data: {
          type: 'STATUS_UPDATE',
          category: 'Status Laporan',
          title: notifTitle,
          message: notifMessage,
          relatedEntityType: entityType,
          relatedEntityId: updated?.id,
          kejadianInfeksiId: entityType === 'KejadianInfeksi' ? updated?.id : null,
          pasienId: pasienIdForNotification,
          createdBy: userId
        }
      })
    }

    return NextResponse.json({ success: true, data: updated })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
