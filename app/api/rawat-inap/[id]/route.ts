import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { buildInitialDeviceSelection, buildDeviceHistoryRows } from "@/lib/daily-snapshot"
import { buildInfectionHistoryRows } from "@/lib/haIs-event-tracking"

export async function GET(
  _req: Request,
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

    const rawatInap = await db.rawatInap.findUnique({
      where: { id: rawatInapId },
      include: {
        pasien: true,
        ruangan: true,
        diagnosa: true,
      },
    })

    if (!rawatInap) {
      return NextResponse.json({ error: "Data rawat inap tidak ditemukan" }, { status: 404 })
    }

    const activeDevices = await (db as any).alatTerpasang.findMany({
      where: { rawat_inap_id: rawatInapId, masih_terpasang: true },
      orderBy: { tanggal_pasang: "desc" },
      include: {
        saran: {
          where: { status: 'PENDING' },
          orderBy: { created_at: 'desc' },
          include: {
            creator: { select: { name: true } },
          }
        }
      },
    })

    const deviceHistory = await db.alatTerpasang.findMany({
      where: { rawat_inap_id: rawatInapId },
      orderBy: [{ tanggal_pasang: "asc" }, { tanggal_lepas: "asc" }],
      select: { jenis_alat: true, tanggal_pasang: true, tanggal_lepas: true, masih_terpasang: true, device_day: true },
    })

    const infectionHistory = await db.kejadianInfeksi.findMany({
      where: { rawat_inap_id: rawatInapId },
      orderBy: [{ tanggal_kejadian: "asc" }, { tanggal_selesai: "asc" }],
      include: {
        createdBy: { select: { name: true } },
      },
    })

    // Fetch latest surveillance for today to support "Reload" functionality
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    const latestSurveilans = await db.surveilansHarian.findFirst({
      where: {
        rawat_inap_id: rawatInapId,
        tanggal: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
      orderBy: { tanggal: 'desc' },
    })

    // Hitung umur dinamis berdasarkan tanggal lahir
    const birthDate = new Date(rawatInap.pasien.tanggal_lahir)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }

    // Parse infection details if available
    let savedInfections: any[] = []
    if (latestSurveilans?.detail_infeksi) {
      try {
        savedInfections = JSON.parse(latestSurveilans.detail_infeksi)
      } catch (e) {
        console.error("Failed to parse detail_infeksi:", e)
      }
    }

    // Format data for the form: combine latest surveilans infeksi and active/pending KejadianInfeksi!
    const activeInfectionsFromHistory = infectionHistory.filter((i: any) => i.status !== 'SELESAI').map((i: any) => ({
      jenis: i.jenis_infeksi,
      ada: true,
      hari_ke: i.hari_ke?.toString() || "",
      hasil_kultur: i.catatan || "",
    }))
    // Merge saved infections from last surveilans, but prefer active infection events from history!
    const mergedInfections = [...activeInfectionsFromHistory, ...savedInfections].reduce((acc, curr) => {
      const existing = acc.find((i: any) => i.jenis === curr.jenis);
      if (!existing) {
        acc.push(curr);
      }
      return acc;
    }, [] as any[]);

    // Map active devices with their saran
    const devicesWithSaran = activeDevices.map((device: any) => ({
      ...device,
      saran: device.saran
    }))

    const formatted = {
      id: rawatInap.id,
      no_rm: rawatInap.pasien.no_rm,
      nama_pasien: rawatInap.pasien.nama,
      umur: age.toString(),
      jenis_kelamin: rawatInap.pasien.jenis_kelamin,
      alamat: rawatInap.pasien.alamat,
      diagnosa_masuk: rawatInap.diagnosa.nama,
      ruangan: rawatInap.ruangan.kode,
      tanggal_masuk: rawatInap.tanggal_masuk.toISOString(),
      suhu: latestSurveilans?.suhu || "",
      infeksi: mergedInfections,
      alat_terpasang: buildInitialDeviceSelection([], activeDevices.map((device: any) => ({
        jenis_alat: device.jenis_alat,
        terpasang: true,
      }))),
      active_devices: devicesWithSaran.map((device: any) => ({
        jenis_alat: device.jenis_alat,
        terpasang: true,
        saran: device.saran?.[0] || null
      })),
      device_history: buildDeviceHistoryRows(deviceHistory),
      infection_history: buildInfectionHistoryRows(infectionHistory),
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
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const rawatInapId = parseInt(id)

    if (isNaN(rawatInapId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 })
    }

    const { action, kondisi_keluar } = await req.json()

    if (action === 'REQUEST_PULANG') {
      // IPCLN request pulang
      const updated = await (db as any).rawatInap.update({
        where: { id: rawatInapId },
        data: {
          status_pulang: 'PENDING',
          requested_pulang_by_id: parseInt((session.user as any).id),
          tanggal_request_pulang: new Date()
        }
      })
      
      // Buat notifikasi untuk IPCN
      const rawatInap = await db.rawatInap.findUnique({
        where: { id: rawatInapId },
        include: { pasien: true, ruangan: true }
      })
      
      if (rawatInap) {
        await db.notification.create({
          data: {
            type: 'DISCHARGE_REQUEST',
            category: 'PPI',
            title: 'Permintaan Pulang Pasien',
            message: `Permintaan pulang untuk pasien ${rawatInap.pasien.nama} (${rawatInap.pasien.no_rm}) di ${rawatInap.ruangan.nama}`,
            relatedEntityType: 'RAWAT_INAP',
            relatedEntityId: rawatInapId
          }
        })
      }
      
      return NextResponse.json({ success: true, data: updated })
    } else if (action === 'VERIFY_PULANG') {
      // IPCN verify pulang
      const updated = await (db as any).rawatInap.update({
        where: { id: rawatInapId },
        data: {
          status: 'PULANG',
          status_pulang: 'VERIFIED',
          verified_pulang_by_id: parseInt((session.user as any).id),
          kondisi_keluar,
          tanggal_keluar: new Date()
        }
      })
      
      return NextResponse.json({ success: true, data: updated })
    } else if (action === 'REJECT_PULANG') {
      // IPCN reject pulang
      const updated = await (db as any).rawatInap.update({
        where: { id: rawatInapId },
        data: {
          status_pulang: 'REJECTED'
        }
      })
      
      return NextResponse.json({ success: true, data: updated })
    } else {
      // Old behavior (for backward compatibility)
      const { status } = await req.json()
      const updated = await db.rawatInap.update({
        where: { id: rawatInapId },
        data: {
          status,
          kondisi_keluar,
          tanggal_keluar: status === 'PULANG' ? new Date() : null
        }
      })
      return NextResponse.json({ success: true, data: updated })
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
