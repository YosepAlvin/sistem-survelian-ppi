import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import { buildAuditTrailEntry } from "@/lib/audit-trail"

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
        where: role === 'IPCLN' && ruanganId ? {
          rawat_inap: { ruangan_id: parseInt(ruanganId) }
        } : {},
        include: {
          rawat_inap: {
            include: {
              pasien: true,
              ruangan: true,
              dokter: true,
            }
          },
          antibiotik: true
        },
        orderBy: { tanggal_mulai: "desc" }
      }),
      db.antibiotik.findMany({
        orderBy: { nama: "asc" }
      })
    ])

    const formatted = antibiotics.map((ab: any) => {
      const today = new Date();
      today.setHours(0,0,0,0);
      const startDate = new Date(ab.tanggal_mulai);
      startDate.setHours(0,0,0,0);
      
      let hari_ke = 1 + Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      hari_ke = Math.max(1, hari_ke);
      hari_ke = Math.floor(hari_ke);

      let status = 'AKTIF';
      let alasan_review: string[] = [];

      if (ab.tanggal_selesai) {
        status = 'SELESAI';
      } else {
        if (ab.antibiotik.is_restriksi) alasan_review.push('Antibiotik Restriksi');
        
        let selesaiDate = ab.tanggal_selesai ? new Date(ab.tanggal_selesai) : null;
        if (selesaiDate) {
          selesaiDate.setHours(0,0,0,0);
          const daysToSelesai = Math.ceil((selesaiDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          if (daysToSelesai < 0) {
            status = 'OVERDUE';
            alasan_review.push('Overdue');
          } else if (daysToSelesai <= 2) status = 'AKAN_SELESAI';
        }
        
        const durasiMaks = ab.antibiotik.durasi_maks_hari ||7;
        if (hari_ke > durasiMaks) alasan_review.push(`Durasi > ${durasiMaks} hari`);

        if (ab.efek_samping) alasan_review.push('Efek Samping');

        if (alasan_review.length >0 && status !== 'OVERDUE') {
          status = 'PERLU_REVIEW';
        }
      }

      return {
        id: ab.id.toString(),
        pasien: ab.rawat_inap.pasien.nama,
        no_rm: ab.rawat_inap.pasien.no_rm,
        ruangan: ab.rawat_inap.ruangan?.nama || "-",
        nama_ab: ab.antibiotik.nama,
        antibiotik_id: ab.antibiotik_id,
        dosis: ab.dosis || "-",
        rute: ab.rute || "-",
        tgl_mulai: ab.tanggal_mulai.toISOString().split('T')[0],
        tgl_selesai: ab.tanggal_selesai ? ab.tanggal_selesai.toISOString().split('T')[0] : "-",
        ke: ab.antibiotik_ke ||1,
        hari_ke: hari_ke,
        status: status,
        alasan_review: alasan_review,
        is_restriksi: ab.antibiotik.is_restriksi,
        efek_samping: ab.efek_samping,
        catatan_ipcn: ab.catatan_ipcn,
        rekomendasi_ipcn: ab.rekomendasi_ipcn,
        tanggal_review: ab.tanggal_review?.toISOString().split('T')[0],
        dokter: ab.rawat_inap.dokter?.nama
      };
    });

    const stats = {
      total: formatted.length,
      aktif: formatted.filter(ab => ab.status === 'AKTIF').length,
      akan_selesai: formatted.filter(ab => ab.status === 'AKAN_SELESAI').length,
      overdue: formatted.filter(ab => ab.status === 'OVERDUE').length,
      perlu_review: formatted.filter(ab => ab.status === 'PERLU_REVIEW' || ab.status === 'OVERDUE').length,
      selesai: formatted.filter(ab => ab.status === 'SELESAI').length
    };

    return NextResponse.json({
      penggunaan: formatted,
      master: masterAntibiotics,
      stats: stats
    })
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
      let pasien = await tx.pasien.findUnique({
        where: { no_rm: data.no_rm }
      })

      if (!pasien) {
        pasien = await tx.pasien.create({
          data: {
            no_rm: data.no_rm,
            nama: data.pasien,
            tanggal_lahir: new Date(),
            usia: 0,
            jenis_kelamin: "Laki-laki"
          }
        })
      }

      let rawatInap = await tx.rawatInap.findFirst({
        where: {
          pasien_id: pasien.id,
          status: "AKTIF"
        }
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
            status: "AKTIF"
          }
        })
      }

      const abMaster = await tx.antibiotik.upsert({
        where: { kode: data.nama_ab.toUpperCase() },
        update: {},
        create: {
          nama: data.nama_ab,
          kode: data.nama_ab.toUpperCase(),
          golongan: "Umum"
        }
      })

      const penggunaan = await tx.penggunaanAntibiotik.create({
        data: {
          rawat_inap_id: rawatInap.id,
          antibiotik_id: abMaster.id,
          tanggal_mulai: new Date(data.tgl_mulai),
          tanggal_selesai: data.tgl_selesai && data.tgl_selesai !== "-" ? new Date(data.tgl_selesai) : null,
          dosis: data.dosis,
          rute: data.rute || "IV",
          antibiotik_ke: parseInt(data.ke),
          efek_samping: data.efek_samping || null
        } as any
      })

      // Audit trail: CREATE
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
          newValue: `${data.nama_ab} | Dosis: ${data.dosis} | Mulai: ${data.tgl_mulai}`,
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

    const isMarkComplete = data.markComplete === true
    const updateData: any = {}

    if (isMarkComplete) {
      updateData.tanggal_selesai = new Date()
    } else {
      if (data.tgl_mulai) updateData.tanggal_mulai = new Date(data.tgl_mulai)
      if (data.tgl_selesai && data.tgl_selesai !== "-") {
        updateData.tanggal_selesai = new Date(data.tgl_selesai)
      } else if (data.tgl_selesai === "-") {
          updateData.tanggal_selesai = null
        }
      if (data.dosis) updateData.dosis = data.dosis
      if (data.rute) updateData.rute = data.rute
      if (data.ke) updateData.antibiotik_ke = parseInt(data.ke)
      if (data.efek_samping !== undefined) updateData.efek_samping = data.efek_samping
      if (data.catatan_ipcn !== undefined) updateData.catatan_ipcn = data.catatan_ipcn
      if (data.rekomendasi_ipcn !== undefined) updateData.rekomendasi_ipcn = data.rekomendasi_ipcn
      if (data.is_review === true) {
        updateData.tanggal_review = new Date()
        updateData.reviewed_by_id = (session.user as any).id
      }
      if (data.nama_ab) {
        const abMaster = await db.antibiotik.upsert({
          where: { kode: data.nama_ab.toUpperCase() },
          update: {},
          create: {
            nama: data.nama_ab,
            kode: data.nama_ab.toUpperCase(),
            golongan: "Umum"
          }
        })
        updateData.antibiotik_id = abMaster.id
      }
    }

    const updated = await db.penggunaanAntibiotik.update({
      where: { id: parseInt(data.id) },
      data: updateData
    })

    // Audit trail untuk berbagai aksi
    let auditAction = "ANTIBIOTIK_UPDATE"
    let auditNewValue = ""
    let auditPrevValue = ""

    if (isMarkComplete) {
      auditAction = "ANTIBIOTIK_SELESAI"
      auditNewValue = `Terapi ditandai selesai pada ${new Date().toLocaleDateString("id-ID")}`
    } else if (data.is_review === true) {
      auditAction = "ANTIBIOTIK_REVIEW"
      auditNewValue = `Catatan: ${data.catatan_ipcn || "-"} | Rekomendasi: ${data.rekomendasi_ipcn || "-"}`
    } else {
      // Update biasa – catat field yang berubah
      const changedFields: string[] = []
      if (data.dosis) changedFields.push(`Dosis: ${data.dosis}`)
      if (data.rute) changedFields.push(`Rute: ${data.rute}`)
      if (data.tgl_mulai) changedFields.push(`Tgl Mulai: ${data.tgl_mulai}`)
      if (data.tgl_selesai) changedFields.push(`Tgl Selesai: ${data.tgl_selesai}`)
      if (data.efek_samping !== undefined) changedFields.push(`Efek Samping: ${data.efek_samping || "-"}`)
      auditNewValue = changedFields.join(" | ") || "Data diperbarui"
    }

    await db.auditTrail.create({
      data: buildAuditTrailEntry({
        action: auditAction,
        moduleName: "antibiotik",
        userId: parseInt((session.user as any).id),
        userName: (session.user as any).name || "User",
        entityType: "PenggunaanAntibiotik",
        entityId: parseInt(data.id),
        field: isMarkComplete ? "tanggal_selesai" : data.is_review ? "review" : "update",
        previousValue: auditPrevValue || null,
        newValue: auditNewValue,
        ipAddress: null,
        timestamp: new Date(),
      }),
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const url = new URL(req.url)
    const id = url.searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 })
    }

    await db.penggunaanAntibiotik.delete({ where: { id: parseInt(id) } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
