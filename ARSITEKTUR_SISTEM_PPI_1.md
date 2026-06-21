# SISTEM SURVEILANS PPI RUMAH SAKIT
## Dokumen Arsitektur Teknis — RSU Budi Rahayu Pekalongan

---

## 1. ANALISIS KEBUTUHAN SISTEM

### 1.1 Analisis Dokumen Formulir

Berdasarkan analisis seluruh dokumen:

#### FORMULIR SURVEILANS HARIAN (kolom lengkap):
| Kolom | Field | Keterangan |
|-------|-------|-----------|
| TGL | tanggal | Tanggal pencatatan |
| S | suhu | Suhu tubuh pasien |
| NAMA/RM | nama_pasien, no_rm | Identitas pasien |
| U | usia | Usia pasien |
| JK | jenis_kelamin | L/P |
| DX MEDIS | diagnosa_medis | Diagnosa medis |
| UC | uc_terpasang | Urine Kateter |
| IVL | ivl_terpasang | Intra Vena Line / Infus |
| CVL | cvl_terpasang | Central Vena Line |
| ETT/V | ett_v_terpasang | Ventilator |
| ISK | infeksi_isk | Infeksi Saluran Kemih |
| PLEB | infeksi_phlebitis | Phlebitis |
| HAP | infeksi_hap | Hospital Acquired Pneumonia |
| VAP | infeksi_vap | Ventilator Associated Pneumonia |
| IADP | infeksi_iadp | Infeksi Aliran Darah Primer |
| TIRAH BARING | tirah_barin | Status tirah baring |
| DEKUBITUS | ada_dekubitus | Kejadian dekubitus |
| SPUTUM | kultur_sputum | Hasil kultur sputum |
| DARAH | kultur_darah | Hasil kultur darah |
| URINE | kultur_urine | Hasil kultur urine |
| AB 1,2,3 | antibiotik_1/2/3 | Penggunaan antibiotik |

#### FORMULIR SURVEILANS BULANAN (tambahan kolom):
| Kolom | Field |
|-------|-------|
| NO | nomor urut |
| S | suhu |
| Semua kolom harian + | Agregasi per bulan |

#### FORMULIR HARIAN IDO (Infeksi Daerah Operasi):
| Kolom | Field | Keterangan |
|-------|-------|-----------|
| NO | nomor | Nomor urut |
| TGL | tanggal | Tanggal operasi |
| NAMA PASIEN | nama_pasien | |
| USIA | usia | |
| JK | jenis_kelamin | |
| DX. OPERASI | diagnosa_operasi | |
| KATEGORI RISK | | |
| JENIS OPERASI B/BT/T/K | jenis_operasi | Bersih/BersihTercemar/Tercemar/Kotor |
| SCORE (Jenis Operasi) | score_jenis | 0-3 |
| ASA KLASIFIKASI 1-5 | asa_klasifikasi | Score 1-5 |
| T TIME <JAM / >JAM | t_time | Score lama operasi |
| TOTAL SCORE | risk_score | Total skor risiko |
| TGL INFEKSI | tanggal_infeksi | |
| AB | antibiotik | |
| KULTUR | hasil_kultur | |

#### LAPORAN BULANAN PHLEBITIS IPCLN:
| Kolom | Field |
|-------|-------|
| NO | nomor |
| TGL | tanggal |
| NAMA PASIEN | nama_pasien |
| NO RM | no_rm |
| DIAGNOSA MEDIS | diagnosa |
| KEJADIAN PHLEBITIS (YA/TIDAK) | ada_phlebitis |
| JIKA YA, HARI KE BERAPA | hari_ke |
| KET | keterangan |

---

## 2. ERD LENGKAP

Lihat file `prisma/schema.prisma` untuk definisi lengkap.

### Ringkasan Relasi Antar Tabel:
```
roles ──< users
ruangan ──< users
pasien ──< rawat_inap >── ruangan
rawat_inap >── dokter
rawat_inap >── diagnosa
rawat_inap ──< alat_terpasang
rawat_inap ──< surveilans_harian
rawat_inap ──< operasi ──< surveilans_ido
rawat_inap ──< kejadian_infeksi ─┬─ phlebitis
                                  ├─ isk >── alat_terpasang
                                  ├─ hap_vap >── alat_terpasang
                                  ├─ iadp >── alat_terpasang
                                  └─ dekubitus
rawat_inap ──< hasil_kultur
rawat_inap ──< penggunaan_antibiotik >── antibiotik
ruangan ──< surveilans_bulanan
audit_trail ──< users
notifications ──< users
```

