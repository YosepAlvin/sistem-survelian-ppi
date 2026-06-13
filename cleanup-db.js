const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanup() {
  try {
    console.log("Memulai proses pembersihan database...");

    // 1. Ambil semua pasien untuk identifikasi duplikasi berdasarkan no_rm
    const allPasien = await prisma.pasien.findMany({
      orderBy: { id: 'asc' }
    });

    const uniqueRMs = new Set();
    const duplicatePasienIds = [];
    const rmToMainId = {};

    for (const p of allPasien) {
      if (uniqueRMs.has(p.no_rm)) {
        duplicatePasienIds.push(p.id);
      } else {
        uniqueRMs.add(p.no_rm);
        rmToMainId[p.no_rm] = p.id;
      }
    }

    console.log(`Ditemukan ${duplicatePasienIds.length} pasien duplikat.`);

    // 2. Untuk setiap pasien duplikat, pindahkan relasi ke pasien utama
    for (const dupId of duplicatePasienIds) {
      const dupPasien = allPasien.find(p => p.id === dupId);
      const mainId = rmToMainId[dupPasien.no_rm];

      // Update RawatInap yang merujuk ke pasien duplikat
      await prisma.rawatInap.updateMany({
        where: { pasien_id: dupId },
        data: { pasien_id: mainId }
      });

      // Hapus pasien duplikat
      await prisma.pasien.delete({
        where: { id: dupId }
      });
    }

    // 3. Bersihkan RawatInap duplikat untuk pasien yang sama di hari yang berdekatan (jika ada)
    // Dalam kasus ini, kita biarkan RawatInap yang statusnya AKTIF tetap ada, 
    // tapi jika ada RawatInap duplikat untuk pasien yang sama, kita bisa merger.
    
    console.log("Pembersihan selesai.");
  } catch (e) {
    console.error("Gagal melakukan pembersihan:", e);
  } finally {
    await prisma.$disconnect();
  }
}

cleanup();
