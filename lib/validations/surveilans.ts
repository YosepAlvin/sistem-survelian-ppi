import * as z from "zod"

export const surveilansSchema = z.object({
  // Header
  ruangan: z.string().min(1, "Ruangan harus diisi"),
  sumber_dirawat: z.enum(["IGD", "POLI"]),
  tanggal_masuk: z.string().min(1, "Tanggal masuk harus diisi"),
  suhu: z.string().optional(),

  // I. Identitas Pasien
  nama_pasien: z.string().min(1, "Nama pasien harus diisi"),
  no_rm: z.string().min(1, "No. RM harus diisi"),
  umur: z.string().min(1, "Umur harus diisi"),
  jenis_kelamin: z.enum(["L", "P"]),
  alamat: z.string().optional(),

  // II. Diagnosa
  diagnosa_masuk: z.string().min(1, "Diagnosa masuk harus diisi"),

  // III. Pindah Ruangan
  pindah_ruangan: z.array(z.object({
    nama_ruangan: z.string().optional(),
    tanggal: z.string().optional(),
  })).optional(),

  // IV. Faktor Resiko (Alat Terpasang)
  alat_terpasang: z.array(z.object({
    jenis_alat: z.string(),
    lokasi: z.string().optional(),
    catatan: z.string().optional(),
    terpasang: z.boolean().default(false),
    ganti_baru: z.boolean().default(false),
  })).optional(),

  // Faktor Penyakit & Lab
  hbsag: z.enum(["POSITIF", "NEGATIF", "TIDAK_DIPERIKSA"]).optional(),
  anti_hcv: z.enum(["POSITIF", "NEGATIF", "TIDAK_DIPERIKSA"]).optional(),
  anti_hiv: z.enum(["POSITIF", "NEGATIF", "TIDAK_DIPERIKSA"]).optional(),
  leukosit: z.string().optional(),
  led: z.string().optional(),
  gds: z.string().optional(),

  // V. Operasi
  diagnosa_operasi: z.string().optional(),
  operasi: z.array(z.object({
    tanggal: z.string().optional(),
    lama_jam: z.string().optional(),
    lama_menit: z.string().optional(),
    jenis: z.enum(["BERSIH", "BERSIH_TERCEMAR", "TERCEMAR", "KOTOR"]).optional(),
    tindakan: z.enum(["CITO", "ELEKTIF"]).optional(),
    asa_score: z.string().optional(),
  })).optional(),

  // VI. Komplikasi / Infeksi
  infeksi: z.array(z.object({
    jenis: z.string(),
    ada: z.boolean().default(false),
    hari_ke: z.string().optional(),
    hasil_kultur: z.string().optional(),
  })).optional(),
  tirah_baring: z.boolean().default(false),
  decubitus: z.boolean().default(false),

  // VII. Antibiotik
  antibiotik: z.array(z.object({
    nama: z.string().optional(),
    dosis: z.string().optional(),
    tgl_mulai: z.string().optional(),
    tgl_selesai: z.string().optional(),
  })).optional(),
})

export type SurveilansFormValues = z.infer<typeof surveilansSchema>