---

## 3. LANDING PAGE ENTERPRISE-GRADE

Fitur-fitur landing page yang baru:
- **Navbar Sticky**: Transparan dengan blur effect
- **Hero Section 2 Kolom**: Judul besar, deskripsi sistem, tombol masuk
- **Visual Gedung RS**: Gambar RS Budi Rahayu asli
- **Live Statistics**: Menggunakan `getSystemStats()` untuk menampilkan real-time data
- **Aktivitas Terbaru**: Data dari Audit Trail
- **Modul Sistem**: 6 modul dengan icon dan deskripsi
- **Status Sistem**: Menampilkan status database, sinkronisasi, modul, dll.
- **Footer**: Informasi sistem dan RS

### Desain:
- Tema **Dark Blue Enterprise**
- **Glassmorphism** untuk cards
- **Gradient Background**
- **Fully Responsive** (Mobile First)
- **Tidak ada horizontal scroll**

---

## 4. LOGIKA DEVICE DAY (OTOMATIS)

Device day dihitung server-side setiap kali data disimpan atau diupdate.

### Formula:
```typescript
// lib/deviceDay.ts
export function hitungDeviceDay(
  tanggalPasang: Date,
  tanggalLepas: Date | null
): number {
  const end = tanggalLepas ?? new Date();
  const diffMs = end.getTime() - tanggalPasang.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(diffDays, 1);
}

// Dipanggil di: POST/PATCH /api/alat-terpasang
// Dan di: daily cron job (update semua alat masih_terpasang=true)
```

### Contoh:
- Infus pasang: 01-06-2026 → lepas: 04-06-2026 → Device Day = **4**
- Infus pasang: 01-06-2026 → belum lepas (hari ini 04-06-2026) → Device Day = **4** (real-time)

### Cron Job Harian (update device_day):
```typescript
// Jalankan setiap tengah malam via cron atau Next.js route handler
// GET /api/cron/update-device-day (dilindungi CRON_SECRET)
await prisma.alatTerpasang.updateMany({
  where: { masihTerpasang: true },
  data: {
    deviceDay: hitungDeviceDay(alat.tanggalPasang, null)
  }
})
```

---

## 5. STRUKTUR FOLDER NEXT.JS 15

