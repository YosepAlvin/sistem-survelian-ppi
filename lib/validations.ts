import { z } from "zod"

// ============================================================================
// Authentication Schemas
// ============================================================================

export const loginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
})

export const registerSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  confirmPassword: z.string(),
  namaLengkap: z.string().min(3, "Nama minimal 3 karakter"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Password tidak cocok",
  path: ["confirmPassword"],
})

// ============================================================================
// User Schemas
// ============================================================================

export const userCreateSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  namaLengkap: z.string().min(3, "Nama minimal 3 karakter"),
  roleId: z.number().int("Role harus dipilih"),
  ruanganId: z.number().int().optional(),
})

export const userUpdateSchema = z.object({
  email: z.string().email("Email tidak valid").optional(),
  namaLengkap: z.string().min(3, "Nama minimal 3 karakter").optional(),
  roleId: z.number().int("Role harus dipilih").optional(),
  ruanganId: z.number().int().optional().nullable(),
  isActive: z.boolean().optional(),
})

// ============================================================================
// Patient Schemas
// ============================================================================

export const pasienCreateSchema = z.object({
  nomorRm: z.string().min(3, "Nomor RM minimal 3 karakter"),
  namaPasien: z.string().min(3, "Nama pasien minimal 3 karakter"),
  tanggalLahir: z.string().datetime().optional(),
  jenisKelamin: z.enum(["L", "P"]),
  alamat: z.string().optional(),
  noKontakDarurat: z.string().optional(),
})

export const pasienUpdateSchema = pasienCreateSchema.partial()

// ============================================================================
// Admission Schemas
// ============================================================================

export const rawatInapCreateSchema = z.object({
  pasienId: z.number().int(),
  ruanganId: z.number().int(),
  dokterId: z.number().int(),
  diagnosaId: z.number().int(),
  tanggalMasuk: z.string().datetime(),
  catatan: z.string().optional(),
})

export const rawatInapUpdateSchema = z.object({
  ruanganId: z.number().int().optional(),
  dokterId: z.number().int().optional(),
  diagnosaId: z.number().int().optional(),
  tanggalKeluar: z.string().datetime().optional(),
  status: z.enum(["AKTIF", "SELESAI", "REFERRAL"]).optional(),
  catatan: z.string().optional(),
})

// ============================================================================
// Medical Device Schemas
// ============================================================================

export const alatTerpasangCreateSchema = z.object({
  rawatInapId: z.number().int(),
  jenisAlat: z.enum(["INFUS", "KATETER_URINE", "VENTILATOR", "CENTRAL_LINE", "TRAKEOSTOMI", "DRAIN_LAIN"]),
  tanggalPasang: z.string().datetime(),
  tanggalLepas: z.string().datetime().optional(),
  alasanLepas: z.string().optional(),
})

export const alatTerpasangUpdateSchema = z.object({
  tanggalLepas: z.string().datetime().optional(),
  alasanLepas: z.string().optional(),
})

// ============================================================================
// Daily Surveillance Schemas
// ============================================================================

export const surveilansHarianCreateSchema = z.object({
  rawatInapId: z.number().int(),
  tanggal: z.string().datetime(),
  infusTerpasang: z.boolean().optional(),
  kateterTerpasang: z.boolean().optional(),
  ventilatorTerpasang: z.boolean().optional(),
  centralLineTerpasang: z.boolean().optional(),
  trakeostomiTerpasang: z.boolean().optional(),
  adaInfeksi: z.boolean(),
  jenisInfeksi: z.string().optional(),
  tandaGejala: z.string().optional(),
  catatan: z.string().optional(),
})

export const surveilansHarianUpdateSchema = surveilansHarianCreateSchema.partial()

// ============================================================================
// Infection Schemas
// ============================================================================

export const kejadianInfeksiCreateSchema = z.object({
  surveilansHarianId: z.number().int(),
  jenisInfeksi: z.enum(["ILO", "ISK", "HAP", "VAP", "IADP", "PHLEBITIS", "DEKUBITUS"]),
  tanggalDeteksi: z.string().datetime(),
  hariSakitSaatDeteksi: z.number().int().optional(),
  tandaGejala: z.string().optional(),
  isolat: z.string().optional(),
  hasilKultur: z.string().optional(),
  sensitifitas: z.string().optional(),
  antibiotikId: z.number().int().optional(),
})

export const kejadianInfeksiUpdateSchema = z.object({
  statusVerifikasi: z.enum(["PENDING", "VERIFIED", "REJECTED"]).optional(),
  tandaGejala: z.string().optional(),
  isolat: z.string().optional(),
  hasilKultur: z.string().optional(),
  sensitifitas: z.string().optional(),
  antibiotikId: z.number().int().optional().nullable(),
})

// ============================================================================
// Surgery Schemas
// ============================================================================

export const operasiCreateSchema = z.object({
  rawatInapId: z.number().int(),
  tanggalOperasi: z.string().datetime(),
  jenisOperasi: z.string().min(3),
  durasiOperasi: z.number().int().optional(),
  asaScore: z.number().int().min(1).max(5).optional(),
  estimasiDarahHilang: z.number().int().optional(),
  transfusiDarah: z.boolean().optional(),
  jenisAnestesi: z.string().optional(),
  lokasiSayatan: z.string().optional(),
  hasilPathologi: z.string().optional(),
  komplikasi: z.string().optional(),
})

export const operasiUpdateSchema = operasiCreateSchema.partial()

// ============================================================================
// Antibiotic Schemas
// ============================================================================

export const penggunaanAntibiotikCreateSchema = z.object({
  rawatInapId: z.number().int(),
  antibiotikId: z.number().int(),
  tanggalMulai: z.string().datetime(),
  tanggalAkhir: z.string().datetime().optional(),
  dosis: z.number().int().positive(),
  satuan: z.string(),
  rutePemberian: z.enum(["IV", "IM", "ORAL", "TOPIKAL"]),
  frekuensi: z.string().optional(),
  indikasi: z.string().optional(),
})

export const penggunaanAntibiotikUpdateSchema = penggunaanAntibiotikCreateSchema.partial()

// ============================================================================
// Master Data Schemas
// ============================================================================

export const ruanganCreateSchema = z.object({
  namaRuangan: z.string().min(3),
  tipeRuangan: z.enum(["ICU", "HDU", "HCU", "GENERAL", "IGD", "OK"]),
  kapasitas: z.number().int().positive().optional(),
})

export const ruanganUpdateSchema = ruanganCreateSchema.partial()

export const dokterCreateSchema = z.object({
  namaDokter: z.string().min(3),
  spesialisasi: z.string().optional(),
  noHp: z.string().optional(),
  email: z.string().email().optional(),
})

export const dokterUpdateSchema = dokterCreateSchema.partial()

export const diagnosaCreateSchema = z.object({
  kodeDiagnosa: z.string().min(1).max(10),
  namaDiagnosa: z.string().min(3),
  kategori: z.string().optional(),
})

export const diagnosaUpdateSchema = diagnosaCreateSchema.partial()

export const antibiotikCreateSchema = z.object({
  namaAntibiotik: z.string().min(3),
  kategori: z.string().optional(),
  satuanDosis: z.string().optional(),
})

export const antibiotikUpdateSchema = antibiotikCreateSchema.partial()
