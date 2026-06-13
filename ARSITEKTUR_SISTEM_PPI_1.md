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
| TIRAH BARING | tirah_baring | Status tirah baring |
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

Lihat file `schema.prisma` untuk definisi lengkap.

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
```

---

## 3. LOGIKA DEVICE DAY (OTOMATIS)

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

## 4. STRUKTUR FOLDER NEXT.JS 15

```
ppi-surveillance/
├── app/
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx                    # Layout dengan sidebar
│   │   ├── admin/
│   │   │   ├── users/
│   │   │   │   ├── page.tsx              # Daftar user
│   │   │   │   ├── [id]/page.tsx
│   │   │   │   └── new/page.tsx
│   │   │   ├── ruangan/page.tsx
│   │   │   ├── dokter/page.tsx
│   │   │   ├── diagnosa/page.tsx
│   │   │   └── antibiotik/page.tsx
│   │   ├── ipcln/
│   │   │   ├── pasien/
│   │   │   │   ├── page.tsx              # Daftar pasien aktif
│   │   │   │   ├── new/page.tsx          # Tambah pasien baru
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx
│   │   │   │       └── rawat-inap/page.tsx
│   │   │   ├── surveilans-harian/
│   │   │   │   ├── page.tsx              # Pilih pasien & tanggal
│   │   │   │   └── [rawatInapId]/page.tsx # Form input harian
│   │   │   ├── surveilans-bulanan/
│   │   │   │   └── page.tsx
│   │   │   ├── operasi/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/ido/page.tsx     # Form IDO
│   │   │   ├── infeksi/
│   │   │   │   ├── phlebitis/page.tsx
│   │   │   │   ├── isk/page.tsx
│   │   │   │   ├── hap/page.tsx
│   │   │   │   ├── vap/page.tsx
│   │   │   │   ├── iadp/page.tsx
│   │   │   │   └── dekubitus/page.tsx
│   │   │   └── antibiotik/page.tsx
│   │   └── ipcn/
│   │       ├── dashboard/page.tsx        # Dashboard utama RS
│   │       ├── dashboard/[ruanganId]/page.tsx
│   │       ├── monitoring/
│   │       │   ├── pasien-aktif/page.tsx
│   │       │   ├── device-day/page.tsx
│   │       │   ├── kejadian-infeksi/page.tsx
│   │       │   └── kepatuhan/page.tsx
│   │       ├── grafik/
│   │       │   ├── bulanan/page.tsx
│   │       │   └── tahunan/page.tsx
│   │       ├── verifikasi/
│   │       │   └── [id]/page.tsx
│   │       └── laporan/
│   │           ├── harian/page.tsx
│   │           ├── bulanan/page.tsx
│   │           ├── ido/page.tsx
│   │           └── phlebitis/page.tsx
│   └── api/
│       ├── auth/[...nextauth]/route.ts
│       ├── pasien/route.ts
│       ├── rawat-inap/route.ts
│       ├── alat-terpasang/route.ts
│       ├── surveilans-harian/route.ts
│       ├── surveilans-bulanan/route.ts
│       ├── operasi/route.ts
│       ├── surveilans-ido/route.ts
│       ├── kejadian-infeksi/route.ts
│       ├── phlebitis/route.ts
│       ├── isk/route.ts
│       ├── hap-vap/route.ts
│       ├── iadp/route.ts
│       ├── dekubitus/route.ts
│       ├── hasil-kultur/route.ts
│       ├── antibiotik/route.ts
│       ├── dashboard/
│       │   ├── rs/route.ts               # Realtime RS-wide
│       │   └── ruangan/[id]/route.ts     # Per ruangan
│       ├── laporan/
│       │   ├── harian/route.ts           # Export Excel harian
│       │   ├── bulanan/route.ts          # Export Excel bulanan
│       │   ├── ido/route.ts
│       │   └── phlebitis/route.ts
│       └── cron/
│           └── update-device-day/route.ts
├── components/
│   ├── ui/                               # Shadcn components
│   ├── forms/
│   │   ├── SurveilanHarianForm.tsx
│   │   ├── IDOForm.tsx
│   │   ├── PasienForm.tsx
│   │   ├── RawatInapForm.tsx
│   │   ├── PhlebitisForm.tsx
│   │   └── AlatTerpasangForm.tsx
│   ├── dashboard/
│   │   ├── RuanganCard.tsx
│   │   ├── DeviceDayWidget.tsx
│   │   ├── InfeksiChart.tsx
│   │   └── RealtimeBadge.tsx
│   ├── tables/
│   │   ├── SurveilanHarianTable.tsx
│   │   └── KejadianInfeksiTable.tsx
│   └── layout/
│       ├── Sidebar.tsx
│       ├── Header.tsx
│       └── RoleGuard.tsx
├── lib/
│   ├── auth.ts                           # NextAuth config
│   ├── prisma.ts                         # Prisma singleton
│   ├── deviceDay.ts                      # Kalkulasi device day
│   ├── calculations.ts                   # Hitung rate infeksi
│   ├── excel.ts                          # ExcelJS export
│   ├── pdf.ts                            # jsPDF export
│   └── validations/
│       ├── surveilans.ts                 # Zod schemas
│       └── pasien.ts
├── hooks/
│   ├── useRealtime.ts                    # Polling/SSE hook
│   └── useDeviceDay.ts
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
├── types/
│   └── index.ts
├── middleware.ts                          # Auth & role middleware
├── docker-compose.yml
├── Dockerfile
└── .env
```

---

## 5. AUTHENTICATION & AUTHORIZATION

### NextAuth Config (lib/auth.ts):
```typescript
import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
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
  pages: { signIn: "/login" }
})
```

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

  if (!req.auth) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  for (const [path, roles] of Object.entries(ROLE_ROUTES)) {
    if (pathname.startsWith(`/(dashboard)${path}`) && !roles.includes(role!)) {
      return NextResponse.redirect(new URL("/unauthorized", req.url))
    }
  }
})
```

