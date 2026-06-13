import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

// GET: Daftar transfer (untuk IPCN melihat permintaan)
export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const transfers = await (db as any).transferHistory.findMany({
      include: {
        rawat_inap: {
          include: { pasien: true }
        },
        ruangan_asal: true,
        ruangan_tujuan: true,
        requested_by: true,
        verified_by: true,
        dokter_baru: true
      },
      orderBy: { created_at: 'desc' }
    });

    return NextResponse.json(transfers);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Inisiasi transfer oleh IPCLN
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { rawat_inap_id, ruangan_tujuan_id, tanggal_transfer, alasan, dokter_baru_id } = await req.json();

    // Ambil data rawat inap untuk mendapatkan ruangan asal
    const rawatInap = await db.rawatInap.findUnique({
      where: { id: rawat_inap_id }
    });

    if (!rawatInap) {
      return NextResponse.json({ error: "Rawat inap tidak ditemukan" }, { status: 404 });
    }

    // Validasi ruangan tujuan tidak sama dengan asal
    if (rawatInap.ruangan_id === ruangan_tujuan_id) {
      return NextResponse.json({ error: "Ruangan tujuan tidak boleh sama dengan ruangan asal" }, { status: 400 });
    }

    // Buat transfer history
    const transfer = await (db as any).transferHistory.create({
      data: {
        rawat_inap_id,
        ruangan_asal_id: rawatInap.ruangan_id,
        ruangan_tujuan_id,
        tanggal_transfer: new Date(tanggal_transfer),
        alasan,
        dokter_baru_id: dokter_baru_id || null,
        requested_by_id: parseInt((session.user as any).id),
        status: 'PENDING'
      },
      include: {
        rawat_inap: { include: { pasien: true } },
        ruangan_asal: true,
        ruangan_tujuan: true
      }
    });

    // Buat notifikasi untuk IPCN
    await db.notification.create({
      data: {
        type: 'TRANSFER_REQUEST',
        category: 'PPI',
        title: 'Permintaan Transfer Pasien',
        message: `Permintaan transfer pasien ${transfer.rawat_inap.pasien.nama} dari ${transfer.ruangan_asal.nama} ke ${transfer.ruangan_tujuan.nama}`,
        relatedEntityType: 'TRANSFER',
        relatedEntityId: transfer.id
      }
    });

    return NextResponse.json({ success: true, data: transfer });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