```
sistem ppi rumah sakit budi rahayu/
├── app/
│   ├── admin/
│   │   ├── dashboard/page.tsx
│   │   ├── users/page.tsx
│   │   ├── ruangan/page.tsx
│   │   ├── dokter/page.tsx
│   │   ├── diagnosa/page.tsx
│   │   ├── antibiotik/page.tsx
│   │   ├── pasien/page.tsx
│   │   ├── alat-kesehatan/page.tsx
│   │   ├── settings/page.tsx
│   │   └── layout.tsx
│   ├── ipcln/
│   │   ├── dashboard/page.tsx
│   │   ├── pasien/page.tsx
│   │   ├── surveilans-harian/
│   │   │   ├── page.tsx
│   │   │   └── [rawatInapId]/page.tsx
│   │   ├── surveilans-bulanan/page.tsx
│   │   ├── operasi/
│   │   │   ├── page.tsx
│   │   │   └── [id]/ido/page.tsx
│   │   ├── infeksi/page.tsx
│   │   ├── antibiotik/page.tsx
│   │   ├── saran-alat/page.tsx
│   │   └── layout.tsx
│   ├── ipcn/
│   │   ├── dashboard/page.tsx
│   │   ├── monitoring/
│   │   │   ├── pasien-aktif/page.tsx
│   │   │   └── device-day/page.tsx
│   │   ├── grafik/bulanan/page.tsx
│   │   ├── verifikasi/page.tsx
│   │   ├── kasus-aktif/page.tsx
│   │   ├── kasus-ditutup/page.tsx
│   │   ├── pending-closure/page.tsx
│   │   ├── verifikasi-pulang/page.tsx
│   │   ├── verifikasi-transfer/page.tsx
│   │   ├── pasien-pulang/page.tsx
│   │   ├── device-alert/page.tsx
│   │   ├── security-audit/page.tsx
│   │   ├── saran-alat/page.tsx
│   │   ├── laporan/
│   │   │   ├── bulanan/page.tsx
│   │   │   └── ido/page.tsx
│   │   └── layout.tsx
│   ├── auth/login/page.tsx
│   ├── profile/page.tsx
│   ├── settings/page.tsx
│   ├── notifications/page.tsx
│   ├── page.tsx                                  # Landing Page Enterprise
│   ├── layout.tsx
│   └── api/
│       ├── auth/[...nextauth]/route.ts
│       ├── health/route.ts                    # Health check
│       ├── stats/route.ts                     # Live stats untuk landing page
│       ├── audit-trail/route.ts               # Audit trail
│       ├── notifications/route.ts
│       ├── admin/
│       │   ├── users/route.ts
│       │   ├── users/import/route.ts
│       │   ├── ruangan/route.ts
│       │   ├── ruangan/import/route.ts
│       │   ├── dokter/route.ts
│       │   ├── dokter/import/route.ts
│       │   ├── diagnosa/route.ts
│       │   ├── diagnosa/import/route.ts
│       │   ├── antibiotik/route.ts
│       │   ├── antibiotik/import/route.ts
│       │   ├── pasien/route.ts
│       │   ├── pasien/import/route.ts
│       │   ├── alat-kesehatan/route.ts
│       │   └── stats/route.ts
│       ├── ipcln/stats/route.ts
│       ├── ipcln/surveilans-bulanan/route.ts
│       ├── ipcn/stats/route.ts
│       ├── ipcn/notifications/config/route.ts
│       ├── ipcn/nurse-activity/route.ts
│       ├── laporan/bulanan/route.ts
│       ├── monitoring/
│       │   ├── pasien-aktif/route.ts
│       │   └── device-day/route.ts
│       ├── operasi/route.ts
│       ├── operasi/[id]/route.ts
│       ├── pasien/route.ts
│       ├── pasien/[id]/route.ts
│       ├── pasien-pulang/route.ts
│       ├── rawat-inap/[id]/route.ts
│       ├── ruangan/route.ts
│       ├── surveilans-harian/route.ts
│       ├── surveilans-ido/route.ts
│       ├── surveilans-ido/[id]/route.ts
│       ├── transfer/route.ts
│       ├── transfer/[id]/route.ts
│       ├── verifikasi/route.ts
│       ├── antibiotik/route.ts
│       ├── antibiotik/export/route.ts
│       ├── antibiotik/analytics/route.ts
│       ├── antibiotik/audit/route.ts
│       ├── antibiotik/notifications/route.ts
│       ├── alat-kesehatan/route.ts
│       ├── alat-saran/route.ts
│       └── cron/update-device-day/route.ts
├── components/
│   ├── ui/                           # Shadcn & custom UI components
│   │   ├── button.tsx
│   │   ├── Card.tsx
│   │   ├── StatCard.tsx
│   │   ├── Toast.tsx
│   │   ├── DataTable.tsx
│   │   ├── FormField.tsx
│   │   ├── LoadingSkeleton.tsx
│   │   ├── PageHeader.tsx
│   │   ├── ConfirmDialog.tsx
│   │   ├── EmptyState.tsx
│   │   ├── AuditTrailViewer.tsx
│   │   └── ...
│   ├── layout/
│   │   ├── AppLayout.tsx
│   │   ├── AppHeader.tsx
│   │   └── AppSidebar.tsx
│   ├── forms/
│   │   └── SurveilanHarianForm.tsx
│   ├── providers.tsx                 # Session & Theme Provider
│   └── theme-provider.tsx
├── lib/
│   ├── db.ts                         # Prisma singleton
│   ├── auth.ts                       # NextAuth config
│   ├── deviceDay.ts                  # Kalkulasi device day
│   ├── calculations.ts               # Hitung rate infeksi
│   ├── stats.ts                      # Live stats for landing page
│   ├── audit-trail.js                # Audit trail logger
│   ├── notifications.js              # Notifikasi sistem
│   ├── excel-export.ts               # Export Excel
│   ├── excel-import.ts               # Import Excel
│   ├── antibiotik-status.ts          # Status antibiotik
│   ├── daily-snapshot.js             # Daily snapshot
│   ├── haIs-event-tracking.js        # HAI event tracking
│   ├── reporting.js                  # Reporting utils
│   ├── date-utils.ts
│   ├── utils.ts
│   └── validations/
│       └── surveilans.ts
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── public/
│   ├── logo.png                      # Logo RS Budi Rahayu
│   └── rs-budi-rahayu.jpg.png        # Foto gedung RS
├── styles/
│   └── globals.css
├── middleware.ts                      # Auth & role middleware
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── docker-compose.yml
├── Dockerfile
└── .env
```

