import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { applyDailyDeviceSnapshot } from "@/lib/daily-snapshot"
import { applyDailyInfectionEvents, buildInfectionSnapshot, ALLOWED_INFECTION_TYPES, ALLOWED_DEVICE_TYPES, normalizeDeviceName, normalizeInfectionName } from "@/lib/haIs-event-tracking"
import { buildDeviceAlertMessage, shouldTriggerDeviceAlert } from "@/lib/notifications"
import { resolveSurveyDate } from "@/lib/surveilans-date"
import { buildAuditTrailEntry, formatAuditValue } from "@/lib/audit-trail"
import { z } from "zod"
import { hitungDeviceDay } from "@/lib/deviceDay"

// Schema validasi ringkas untuk surveilans harian
const harianSchema = z.object({
  no_rm: z.string().min(1),
  nama_pasien: z.string(),
  ruangan: z.string(),
  suhu: z.string().or(z.number()).optional(),
  infeksi: z.array(z.object({
    ada: z.boolean(),
    jenis: z.string(),
    hari_ke: z.string().or(z.number()).optional(),
    hasil_kultur: z.string().optional()
  })).optional()
}).passthrough()

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    console.log('[POST /api/surveilans-harian] request body:', body);
    
    // Validasi input
    const validation = harianSchema.safeParse(body)
    if (!validation.success) {
      console.error('[POST /api/surveilans-harian] validation failed:', validation.error.errors);
      return NextResponse.json({ 
        success: false, 
        error: "Validation Error", 
        details: validation.error.errors 
      }, { status: 400 })
    }

    const data: any = validation.data
    const userId = session.user && (session.user as any).id ? parseInt((session.user as any).id) : null

    const surveyDate = resolveSurveyDate({
      tanggalSurveilans: data.tanggal_surveilans,
      tanggalMasuk: data.tanggal_masuk,
      now: new Date(),
    })

    const infectionItems = Array.isArray(data.infeksi) ? data.infeksi : []
    const infectionSnapshot = buildInfectionSnapshot(infectionItems)

    // Database Transaction to ensure data integrity
    // Increase timeout to 30s to prevent expiration during complex operations
    const result = await db.$transaction(async (tx) => {
      const recordAudit = async (action: string, entityType: string, entityId: number | null, previousValue: any, newValue: any, field?: string) => {
        const entry = buildAuditTrailEntry({
          action,
          moduleName: 'surveilans',
          userId: userId ?? null,
          userName: (session.user as any)?.name || 'Petugas',
          entityType,
          entityId,
          field: field || null,
          previousValue,
          newValue,
          ipAddress: null,
          timestamp: new Date(),
        })

        return tx.auditTrail.create({ 
          data: { 
            ...entry, 
            timestamp: entry.timestamp 
          } 
        })
      }
      // 1. Cari Pasien berdasarkan No. RM
      let pasien = await tx.pasien.findUnique({
        where: { no_rm: data.no_rm },
      })

      // Jika pasien belum ada, buat baru (opsional, biasanya sudah ada dari registrasi)
      if (!pasien) {
        pasien = await tx.pasien.create({
          data: {
            no_rm: data.no_rm,
            nama: data.nama_pasien,
            tanggal_lahir: new Date(),
            usia: parseInt(data.umur),
            jenis_kelamin: data.jenis_kelamin,
            alamat: data.alamat,
          },
        })
      }

      // 2. Cari apakah ada RawatInap AKTIF untuk pasien ini
      let rawatInap = await tx.rawatInap.findFirst({
        where: {
          pasien_id: pasien.id,
          status: "AKTIF"
        },
        orderBy: { tanggal_masuk: 'desc' }
      })

      // Jika tidak ada rawat inap aktif, baru buat record rawat inap baru
      if (!rawatInap) {
        // Cari Ruangan
      const ruangan = await tx.ruangan.findUnique({
        where: { kode: data.ruangan as string },
      })

      if (!ruangan) {
        throw new Error(`Ruangan dengan kode "${data.ruangan}" tidak ditemukan.`)
      }

      // Cari Dokter default
      const dokter = await tx.dokter.findFirst()

      // Cari Diagnosa
      const diagnosaName = (data.diagnosa_masuk as string) || "Observasi"
      const diagnosa = await tx.diagnosa.upsert({
        where: { kode_icd: diagnosaName.toUpperCase().replace(/\s+/g, '_') },
        update: {},
        create: {
          kode_icd: diagnosaName.toUpperCase().replace(/\s+/g, '_'),
          nama: diagnosaName,
        }
      })

      rawatInap = await tx.rawatInap.create({
        data: {
          pasien_id: pasien.id,
          ruangan_id: ruangan.id,
          dokter_id: dokter?.id || 1,
          diagnosa_id: diagnosa.id,
          tanggal_masuk: new Date(data.tanggal_masuk as string),
          status: "AKTIF",
        }
      })
    }

    const admissionDate = rawatInap.tanggal_masuk
    const dayDifference = Math.floor((surveyDate.getTime() - new Date(admissionDate).getTime()) / 86400000) + 1

    const validationErrors: string[] = []

    if (dayDifference < 1) {
      validationErrors.push("Tanggal surveilans tidak boleh sebelum tanggal masuk pasien")
    }

    if (data.alat_terpasang && Array.isArray(data.alat_terpasang)) {
      for (const device of data.alat_terpasang) {
        if (device?.jenis_alat && !ALLOWED_DEVICE_TYPES.includes(normalizeDeviceName(device.jenis_alat))) {
          validationErrors.push(`Jenis alat tidak valid: ${device.jenis_alat}`)
        }
      }
    }

    for (const item of infectionSnapshot) {
      if (!ALLOWED_INFECTION_TYPES.includes(item.jenis_infeksi)) {
        validationErrors.push(`Jenis infeksi tidak valid: ${item.jenis_infeksi || 'tanpa nama'}`)
        continue
      }

      if (item.ada && item.hari_ke !== null) {
        if (item.hari_ke < 1 || item.hari_ke > dayDifference) {
          validationErrors.push(`Hari perawatan untuk ${item.jenis_infeksi} harus antara 1 dan ${dayDifference}`)
        }
      }
    }

    if (validationErrors.length > 0) {
      throw Object.assign(new Error(`VALIDATION:${validationErrors.join(' | ')}`), { statusCode: 400 })
    }

    // 3. Tambahkan Log Surveilans Harian ke RawatInap tersebut
    const existingLog = await tx.surveilansHarian.findFirst({
      where: {
        rawat_inap_id: rawatInap.id,
        tanggal: {
          gte: new Date(surveyDate.setHours(0, 0, 0, 0)),
          lte: new Date(surveyDate.setHours(23, 59, 59, 999)),
        }
      }
    })

    let dailyLog;
    if (existingLog) {
      // Audit temperature change if any
      if (existingLog.suhu !== (typeof data.suhu === 'string' ? parseFloat(data.suhu) : data.suhu)) {
        const entry = buildAuditTrailEntry({
          action: 'UPDATE_TEMPERATURE',
          moduleName: 'surveilans',
          userId: userId ?? null,
          userName: (session.user as any)?.name || 'Petugas',
          entityType: 'SurveilansHarian',
          entityId: existingLog.id,
          field: 'suhu',
          previousValue: existingLog.suhu,
          newValue: data.suhu,
          ipAddress: null,
          timestamp: new Date(),
        })
        await tx.auditTrail.create({ data: { ...entry } })
      }

      dailyLog = await tx.surveilansHarian.update({
        where: { id: existingLog.id },
        data: {
          suhu: typeof data.suhu === 'string' ? parseFloat(data.suhu) : data.suhu as number,
          ada_infeksi: infectionSnapshot.some((item: any) => item.ada),
          detail_infeksi: JSON.stringify(infectionSnapshot),
          ipcln_id: userId,
          status: existingLog.status === 'VERIFIED' ? 'UNDER_REVIEW' : existingLog.status // If verified and edited, move back to review
        }
      })
    } else {
      dailyLog = await tx.surveilansHarian.create({
        data: {
          rawat_inap_id: rawatInap.id,
          tanggal: surveyDate,
          suhu: typeof data.suhu === 'string' ? parseFloat(data.suhu) : data.suhu as number,
          ada_infeksi: infectionSnapshot.some((item: any) => item.ada),
          detail_infeksi: JSON.stringify(infectionSnapshot),
          ipcln_id: userId,
          status: 'SUBMITTED'
        }
      })
    }

    const defaultThresholds: Record<string, number> = {
      'Vena sentra': 14,
      'CVC': 14,
      'Vena perifer': 7,
      'Arteri': 7,
      'Umbilikai': 7,
      'Urine kateter': 7,
      'Urine Kateter': 7,
      'Suprapubik kateter': 7,
      'Ventilator': 14,
      'ETT': 14,
      'Endotracheal Tube (ETT)': 14,
      'Trakeostomi': 21,
      'NGT': 30,
      'Nasogastric Tube (NGT)': 30,
      'Drain operasi': 14,
      'Chest tube (WSD)': 14,
    }

    // 4. Update/Create Alat Terpasang berdasarkan snapshot harian
    if (data.alat_terpasang && Array.isArray(data.alat_terpasang)) {
      const snapshotResult = await applyDailyDeviceSnapshot({
        tx,
        rawatInapId: rawatInap.id,
        devices: data.alat_terpasang,
        surveyDate,
      })

      // Audit device changes and manage notifications
      for (const updatedDevice of snapshotResult.updated as any[]) {
        // Mark any DEVICE_ALERT for this device as read if it's closed/replaced
        if (updatedDevice._action === 'REPLACED_OLD' || updatedDevice._action === 'CLOSED') {
          await tx.notification.updateMany({
            where: {
              type: 'DEVICE_ALERT',
              relatedEntityType: 'AlatTerpasang',
              relatedEntityId: updatedDevice.id,
              isRead: false,
            },
            data: {
              isRead: true,
              readAt: new Date(),
            },
          })
        }

        if (updatedDevice._action === 'REPLACED_OLD') {
          await recordAudit('REPLACE_DEVICE_OLD', 'AlatTerpasang', updatedDevice.id, { status: 'Terpasang' }, { status: 'Dilepas (Ganti Baru)', tanggal_lepas: surveyDate })
        } else if (updatedDevice._action === 'REPLACED_NEW') {
          await recordAudit('REPLACE_DEVICE_NEW', 'AlatTerpasang', updatedDevice.id, null, { status: 'Terpasang Baru', jenis: updatedDevice.jenis_alat })
        } else if (updatedDevice._action === 'CREATED') {
          await recordAudit('INSTALL_DEVICE', 'AlatTerpasang', updatedDevice.id, null, { status: 'Terpasang', jenis: updatedDevice.jenis_alat })
        } else if (updatedDevice._action === 'CLOSED') {
          await recordAudit('REMOVE_DEVICE', 'AlatTerpasang', updatedDevice.id, { status: 'Terpasang' }, { status: 'Dilepas', tanggal_lepas: surveyDate })
        }
      }

      for (const device of data.alat_terpasang) {
        if (!device?.jenis_alat || !device.terpasang) continue

        const deviceName = normalizeDeviceName(device.jenis_alat)
        const threshold = await tx.deviceThresholdConfig.findUnique({ where: { jenisAlat: deviceName } })
        const configuredThreshold = threshold?.hariThreshold ?? defaultThresholds[deviceName] ?? 0

        const activeDevice = await tx.alatTerpasang.findFirst({
          where: {
            rawat_inap_id: rawatInap.id,
            jenis_alat: deviceName,
            masih_terpasang: true,
          },
          orderBy: { tanggal_pasang: 'desc' },
        })

        // Gunakan device_day dari database, jika tidak ada hitung ulang
        const hariPasang = activeDevice?.device_day ?? hitungDeviceDay(activeDevice?.tanggal_pasang ?? null, null)

        if (!activeDevice || !shouldTriggerDeviceAlert({ jenisAlat: deviceName, hariPasang, threshold: configuredThreshold })) {
          continue
        }

        const existingAlert = await tx.notification.findFirst({
          where: {
            type: 'DEVICE_ALERT',
            relatedEntityType: 'AlatTerpasang',
            relatedEntityId: activeDevice.id,
          },
        })

        if (!existingAlert) {
          const message = buildDeviceAlertMessage({
            jenisAlat: deviceName,
            pasienNama: pasien.nama,
            ruangan: data.ruangan,
            hariPasang,
            threshold: configuredThreshold,
          })

          if (message) {
            await tx.notification.create({
              data: {
                type: 'DEVICE_ALERT',
                category: 'Device Alert',
                title: `${deviceName} melebihi ambang evaluasi`,
                message,
                payload: JSON.stringify({
                  patientName: pasien.nama,
                  noRm: pasien.no_rm,
                  ruangan: data.ruangan,
                  jenisAlat: deviceName,
                  hariPasang,
                }),
                relatedEntityType: 'AlatTerpasang',
                relatedEntityId: activeDevice.id,
                pasienId: pasien.id, // Isi pasienId!
                createdBy: userId ?? null,
              },
            })
          }
        }
      }
    }

    // 5. Kelola kejadian infeksi sebagai event riwayat, bukan sekadar catatan harian
    const activeEvents: Array<{ id: number; jenis_infeksi: string; status: string; tanggal_selesai: Date | null }> = await tx.kejadianInfeksi.findMany({
      where: {
        rawat_inap_id: rawatInap.id,
        status: 'AKTIF',
      },
      select: {
        id: true,
        jenis_infeksi: true,
        status: true,
        tanggal_selesai: true,
      },
    }) as any

    const infectionPlan = (applyDailyInfectionEvents as any)({
      activeEvents: activeEvents as any,
      infections: infectionItems as any,
      surveyDate,
      userId: userId ?? undefined,
      tanggalMasuk: rawatInap.tanggal_masuk,
    })

    for (const eventData of infectionPlan.created) {
      const createdEvent = await tx.kejadianInfeksi.create({
        data: {
          rawat_inap_id: rawatInap.id,
          jenis_infeksi: eventData.jenis_infeksi,
          tanggal_kejadian: eventData.tanggal_kejadian,
          hari_ke: eventData.hari_ke,
          catatan: eventData.catatan,
          status: eventData.status,
          status_verifikasi: 'PENDING',
          created_by: eventData.created_by,
          created_at: new Date(),
          updated_by: eventData.updated_by,
          updated_at: eventData.updated_at,
        },
      })

      await tx.notification.create({
        data: {
          type: 'INFECTION_NEW',
          category: 'Kasus Infeksi Baru',
          title: `Kasus ${createdEvent.jenis_infeksi} baru terdeteksi`,
          message: `Kasus ${createdEvent.jenis_infeksi} baru terdeteksi pada pasien ${pasien.nama} (RM ${pasien.no_rm}) di ${data.ruangan} pada Hari Perawatan ke-${createdEvent.hari_ke ?? '-'}.`,
          payload: JSON.stringify({
            patientName: pasien.nama,
            noRm: pasien.no_rm,
            ruangan: data.ruangan,
            infectionType: createdEvent.jenis_infeksi,
            hariKe: createdEvent.hari_ke,
            tanggalKejadian: createdEvent.tanggal_kejadian.toISOString(),
            petugas: (session.user as any)?.name || 'Petugas',
          }),
          relatedEntityType: 'KejadianInfeksi',
          relatedEntityId: createdEvent.id,
          kejadianInfeksiId: createdEvent.id,
          pasienId: rawatInap.pasien_id,
          createdBy: userId ?? null,
        },
      })

      await recordAudit('CREATE_EVENT', 'KejadianInfeksi', createdEvent.id, null, {
        status: createdEvent.status,
        status_verifikasi: 'PENDING',
        jenis_infeksi: createdEvent.jenis_infeksi,
      })

      await tx.notification.create({
        data: {
          type: 'PENDING_VERIFICATION',
          category: 'Menunggu Verifikasi',
          title: 'Terdapat kasus infeksi baru menunggu verifikasi IPCN',
          message: `Terdapat 1 kasus infeksi baru menunggu verifikasi IPCN untuk ${createdEvent.jenis_infeksi}.`,
          payload: JSON.stringify({
            patientName: pasien.nama,
            noRm: pasien.no_rm,
            ruangan: data.ruangan,
            infectionType: createdEvent.jenis_infeksi,
          }),
          relatedEntityType: 'KejadianInfeksi',
          relatedEntityId: createdEvent.id,
          kejadianInfeksiId: createdEvent.id,
          pasienId: rawatInap.pasien_id,
          createdBy: userId ?? null,
        },
      })

      await recordAudit('NOTIFICATION_SENT', 'Notification', createdEvent.id, null, {
        type: 'PENDING_VERIFICATION',
        infectionType: createdEvent.jenis_infeksi,
      })
    }

    for (const eventData of infectionPlan.updated) {
      const updatedEvent = await tx.kejadianInfeksi.update({
        where: { id: eventData.id },
        data: {
          status: eventData.status,
          tanggal_selesai: eventData.tanggal_selesai,
          updated_by: eventData.updated_by,
          updated_at: eventData.updated_at,
        },
      })

      if (updatedEvent.status === 'PENDING_CLOSURE') {
        await tx.notification.create({
          data: {
            type: 'INFECTION_PENDING_CLOSURE',
            category: 'Menunggu Penutupan Kasus',
            title: `Kasus ${updatedEvent.jenis_infeksi} menunggu penutupan`,
            message: `IPCLN melaporkan kondisi membaik untuk kasus ${updatedEvent.jenis_infeksi} pasien ${pasien.nama}. Menunggu peninjauan IPCN untuk menutup kasus.`,
            payload: JSON.stringify({
              patientName: pasien.nama,
              noRm: pasien.no_rm,
              ruangan: data.ruangan,
              infectionType: updatedEvent.jenis_infeksi,
            }),
            relatedEntityType: 'KejadianInfeksi',
            relatedEntityId: updatedEvent.id,
            kejadianInfeksiId: updatedEvent.id,
            pasienId: rawatInap.pasien_id,
            createdBy: userId ?? null,
          },
        })

        await recordAudit('PENDING_CLOSURE_EVENT', 'KejadianInfeksi', updatedEvent.id, 'AKTIF', 'PENDING_CLOSURE', 'status')
      }

      if (updatedEvent.status === 'SELESAI') {
        await tx.notification.create({
          data: {
            type: 'INFECTION_CLOSED',
            category: 'Infeksi Selesai',
            title: `Kasus ${updatedEvent.jenis_infeksi} pasien ${pasien.nama} telah selesai`,
            message: `Kasus ${updatedEvent.jenis_infeksi} pasien ${pasien.nama} telah dinyatakan selesai oleh ${session.user?.name || 'IPCLN'} pada ${surveyDate.toLocaleDateString('id-ID')}.`,
            payload: JSON.stringify({
              patientName: pasien.nama,
              noRm: pasien.no_rm,
              infectionType: updatedEvent.jenis_infeksi,
              tanggalKejadian: updatedEvent.tanggal_kejadian.toISOString(),
              tanggalSelesai: updatedEvent.tanggal_selesai?.toISOString() || null,
              userName: (session.user as any)?.name || 'IPCLN',
            }),
            relatedEntityType: 'KejadianInfeksi',
            relatedEntityId: updatedEvent.id,
            kejadianInfeksiId: updatedEvent.id,
            pasienId: rawatInap.pasien_id,
            createdBy: userId ?? null,
          },
        })

        await recordAudit('CLOSE_EVENT', 'KejadianInfeksi', updatedEvent.id, { status: 'AKTIF' }, { status: 'SELESAI', tanggal_selesai: updatedEvent.tanggal_selesai?.toISOString() || null })
      }
    }

    await tx.surveilansHarian.update({
      where: { id: dailyLog.id },
      data: {
        ada_infeksi: infectionSnapshot.some((item: any) => item.ada),
        detail_infeksi: JSON.stringify(infectionSnapshot),
      },
    })

    return rawatInap
    }, {
      timeout: 30000 // Set transaction timeout to 30 seconds
    })

    return NextResponse.json({ success: true, data: result })
  } catch (error: any) {
    console.error("API Error Harian:", error)
    if (error?.message?.startsWith("VALIDATION:")) {
      return NextResponse.json({ success: false, error: "Validation Error", details: error.message.replace("VALIDATION:", "").split(" | ") }, { status: 400 })
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