---

## 6. API ENDPOINTS LENGKAP

### Dashboard (Realtime):
```
GET  /api/dashboard/rs                    # Summary seluruh RS
GET  /api/dashboard/ruangan/:id           # Summary per ruangan
GET  /api/dashboard/device-day            # Akumulasi device day
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

GET    /api/surveilans-bulanan?ruanganId=&bulan=&tahun=
POST   /api/surveilans-bulanan            # Trigger rekap otomatis
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

### Laporan & Export:
```
GET    /api/laporan/harian?ruanganId=&tanggal=&format=xlsx|pdf
GET    /api/laporan/bulanan?ruanganId=&bulan=&tahun=&format=xlsx|pdf
GET    /api/laporan/ido?ruanganId=&bulan=&tahun=&format=xlsx|pdf
GET    /api/laporan/phlebitis?ruanganId=&bulan=&tahun=&format=xlsx|pdf
GET    /api/laporan/rekap-ruangan?bulan=&tahun=&format=xlsx
GET    /api/laporan/rekap-rs?bulan=&tahun=&format=xlsx|pdf
```

---

## 7. PERHITUNGAN RATE INFEKSI (lib/calculations.ts)

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

## 8. CONTOH DASHBOARD IPCN (SERVER COMPONENT)

```typescript
// app/(dashboard)/ipcn/dashboard/page.tsx
import { prisma } from "@/lib/prisma"