---

## 6. AUTHENTICATION & AUTHORIZATION

### NextAuth Config (lib/auth.ts):
```typescript
import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/db"
import bcrypt from "bcryptjs"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    CredentialsProvider({
      async authorize(credentials) {
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          include: { role: true, ruangan: true }
        })
        if (!user || !user.isActive) return null
        const valid = await bcrypt.compare(credentials.password as string, user.password)
        if (!valid) return null
        return {
          id: user.id.toString(),
          name: user.name,
          email: user.email,
          role: user.role.slug,       // "admin" | "ipcn" | "ipcln"
          ruanganId: user.ruanganId,
          ruanganNama: user.ruangan?.nama
        }
      }
    })
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
        token.ruanganId = (user as any).ruanganId
        token.ruanganNama = (user as any).ruanganNama
      }
      return token
    },
    session({ session, token }) {
      session.user.role = token.role as string
      session.user.ruanganId = token.ruanganId as number
      session.user.ruanganNama = token.ruanganNama as string
      return session
    }
  },
  pages: { signIn: "/auth/login" }
})
```

### Session Loading (components/providers.tsx):
- Menampilkan animasi loading saat session sedang di-load
- Menggunakan logo RS dengan pulse effect
- Spinner bouncing dengan teks "Memuat sistem..."

### Middleware Proteksi Route (middleware.ts):
```typescript
import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

const ROLE_ROUTES = {
  "/admin": ["admin"],
  "/ipcn": ["ipcn", "admin"],
  "/ipcln": ["ipcln", "ipcn", "admin"],
}

export default auth((req) => {
  const { pathname } = req.nextUrl
  const role = req.auth?.user?.role

  if (!req.auth && !pathname.startsWith("/api") && pathname !== "/" && pathname !== "/auth/login") {
    return NextResponse.redirect(new URL("/auth/login", req.url))
  }

  for (const [path, roles] of Object.entries(ROLE_ROUTES)) {
    if (pathname.startsWith(path) && !roles.includes(role!)) {
      return NextResponse.redirect(new URL("/", req.url))
    }
  }
})
```

---

## 7. API ENDPOINTS LENGKAP

### Landing Page:
```
GET  /api/health                        # Health check
GET  /api/stats                         # Live statistics (Total Pasien, Surveilans Aktif, dll)
GET  /api/audit-trail?limit=5           # Aktivitas terbaru
```

### Dashboard (Realtime):
```
GET  /api/admin/stats                   # Summary admin
GET  /api/ipcn/stats                    # Summary IPCN
GET  /api/ipcln/stats                   # Summary IPCLN
GET  /api/monitoring/device-day         # Akumulasi device day
```

### Pasien & Rawat Inap:
```
GET    /api/pasien?search=&ruangan=       # List dengan filter
POST   /api/pasien                        # Tambah pasien baru
GET    /api/pasien/:id
PUT    /api/pasien/:id

GET    /api/rawat-inap?status=aktif&ruanganId=
POST   /api/rawat-inap                    # Admisi pasien
PUT    /api/rawat-inap/:id                # Update / pulangkan
```

### Alat & Device Day:
```
GET    /api/alat-terpasang?rawatInapId=
POST   /api/alat-terpasang               # Pasang alat baru
PATCH  /api/alat-terpasang/:id/lepas     # Lepas alat (set tanggal_lepas)
GET    /api/alat-terpasang/:id/device-day # Hitung device day real-time
```

### Surveilans:
```
GET    /api/surveilans-harian?rawatInapId=&tanggal=
POST   /api/surveilans-harian
PUT    /api/surveilans-harian/:id

GET    /api/ipcln/surveilans-bulanan?ruanganId=&bulan=&tahun=
POST   /api/ipcln/surveilans-bulanan     # Trigger rekap otomatis
```

