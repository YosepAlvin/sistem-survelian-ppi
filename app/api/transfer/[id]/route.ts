import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

// PUT: Verifikasi atau tolak transfer oleh IPCN
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const transferId = parseInt(id);
    const { action } = await req.json();

    if (isNaN(transferId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    // Ambil data transfer
    const transfer = await (db as any).transferHistory.findUnique({
      where: { id: transferId },
      include: {
        rawat_inap: { include: { pasien: true } },
        ruangan_asal: true,
        ruangan_tujuan: true
      }
    });

    if (!transfer) {
      return NextResponse.json({ error: "Transfer tidak ditemukan" }, { status: 404 });
    }

    if (transfer.status !== 'PENDING') {
      return NextResponse.json({ error: "Transfer sudah diproses" }, { status: 400 });
    }

    if (action === 'VERIFY') {
      // Update transfer dan rawat inap
      const updatedTransfer = await (db as any).transferHistory.update({
        where: { id: transferId },
        data: {
          status: 'COMPLETED',
          verified_by_id: parseInt((session.user as any).id)
        },
        include: {
          rawat_inap: true,
          ruangan_asal: true,
          ruangan_tujuan: true
        }
      });

      // Update ruangan dan dokter di rawat inap
      await db.rawatInap.update({
        where: { id: transfer.rawat_inap_id },
        data: {
          ruangan_id: transfer.ruangan_tujuan_id,
          dokter_id: transfer.dokter_baru_id || transfer.rawat_inap.dokter_id
        }
      });

      // Buat notifikasi
      await db.notification.create({
        data: {
          type: 'TRANSFER_COMPLETED',
          category: 'PPI',
          title: 'Transfer Pasien Berhasil',
          message: `Pasien ${transfer.rawat_inap.pasien.nama} berhasil dipindahkan ke ${transfer.ruangan_tujuan.nama}`,
          relatedEntityType: 'TRANSFER',
          relatedEntityId: transferId
        }
      });

      return NextResponse.json({ success: true, data: updatedTransfer });
    } else if (action === 'REJECT') {
      // Tolak transfer
      const updatedTransfer = await (db as any).transferHistory.update({
        where: { id: transferId },
        data: {
          status: 'REJECTED',
          verified_by_id: parseInt((session.user as any).id)
        }
      });

      // Buat notifikasi
      await db.notification.create({
        data: {
          type: 'TRANSFER_REJECTED',
          category: 'PPI',
          title: 'Transfer Pasien Ditolak',
          message: `Permintaan transfer pasien ${transfer.rawat_inap.pasien.nama} ditolak`,
          relatedEntityType: 'TRANSFER',
          relatedEntityId: transferId
        }
      });

      return NextResponse.json({ success: true, data: updatedTransfer });
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
