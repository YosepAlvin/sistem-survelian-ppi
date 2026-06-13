import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function GET() {
  try {
    const session = await auth()
    
    // If no session, return empty stats
    if (!session) {
      return NextResponse.json({
        pasienAktif: 0,
        kejadianInfeksi: 0,
        tindakanOperasi: 0,
        antibiotics: {
          aktif: 0,
          akanSelesai: 0,
          overdue: 0,
          perluReview: 0,
          selesai: 0
        }
      })
    }

    const sessionUser = session.user as any
    let ruanganId = sessionUser?.ruanganId ? parseInt(String(sessionUser.ruanganId), 10) : null

    if (!ruanganId && sessionUser?.id) {
      const user = await db.user.findUnique({
        where: { id: parseInt(sessionUser.id, 10) },
        select: { ruanganId: true },
      })
      ruanganId = user?.ruanganId ? parseInt(String(user.ruanganId), 10) : null
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all antibiotic records with relationships
    const allAntibiotics = await db.penggunaanAntibiotik.findMany({
      where: {
        rawat_inap: {
          ruangan_id: ruanganId ? ruanganId : undefined
        }
      },
      include: {
        antibiotik: true,
        rawat_inap: true
      }
    });

    // Calculate each status
    let aktif = 0;
    let akanSelesai = 0;
    let overdue = 0;
    let perluReview = 0;
    let selesai = 0;

    allAntibiotics.forEach((ab: any) => {
      const startDate = new Date(ab.tanggal_mulai);
      startDate.setHours(0, 0, 0, 0);
      
      let hariKe = 1 + Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
      hariKe = Math.max(1, Math.floor(hariKe));

      let alasanReview: string[] = [];

      if (ab.tanggal_selesai) {
        selesai++;
        return;
      }

      // Check restriksi
      if (ab.antibiotik.is_restriksi) alasanReview.push('Antibiotik Restriksi');
      
      // Check due date
      if (ab.tanggal_selesai) {
        const selesaiDate = new Date(ab.tanggal_selesai);
        selesaiDate.setHours(0,0,0,0);
        const daysUntil = Math.ceil((selesaiDate.getTime() - today.getTime())/(1000*60*60*24));
        if (daysUntil < 0) {
          overdue++;
          alasanReview.push('Overdue');
        } else if (daysUntil <= 2) {
          akanSelesai++;
        } else {
          aktif++;
        }
      } else {
        aktif++;
      }

      // Durasi melebihi batas
      const durasiMaks = ab.antibiotik.durasi_maks_hari || 7;
      if (hariKe > durasiMaks) alasanReview.push(`Durasi > ${durasiMaks} hari');
      
      if (ab.efek_samping) alasanReview.push('Efek Samping');

      if (alasanReview.length > 0) {
        perluReview++;
      }
    });

    const counts = await db.$transaction([
      db.rawatInap.count({ 
        where: { 
          status: "AKTIF",
          ruangan_id: ruanganId ? ruanganId : undefined
        } 
      }),
      db.kejadianInfeksi.count({ 
        where: { 
          status: { not: "SELESAI" },
          rawat_inap: { 
            ruangan_id: ruanganId ? ruanganId : undefined
          } 
        } 
      ),
      db.operasi.count({
        where: {
          rawat_inap: {
            ruangan_id: ruanganId ? ruanganId : undefined
          }
        }
      })
    ]);

    return NextResponse.json({
      pasienAktif: counts[0],
      kejadianInfeksi: counts[1],
      tindakanOperasi: counts[2],
      antibiotics: {
        aktif,
        akanSelesai,
        overdue,
        perluReview,
        selesai
      }
    });
  } catch (error: any) {
    console.error("Error fetching IPCLN stats:", error);
    return NextResponse.json({
      pasienAktif: 0,
      kejadianInfeksi: 0,
      tindakanOperasi: 0,
      antibiotics: {
        aktif: 0,
        akanSelesai: 0,
        overdue: 0,
        perluReview: 0,
        selesai:0
      }
    });
  }
}