### Operasi & IDO:
```
GET    /api/operasi?rawatInapId=
POST   /api/operasi
GET    /api/surveilans-ido?operasiId=
POST   /api/surveilans-ido
PATCH  /api/surveilans-ido/:id/verifikasi  # IPCN verifikasi
```

### Kejadian Infeksi:
```
GET    /api/kejadian-infeksi?ruanganId=&bulan=&tahun=
POST   /api/phlebitis
POST   /api/isk
POST   /api/hap-vap
POST   /api/iadp
POST   /api/dekubitus
PATCH  /api/kejadian-infeksi/:id/verifikasi
```

### Antibiotik:
```
GET    /api/antibiotik
POST   /api/antibiotik
GET    /api/antibiotik/export
GET    /api/antibiotik/analytics
GET    /api/antibiotik/audit
```

### Laporan & Export:
```
GET    /api/laporan/bulanan?ruanganId=&bulan=&tahun=&format=xlsx|pdf
```

### Audit Trail & Notifikasi:
```
GET    /api/audit-trail                  # Log aktivitas sistem
GET    /api/notifications                # Notifikasi user
```

---

## 8. PERHITUNGAN RATE INFEKSI (lib/calculations.ts)

```typescript
// Phlebitis Rate = (Jumlah Phlebitis / Total Hari Rawat) × 1000
export const hitungPhlebitisRate = (jumlah: number, hariRawat: number) =>
  hariRawat > 0 ? (jumlah / hariRawat) * 1000 : 0

// CAUTI Rate = (Jumlah ISK / Total Kateter Day) × 1000
export const hitungCautiRate = (jumlah: number, kateterDay: number) =>
  kateterDay > 0 ? (jumlah / kateterDay) * 1000 : 0

// CLABSI Rate = (Jumlah IADP / Total CVL Day) × 1000
export const hitungClabsiRate = (jumlah: number, cvlDay: number) =>
  cvlDay > 0 ? (jumlah / cvlDay) * 1000 : 0

// VAP Rate = (Jumlah VAP / Total Ventilator Day) × 1000
export const hitungVapRate = (jumlah: number, ventilatorDay: number) =>
  ventilatorDay > 0 ? (jumlah / ventilatorDay) * 1000 : 0

// HAP Rate = (Jumlah HAP / Total Hari Rawat) × 1000
export const hitungHapRate = (jumlah: number, hariRawat: number) =>
  hariRawat > 0 ? (jumlah / hariRawat) * 1000 : 0

// IDO Rate = (Jumlah IDO / Total Operasi) × 100
export const hitungIdoRate = (jumlah: number, totalOperasi: number) =>
  totalOperasi > 0 ? (jumlah / totalOperasi) * 100 : 0
```

---

## 9. LIVE STATISTICS LANDING PAGE (lib/stats.ts)

```typescript
export async function getSystemStats() {
  const [
    totalPasien,
    totalSurveilansAktif,
    totalKasusInfeksiTerverifikasi,
    totalAntibiotikAktif,
    totalDeviceDayBulanIni,
    totalNotifikasiAktif,
    totalLaporanBulanan,
  ] = await Promise.all([
    prisma.rawatInap.count({ where: { status: "aktif" } }),
    prisma.surveilansHarian.count({
      where: { tanggal: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } }
    }),
    prisma.kejadianInfeksi.count({ where: { statusVerifikasi: "terverifikasi" } }),
    prisma.penggunaanAntibiotik.count({ where: { status: "aktif" } }),
    prisma.alatTerpasang.aggregate({
      where: {
        OR: [
          { tanggalLepas: null },
          { tanggalLepas: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } }
        ]
      },
      _sum: { deviceDay: true }
    }),
    prisma.notification.count({ where: { isRead: false } }),
    prisma.surveilansBulanan.count({
      where: { bulan: new Date().getMonth(), tahun: new Date().getFullYear() }
    }),
  ])

  return {
    totalPasien,
    totalSurveilansAktif,
    totalKasusInfeksiTerverifikasi,
    totalAntibiotikAktif,
    totalDeviceDayBulanIni: totalDeviceDayBulanIni._sum.deviceDay || 0,
    totalNotifikasiAktif,
    totalLaporanBulanan,
  }
}
```

---

## 10. AUDIT TRAIL SISTEM (lib/audit-trail.js)

Mencatat semua aktivitas penting:
- Login & logout
- Perubahan data pasien
- Input surveilans
- Verifikasi kasus infeksi
- Penggunaan antibiotik
- dll.