export default async function DashboardIPCN() {
  const ruanganList = await prisma.ruangan.findMany({
    where: { isActive: true },
    include: {
      rawatInap: {
        where: { status: "aktif" },
        include: {
          alatTerpasang: { where: { masihTerpasang: true } },
          kejadianInfeksi: {
            where: {
              tanggalKejadian: {
                gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
              }
            }
          }
        }
      }
    }
  })

  const dashboardData = ruanganList.map(ruangan => {
    const pasienAktif = ruangan.rawatInap.length
    const allAlat = ruangan.rawatInap.flatMap(r => r.alatTerpasang)
    const allInfeksi = ruangan.rawatInap.flatMap(r => r.kejadianInfeksi)

    return {
      nama: ruangan.nama,
      pasienAktif,
      infusDay: allAlat.filter(a => a.jenisAlat === "IVL").reduce((s, a) => s + a.deviceDay, 0),
      kateterDay: allAlat.filter(a => a.jenisAlat === "UC").reduce((s, a) => s + a.deviceDay, 0),
      ventilatorDay: allAlat.filter(a => a.jenisAlat === "ETT_V").reduce((s, a) => s + a.deviceDay, 0),
      phlebitis: allInfeksi.filter(i => i.jenisInfeksi === "PHLEBITIS").length,
      isk: allInfeksi.filter(i => i.jenisInfeksi === "ISK").length,
      hap: allInfeksi.filter(i => i.jenisInfeksi === "HAP").length,
      vap: allInfeksi.filter(i => i.jenisInfeksi === "VAP").length,
      iadp: allInfeksi.filter(i => i.jenisInfeksi === "IADP").length,
    }
  })

  return <DashboardGrid data={dashboardData} />
}
```

### Dashboard Output (sesuai spesifikasi):
```
┌─────────────────────────────────┐
│  ICU                            │
│  Pasien Aktif    : 12           │
│  Infus Day       : 35           │
│  Kateter Day     : 20           │
│  Ventilator Day  : 10           │
│  Phlebitis       : 2            │
│  ISK             : 1            │
│  HAP             : 0            │
│  VAP             : 1            │
└─────────────────────────────────┘
```

---

## 9. EXPORT EXCEL (lib/excel.ts)

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

  // Keterangan footer
  const lastRow = 8 + data.length + 1
  ws.getCell(lastRow, 1).value = "Keterangan :"
  ws.getCell(lastRow + 1, 1).value = "S : Suhu\t\t\tCVL : Central Vena Line"
  ws.getCell(lastRow + 2, 1).value = "U : Usia\t\t\tHAP : Hospital Acquired Pneumonia"
  ws.getCell(lastRow + 3, 1).value = "JK : Jenis Kelamin\t\tVAP : Ventilator Associated Pneumonia"
  ws.getCell(lastRow + 4, 1).value = "UC : Urine Kateter\t\tIADP : Infeksi Aliran Darah Primer"
  ws.getCell(lastRow + 5, 1).value = "IVL : Intra Vena Line\t\tAB : Antibiotik"

  return Buffer.from(await wb.xlsx.writeBuffer())
}

// Laporan Bulanan Phlebitis — format identik LAPORAN_BULANAN_Phlebitis_IPCLN.docx
export async function exportLaporanPhlebitis(
  ruanganNama: string,
  bulan: string,
  data: PhlebitisRow[]
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet("Laporan Phlebitis")

  ws.mergeCells("A1:H1")
  ws.getCell("A1").value = "LAPORAN BULANAN"
  ws.mergeCells("A2:H2")
  ws.getCell("A2").value = "Angka Kejadian Infeksi Jarum Infuse/ Phlebitis (ILI)"
  ws.getCell("A3").value = `Bulan : ${bulan}`
  ws.getCell("A4").value = `Ruang : ${ruanganNama}`

  const colHeaders = [
    "NO","TGL","NAMA PASIEN","NO RM","DIAGNOSA MEDIS",
    "KEJADIAN PHLEBITIS\n(YA/TIDAK)",
    "JIKA YA PADA KOLOM 6\nTERIDENTIFIKASI HARI KE BERAPA?",
    "KET"
  ]
  const headerRow = ws.getRow(6)
  colHeaders.forEach((h, i) => {
    const cell = headerRow.getCell(i + 1)
    cell.value = h
    cell.font = { bold: true }
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true }
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD9E1F2" } }
    cell.border = {
      top: { style: "thin" }, left: { style: "thin" },
      bottom: { style: "thin" }, right: { style: "thin" }
    }
  })
  headerRow.height = 40

  data.forEach((row, idx) => {
    const r = ws.getRow(7 + idx)
    r.values = [
      idx + 1, row.tanggal, row.namaPasien, row.noRm,
      row.diagnosa, row.adaPhlebitis ? "YA" : "TIDAK",
      row.adaPhlebitis ? `Hari ke-${row.hariKe}` : "-",
      row.keterangan
    ]
    r.eachCell(cell => {
      cell.border = {
        top: { style: "thin" }, left: { style: "thin" },
        bottom: { style: "thin" }, right: { style: "thin" }
      }
      cell.alignment = { vertical: "middle", wrapText: true }
    })
  })

  const lastRow = 7 + data.length + 2
  ws.getCell(lastRow, 6).value = "Pembuat Laporan"
  ws.getCell(lastRow + 4, 6).value = "IPCLN"

  // Column widths
  ws.columns = [
    { width: 5 }, { width: 12 }, { width: 25 }, { width: 15 },
    { width: 30 }, { width: 20 }, { width: 30 }, { width: 20 }
  ]

  return Buffer.from(await wb.xlsx.writeBuffer())
}
```

---

## 10. DOCKER COMPOSE

