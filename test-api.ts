
import { db } from "./lib/db";
import { calcAntibiotikStatus } from "./lib/antibiotik-status";

async function testAntibiotikAPI() {
  console.log("=== Testing /api/antibiotik logic ===");
  try {
    // Simulate what the API does
    const [antibiotics, masterAntibiotics] = await Promise.all([
      db.penggunaanAntibiotik.findMany({
        where: {},
        include: {
          rawat_inap: {
            include: { pasien: true, ruangan: true, dokter: true },
          },
          antibiotik: true,
        },
        orderBy: { tanggal_mulai: "desc" },
      }),
      db.antibiotik.findMany({ orderBy: { nama: "asc" } }),
    ]);
    console.log("Antibiotics found:", antibiotics.length);
    console.log("Master antibiotics found:", masterAntibiotics.length);

    // Now test the mapping function
    const formatted = await Promise.all(antibiotics.map(async (ab: any) => {
      console.log("Processing ab:", ab.id);
      const { status, hari_ke, alasan_review } = calcAntibiotikStatus(
        ab.tanggal_mulai,
        ab.tanggal_rencana_selesai,
        ab.tanggal_selesai_aktual,
        ab.antibiotik.is_restriksi,
        ab.antibiotik.durasi_maks_hari,
        ab.efek_samping,
        ab.tanggal_review
      );
      console.log("calcAntibiotikStatus done");

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
        tgl_selesai: ab.tanggal_selesai
          ? ab.tanggal_selesai.toISOString().split("T")[0]
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
      };
    }));

    console.log("Formatted antibiotics:", formatted.length);
  } catch (err) {
    console.error("ERROR in /api/antibiotik logic:", err);
  }
}

async function testPasienAPI() {
  console.log("\n=== Testing /api/pasien logic ===");
  try {
    const rawatInap = await db.rawatInap.findMany({
      where: { status: "AKTIF" },
      include: {
        pasien: true,
        ruangan: true,
        diagnosa: true,
        surveilans_harian: { orderBy: { tanggal: "asc" } },
        alat_terpasang: true,
        kejadian_infeksi: true,
      },
      orderBy: { tanggal_masuk: "desc" },
    });

    console.log("Rawat inap found:", rawatInap.length);

    const formatted = await Promise.all(
      rawatInap.map(async (ri: any) => {
        console.log("Processing rawat inap:", ri.id);
        const birthDate = new Date(ri.pasien.tanggal_lahir);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }

        const hasActiveInfection = ri.kejadian_infeksi.some(
          (infeksi: any) => infeksi.status === "AKTIF"
        );
        const hasActiveDevice = ri.alat_terpasang.some(
          (alat: any) => alat.masih_terpasang
        );

        return {
          id: ri.id.toString(),
          no_rm: ri.pasien.no_rm,
          nama: ri.pasien.nama,
          diagnosa: ri.diagnosa.nama,
          tgl_masuk: ri.tanggal_masuk.toISOString().split("T")[0],
          tgl_lahir: ri.pasien.tanggal_lahir.toISOString().split("T")[0],
          umur: age.toString(),
          jk: ri.pasien.jenis_kelamin,
          alamat: ri.pasien.alamat,
          ruangan: ri.ruangan.nama,
          hasActiveInfection,
          hasActiveDevice,
          status_pulang: ri.status_pulang,
          riwayat_surveilans: ri.surveilans_harian.map((sh: any, idx: number) => ({
            hari_ke: idx + 1,
            tanggal: sh.tanggal.toISOString().split("T")[0],
            suhu: sh.suhu,
            infeksi: sh.ada_infeksi ? "Ya" : "Tidak",
          })),
          riwayat_alat: await db.alatTerpasang.findMany({
            where: { rawat_inap_id: ri.id },
            orderBy: { tanggal_pasang: "asc" },
          }),
        };
      })
    );

    console.log("Formatted pasien:", formatted.length);
  } catch (err) {
    console.error("ERROR in /api/pasien logic:", err);
  }
}

async function main() {
  await testAntibiotikAPI();
  await testPasienAPI();
  await db.$disconnect();
}

main().catch(console.error);