```javascript
export const logAuditTrail = async (action, entityType, entityId, userId, userName, details) => {
  return await prisma.auditTrail.create({
    data: {
      action,
      entityType,
      entityId,
      userId,
      userName,
      details: JSON.stringify(details),
      ipAddress: "::1", // Diisi dari request
      timestamp: new Date()
    }
  })
}
```

---

## 11. EXPORT EXCEL (lib/excel-export.ts)

```typescript
import ExcelJS from "exceljs"

// Laporan Surveilans Harian — format identik dengan formulir RS
export async function exportSurveilanHarian(
  ruanganNama: string,
  bulanTahun: string,
  data: SurveilanHarianRow[]
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet("Surveilans Harian")

  // Header — sesuai formulir asli RSU Budi Rahayu
  ws.mergeCells("A1:V1")
  ws.getCell("A1").value = "FORMULIR SURVEILANS HARIAN INFEKSI RUMAH SAKIT"
  ws.getCell("A2").value = "RSU BUDI RAHAYU PEKALONGAN"
  ws.getCell("A3").value = `BULAN/ TAHUN : ${bulanTahun}`
  ws.getCell("A4").value = `RUANGAN : ${ruanganNama}`

  // Baris header kolom — Row 6
  const headers = [
    "TGL","S","NAMA/RM","U","JK","DX MEDIS",
    "UC","IVL","CVL","ETT/V",
    "ISK","PLEB","HAP","VAP","IADP",
    "TIRAH BARING","DEKUBITUS","SPUTUM","DARAH","URINE",
    "AB 1","AB 2","AB 3"
  ]
  // Merge TINDAKAN header
  ws.mergeCells("G6:J6"); ws.getCell("G6").value = "TINDAKAN"
  ws.mergeCells("K6:O6"); ws.getCell("K6").value = "INFEKSI RUMAH SAKIT"
  ws.mergeCells("R6:T6"); ws.getCell("R6").value = "HASIL KULTUR"
  ws.mergeCells("U6:W6"); ws.getCell("U6").value = "AB"

  // Baris sub-header
  headers.forEach((h, i) => {
    const cell = ws.getCell(7, i + 1)
    cell.value = h
    cell.font = { bold: true }
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true }
    cell.border = {
      top: { style: "thin" }, left: { style: "thin" },
      bottom: { style: "thin" }, right: { style: "thin" }
    }
  })

  // Data rows
  data.forEach((row, idx) => {
    const r = ws.getRow(8 + idx)
    r.values = [
      row.tanggal, row.suhu, `${row.namaPasien} / ${row.noRm}`,
      row.usia, row.jenisKelamin, row.diagnosa,
      row.ucTerpasang ? "V" : "", row.ivlTerpasang ? "V" : "",
      row.cvlTerpasang ? "V" : "", row.ettVTerpasang ? "V" : "",
      row.adaIsk ? "V" : "", row.adaPhlebitis ? "V" : "",
      row.adaHap ? "V" : "", row.adaVap ? "V" : "",
      row.adaIadp ? "V" : "",
      row.tirahBaring ? "V" : "", row.adaDekubitus ? "V" : "",
      row.kulturSputum, row.kulturDarah, row.kulturUrine,
      row.ab1, row.ab2, row.ab3
    ]
  })

  return Buffer.from(await wb.xlsx.writeBuffer())
}
```

---

## 12. DOCKER COMPOSE

```yaml
# docker-compose.yml
version: "3.9"

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: "file:./dev.db" # SQLite
      NEXTAUTH_SECRET: ${NEXTAUTH_SECRET}
      NEXTAUTH_URL: "http://localhost:3000"
    restart: unless-stopped
```

---

## 13. DOCKERFILE

```dockerfile
FROM node:20-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
```

---

## 14. PACKAGE.JSON (DEPENDENCIES UTAMA)