```yaml
# docker-compose.yml
version: "3.9"

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: mysql://ppi_user:ppi_password@db:3306/ppi_db
      NEXTAUTH_SECRET: ${NEXTAUTH_SECRET}
      NEXTAUTH_URL: http://localhost:3000
      CRON_SECRET: ${CRON_SECRET}
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped

  db:
    image: mysql:8.0
    ports:
      - "3306:3306"
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: ppi_db
      MYSQL_USER: ppi_user
      MYSQL_PASSWORD: ppi_password
    volumes:
      - mysql_data:/var/lib/mysql
      - ./prisma/init.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  adminer:
    image: adminer
    ports:
      - "8080:8080"
    depends_on:
      - db

volumes:
  mysql_data:
```

---

## 11. DOCKERFILE

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

## 12. PACKAGE.JSON (DEPENDENCIES UTAMA)

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
    "recharts": "^2.12.0",
    "@tanstack/react-query": "^5.0.0",
    "react-hook-form": "^7.53.0",
    "@hookform/resolvers": "^3.9.0",
    "sonner": "^1.5.0",
    "lucide-react": "^0.400.0"
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

## 13. ALUR FORM SURVEILANS HARIAN (UI/UX)

### Prinsip Desain:
1. Form web **semirip mungkin** dengan formulir kertas yang sudah digunakan
2. Perawat tidak perlu belajar ulang — urutan kolom sama persis
3. Layout tabel horizontal pada layar besar, card pada mobile
4. Checkmark/toggle untuk kolom "ada/tidak ada"
5. Autocomplete untuk diagnosa dan obat antibiotik

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

### Form Surveilans Harian (struktur):
```tsx
// Mirip dengan layout tabel formulir kertas
<SurveilanHarianForm>
  <Section title="Data Pasien">
    <Field label="Tanggal" />
    <Field label="Suhu (S)" type="number" />
    <Field label="Nama / No. RM" disabled /> {/* Auto dari rawat_inap */}
    <Field label="Usia" disabled />
    <Field label="JK" disabled />
    <Field label="DX Medis" disabled />
  </Section>

  <Section title="Tindakan (Device Terpasang)">
    <Toggle label="UC" /> {/* Urine Kateter */}
    <Toggle label="IVL" /> {/* Infus */}
    <Toggle label="CVL" /> {/* Central Line */}
    <Toggle label="ETT/V" /> {/* Ventilator */}
  </Section>

  <Section title="Infeksi Rumah Sakit">
    <Toggle label="ISK" onToggle={showISKDetail} />
    <Toggle label="Phlebitis" onToggle={showPhlebitisDetail} />
    <Toggle label="HAP" onToggle={showHAPDetail} />
    <Toggle label="VAP" onToggle={showVAPDetail} />
    <Toggle label="IADP" onToggle={showIADPDetail} />
  </Section>

  <Section title="Lain-lain">
    <Toggle label="Tirah Baring" />
    <Toggle label="Dekubitus" onToggle={showDekubitusDetail} />
  </Section>

  <Section title="Hasil Kultur">
    <Field label="Sputum" />
    <Field label="Darah" />
    <Field label="Urine" />
  </Section>

  <Section title="Antibiotik">
    <AntibiotikAutocomplete label="AB 1" />
    <AntibiotikAutocomplete label="AB 2" />
    <AntibiotikAutocomplete label="AB 3" />
  </Section>
</SurveilanHarianForm>
```

---

## 14. SEED DATA AWAL (prisma/seed.ts)

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

// Admin default
const adminUser = {
  name: "Administrator",
  email: "admin@ppi.rsubudirahayupkl.id",
  password: await bcrypt.hash("admin123", 12),
  roleId: 1
}
```

---

## 15. ENVIRONMENT VARIABLES (.env)

```env
# Database
DATABASE_URL="mysql://ppi_user:ppi_password@localhost:3306/ppi_db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-min-32-chars"

# Cron Job Protection
CRON_SECRET="your-cron-secret"

# MySQL Docker
MYSQL_ROOT_PASSWORD="root_password"
```

---

## 16. PANDUAN INSTALASI

```bash
# 1. Clone & install
git clone <repo>
cd ppi-surveillance
npm install

# 2. Setup environment
cp .env.example .env
# Edit .env sesuai kebutuhan

# 3. Jalankan Docker (MySQL)
docker compose up -d db

# 4. Setup database
npx prisma migrate dev --name init
npx prisma db seed

# 5. Jalankan development
npm run dev

# 6. Atau jalankan semua via Docker
docker compose up -d
```

---

*Dokumen ini merupakan arsitektur lengkap Sistem Surveilans PPI RSU Budi Rahayu Pekalongan.*
*Versi: 1.0 | Generated: Juni 2026*