```json
{
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@prisma/client": "^5.0.0",
    "next-auth": "^5.0.0-beta",
    "bcryptjs": "^2.4.3",
    "zod": "^3.22.0",
    "exceljs": "^4.4.0",
    "jspdf": "^2.5.0",
    "jspdf-autotable": "^3.8.0",
    "date-fns": "^3.0.0",
    "date-fns-tz": "^3.0.0",
    "recharts": "^2.12.0",
    "@tanstack/react-query": "^5.0.0",
    "react-hook-form": "^7.53.0",
    "@hookform/resolvers": "^3.9.0",
    "sonner": "^1.5.0",
    "lucide-react": "^0.400.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.3.0"
  },
  "devDependencies": {
    "prisma": "^5.0.0",
    "typescript": "^5.0.0",
    "tailwindcss": "^3.4.0",
    "@types/bcryptjs": "^2.4.6"
  }
}
```

---

## 15. ALUR FORM SURVEILANS HARIAN (UI/UX)

### Prinsip Desain:
1. Form web **semirip mungkin** dengan formulir kertas yang sudah digunakan
2. Perawat tidak perlu belajar ulang — urutan kolom sama persis
3. Layout **responsive**: Card pada mobile, tabel horizontal pada layar besar
4. Checkmark/toggle untuk kolom "ada/tidak ada"
5. Autocomplete untuk diagnosa dan obat antibiotik
6. **Mobile First**: Semua fitur dapat diakses dari perangkat mobile

### Alur Input IPCLN:
```
1. IPCLN login → otomatis masuk ke halaman ruangan sendiri
2. Halaman Pasien Aktif → pilih pasien
3. Klik "Input Harian Hari Ini"
4. Form muncul dengan data pasien sudah terisi (nama, RM, dx)
5. IPCLN isi: suhu, device yang terpasang, ada infeksi atau tidak
6. Jika ada infeksi → tombol "Tambah Kejadian Infeksi" muncul
7. Submit → data langsung muncul di dashboard IPCN real-time
```

---

## 16. SEED DATA AWAL (prisma/seed.ts)

```typescript
// Roles
const roles = ["admin", "ipcn", "ipcln"].map(slug => ({
  name: slug.toUpperCase(),
  slug,
  permissions: getPermissions(slug)
}))

// Ruangan awal
const ruanganList = [
  { nama: "ICU", kode: "ICU", jenis: "ICU" },
  { nama: "Mawar", kode: "MWR", jenis: "Rawat Inap" },
  { nama: "Melati", kode: "MLT", jenis: "Rawat Inap" },
  { nama: "NICU", kode: "NICU", jenis: "NICU" },
  { nama: "VK", kode: "VK", jenis: "VK" },
  { nama: "OK", kode: "OK", jenis: "OK" },
]

// Users default
const users = [
  {
    name: "Administrator",
    email: "admin@rs.com",
    password: await bcrypt.hash("admin123", 12),
    roleId: 1
  },
  {
    name: "IPCN",
    email: "ipcn@rs.com",
    password: await bcrypt.hash("admin123", 12),
    roleId: 2
  },
  {
    name: "IPCLN ICU",
    email: "ipcln.icu@rs.com",
    password: await bcrypt.hash("admin123", 12),
    roleId: 3,
    ruanganId: 1
  }
]
```

---

## 17. ENVIRONMENT VARIABLES (.env)

```env
# Database (SQLite)
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-min-32-chars"

# Next.js
NODE_ENV="development"
```

---

## 18. PANDUAN INSTALASI

```bash
# 1. Clone & install
cd "sistem ppi rumah sakit budi rahayu"
npm install

# 2. Setup environment
cp .env.example .env
# Edit .env sesuai kebutuhan

# 3. Setup database
npx prisma migrate dev --name init
npx prisma db seed

# 4. Jalankan development
npm run dev

# 5. Akses aplikasi
# Browser: http://localhost:3000
# Mobile: http://[IP-PC]:3000 (pastikan di jaringan yang sama)
```

---

## 19. AKSES MOBILE

Sistem **fully responsive** dan dapat diakses dari perangkat mobile:
- Pastikan PC/laptop dan mobile terhubung ke **jaringan WiFi yang sama**
- Cari IP address PC (contoh: `192.168.1.100`)
- Akses di browser mobile: `http://192.168.1.100:3000`

Fitur mobile:
- Landing page dengan card 2 kolom
- Form yang mudah diisi dengan jari
- Tombol yang cukup besar untuk di-tap
- Tidak ada horizontal scroll

---

*Dokumen ini merupakan arsitektur lengkap Sistem Surveilans PPI RSU Budi Rahayu Pekalongan.*
*Versi: 2.0 | Updated: Juni 2026*
