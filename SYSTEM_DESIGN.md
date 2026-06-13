# SISTEM SURVEILANS PPI RUMAH SAKIT BUDI RAHAYU
## Dokumentasi Desain Sistem Lengkap

---

## 1. ANALISIS KEBUTUHAN SISTEM

### 1.1 Tujuan Sistem
- Menghilangkan rekap manual IPCN
- Otomasi pengumpulan data dari IPCLN
- Real-time monitoring dan dashboard untuk IPCN
- Otomasi perhitungan metrik infeksi
- Otomasi pembuatan laporan harian dan bulanan

### 1.2 User Personas
1. **Admin**: Mengelola user, role, dan master data
2. **IPCN**: Monitoring, verifikasi data, akses dashboard dan laporan
3. **IPCLN**: Input data surveilans harian per ruangan

### 1.3 Alur Bisnis Utama
```
Pasien Masuk (IGD/Poliklinik)
    ↓
Registrasi Data Pasien & Ruangan (IPCLN)
    ↓
Input Surveilans Awal & Device Terpasang (IPCLN)
    ↓
Input Harian oleh IPCLN (Setiap hari)
    - Update status device
    - Deteksi tanda infeksi
    ↓
Jika ada infeksi:
    - Input detail infeksi (ILO/ISK/HAP/VAP/IADP/Phlebitis/Dekubitus)
    - Input antibiotik
    ↓
Verifikasi IPCN
    ↓
Perhitungan Otomatis:
    - Device Days
    - Infection Rate
    - Compliance Rate
    ↓
Dashboard IPCN (Real-time)
    ↓
Laporan Bulanan Otomatis (Excel/PDF)
    ↓
Direktur / Akreditasi
```

---

## 2. DATABASE SCHEMA & ERD

### 2.1 Entity Relationship Diagram

```
┌─────────────────┐
│ users           │
├─────────────────┤
│ id (PK)         │──┐
│ email           │  │
│ password_hash   │  │
│ nama_lengkap    │  │
│ role_id (FK)    │  │
│ ruangan_id (FK) │  │
│ is_active       │  │
│ created_at      │  │
└─────────────────┘  │
                     │
┌─────────────────┐  │      ┌──────────────────┐
│ roles           │◄─┘      │ ruangan          │
├─────────────────┤         ├──────────────────┤
│ id (PK)         │         │ id (PK)          │
│ nama_role       │         │ nama_ruangan     │
│ deskripsi       │         │ tipe_ruangan     │
│ permissions     │         │ kapasitas        │
└─────────────────┘         │ created_at       │
                            └──────────────────┘
                                     ▲
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                │
         ┌──────────┴──────┐  ┌──────┴───────────┐  ┌┴──────────────┐
         │ pasien          │  │ operasi          │  │ rawat_inap     │
         ├─────────────────┤  ├──────────────────┤  ├────────────────┤
         │ id (PK)         │  │ id (PK)          │  │ id (PK)        │
         │ nomor_rm        │  │ pasien_id (FK)   │  │ pasien_id (FK) │
         │ nama_pasien     │  │ tanggal_operasi  │  │ ruangan_id(FK) │
         │ ttl             │  │ jenis_operasi    │  │ dokter_id (FK) │
         │ gender          │  │ dokter_id (FK)   │  │ diagnosa_id(FK)│
         │ alamat          │  │ asa_score        │  │ tgl_masuk      │
         │ kontak_darurat  │  │ hasil_pathologi  │  │ tgl_keluar     │
         │ created_at      │  │ created_at       │  │ kode_infeksi   │
         └─────────────────┘  └──────────────────┘  │ status         │
                                                     │ created_at     │
                                                     └────────────────┘
                                                              ▲
                                                              │
                    ┌─────────────────┬──────────────────────┼──────────────┐
                    │                 │                      │              │
         ┌──────────┴──────┐  ┌───────┴────────┐  ┌─────────┴──────┐  ┌───┴──────────┐
         │ dokter          │  │ diagnosa       │  │ alat_terpasang │  │ surveilans_  │
         ├─────────────────┤  ├────────────────┤  ├────────────────┤  │ harian       │
         │ id (PK)         │  │ id (PK)        │  │ id (PK)        │  ├──────────────┤
         │ nama_dokter     │  │ kode_diagnosa  │  │ rawat_inap_id  │  │ id (PK)      │
         │ spesialisasi    │  │ nama_diagnosa  │  │ (FK)           │  │ rawat_inap_  │
         │ no_hp           │  │ kategori       │  │ jenis_alat     │  │ id (FK)      │
         │ created_at      │  │ created_at     │  │ tgl_pasang     │  │ tanggal      │
         └─────────────────┘  └────────────────┘  │ tgl_lepas      │  │ device_hari  │
                                                   │ alasan_lepas   │  │ ada_infeksi  │
                                                   │ created_at     │  │ jenis_infeksi│
                                                   └────────────────┘  │ created_at   │
                                                                       └──────────────┘
                                                              ▼
                                                   ┌──────────────────┐
                                                   │ kejadian_infeksi │
                                                   ├──────────────────┤
                                                   │ id (PK)          │
                                                   │ surveilans_id(FK)│
                                                   │ jenis_infeksi    │
                                                   │ tgl_deteksi      │
                                                   │ tanda_gejala     │
                                                   │ isolat           │
                                                   │ antibiotik_id(FK)│
                                                   │ status_verifikasi│
                                                   │ created_at       │
                                                   └──────────────────┘

┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│ antibiotik       │      │ penggunaan_      │      │ surveilans_      │
├──────────────────┤      │ antibiotik       │      │ bulanan          │
│ id (PK)          │◄─────├──────────────────┤      ├──────────────────┤
│ nama_antibiotik  │      │ id (PK)          │      │ id (PK)          │
│ kategori         │      │ rawat_inap_id(FK)│      │ ruangan_id (FK)  │
│ satuan_dosis     │      │ antibiotik_id(FK)│      │ bulan            │
│ created_at       │      │ mulai_tanggal    │      │ tahun            │
└──────────────────┘      │ akhir_tanggal    │      │ total_pasien     │
                          │ dosis            │      │ total_device_days│
                          │ rute             │      │ total_infeksi    │
                          │ waktu_pemberian  │      │ infection_rate   │
                          │ created_at       │      │ compliance_rate  │
                          └──────────────────┘      │ created_at       │
                                                    └──────────────────┘
```

### 2.2 Table Definitions

#### `roles`
```sql
CREATE TABLE roles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nama_role VARCHAR(50) UNIQUE NOT NULL,
  deskripsi TEXT,
  permissions JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### `ruangan`
```sql
CREATE TABLE ruangan (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nama_ruangan VARCHAR(100) NOT NULL,
  tipe_ruangan ENUM('ICU', 'HDU', 'HCU', 'GENERAL', 'IGD', 'OK') NOT NULL,
  kapasitas INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### `dokter`
```sql
CREATE TABLE dokter (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nama_dokter VARCHAR(100) NOT NULL,
  spesialisasi VARCHAR(100),
  no_hp VARCHAR(20),
  email VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### `diagnosa`
```sql
CREATE TABLE diagnosa (
  id INT PRIMARY KEY AUTO_INCREMENT,
  kode_diagnosa VARCHAR(10) NOT NULL UNIQUE,
  nama_diagnosa VARCHAR(200) NOT NULL,
  kategori VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### `users`
```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  nama_lengkap VARCHAR(100) NOT NULL,
  role_id INT NOT NULL,
  ruangan_id INT,
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id) REFERENCES roles(id),
  FOREIGN KEY (ruangan_id) REFERENCES ruangan(id)
);
```

#### `pasien`
```sql
CREATE TABLE pasien (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nomor_rm VARCHAR(20) UNIQUE NOT NULL,
  nama_pasien VARCHAR(100) NOT NULL,
  tanggal_lahir DATE,
  jenis_kelamin ENUM('L', 'P') NOT NULL,
  alamat TEXT,
  no_kontak_darurat VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### `rawat_inap`
```sql
CREATE TABLE rawat_inap (
  id INT PRIMARY KEY AUTO_INCREMENT,
  pasien_id INT NOT NULL,
  ruangan_id INT NOT NULL,
  dokter_id INT NOT NULL,
  diagnosa_id INT NOT NULL,
  tanggal_masuk DATE NOT NULL,
  tanggal_keluar DATE,
  kode_infeksi VARCHAR(50),
  status ENUM('AKTIF', 'SELESAI', 'REFERRAL') DEFAULT 'AKTIF',
  catatan TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (pasien_id) REFERENCES pasien(id),
  FOREIGN KEY (ruangan_id) REFERENCES ruangan(id),
  FOREIGN KEY (dokter_id) REFERENCES dokter(id),
  FOREIGN KEY (diagnosa_id) REFERENCES diagnosa(id),
  INDEX (status),
  INDEX (ruangan_id)
);
```

#### `alat_terpasang`
```sql
CREATE TABLE alat_terpasang (
  id INT PRIMARY KEY AUTO_INCREMENT,
  rawat_inap_id INT NOT NULL,
  jenis_alat ENUM('INFUS', 'KATETER_URINE', 'VENTILATOR', 'CENTRAL_LINE', 'TRAKEOSTOMI', 'DRAIN_LAIN') NOT NULL,
  tanggal_pasang DATE NOT NULL,
  tanggal_lepas DATE,
  alasan_lepas VARCHAR(200),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (rawat_inap_id) REFERENCES rawat_inap(id),
  INDEX (jenis_alat),
  INDEX (tanggal_pasang)
);
```

#### `surveilans_harian`
```sql
CREATE TABLE surveilans_harian (
  id INT PRIMARY KEY AUTO_INCREMENT,
  rawat_inap_id INT NOT NULL,
  tanggal DATE NOT NULL,
  infus_terpasang BOOLEAN,
  kateter_terpasang BOOLEAN,
  ventilator_terpasang BOOLEAN,
  central_line_terpasang BOOLEAN,
  trakeostomi_terpasang BOOLEAN,
  ada_infeksi BOOLEAN DEFAULT FALSE,
  jenis_infeksi VARCHAR(100),
  tanda_gejala TEXT,
  catatan TEXT,
  dibuat_oleh INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (rawat_inap_id) REFERENCES rawat_inap(id),
  FOREIGN KEY (dibuat_oleh) REFERENCES users(id),
  INDEX (tanggal),
  INDEX (ada_infeksi),
  UNIQUE KEY unique_daily_surveillance (rawat_inap_id, tanggal)
);
```

#### `kejadian_infeksi`
```sql
CREATE TABLE kejadian_infeksi (
  id INT PRIMARY KEY AUTO_INCREMENT,
  surveilans_harian_id INT NOT NULL,
  jenis_infeksi ENUM('ILO', 'ISK', 'HAP', 'VAP', 'IADP', 'PHLEBITIS', 'DEKUBITUS') NOT NULL,
  tanggal_deteksi DATE NOT NULL,
  hari_sakit_saat_deteksi INT,
  tanda_gejala TEXT,
  isolat VARCHAR(100),
  hasil_kultur VARCHAR(100),
  sensitifitas TEXT,
  antibiotik_id INT,
  status_verifikasi ENUM('PENDING', 'VERIFIED', 'REJECTED') DEFAULT 'PENDING',
  diverifikasi_oleh INT,
  tanggal_verifikasi DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (surveilans_harian_id) REFERENCES surveilans_harian(id),
  FOREIGN KEY (antibiotik_id) REFERENCES antibiotik(id),
  FOREIGN KEY (diverifikasi_oleh) REFERENCES users(id),
  INDEX (jenis_infeksi),
  INDEX (status_verifikasi),
  INDEX (tanggal_deteksi)
);
```

#### `operasi`
```sql
CREATE TABLE operasi (
  id INT PRIMARY KEY AUTO_INCREMENT,
  rawat_inap_id INT NOT NULL,
  tanggal_operasi DATE NOT NULL,
  jenis_operasi VARCHAR(200) NOT NULL,
  durasi_operasi INT,
  asa_score INT,
  estimasi_darah_hilang INT,
  transfusi_darah BOOLEAN,
  jenis_anestesi VARCHAR(100),
  lokasi_sayatan VARCHAR(100),
  hasil_pathologi TEXT,
  komplikasi TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (rawat_inap_id) REFERENCES rawat_inap(id),
  INDEX (tanggal_operasi)
);
```

#### `antibiotik`
```sql
CREATE TABLE antibiotik (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nama_antibiotik VARCHAR(100) NOT NULL,
  kategori VARCHAR(50),
  satuan_dosis VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_antibiotik (nama_antibiotik)
);
```

#### `penggunaan_antibiotik`
```sql
CREATE TABLE penggunaan_antibiotik (
  id INT PRIMARY KEY AUTO_INCREMENT,
  rawat_inap_id INT NOT NULL,
  antibiotik_id INT NOT NULL,
  tanggal_mulai DATE NOT NULL,
  tanggal_akhir DATE,
  dosis INT NOT NULL,
  satuan VARCHAR(50) NOT NULL,
  rute_pemberian ENUM('IV', 'IM', 'ORAL', 'TOPIKAL') NOT NULL,
  frekuensi VARCHAR(50),
  indikasi VARCHAR(200),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (rawat_inap_id) REFERENCES rawat_inap(id),
  FOREIGN KEY (antibiotik_id) REFERENCES antibiotik(id),
  INDEX (tanggal_mulai)
);
```

#### `surveilans_bulanan`
```sql
CREATE TABLE surveilans_bulanan (
  id INT PRIMARY KEY AUTO_INCREMENT,
  ruangan_id INT NOT NULL,
  bulan INT NOT NULL,
  tahun INT NOT NULL,
  total_pasien INT,
  total_device_days_infus INT,
  total_device_days_kateter INT,
  total_device_days_ventilator INT,
  total_infeksi_ilo INT,
  total_infeksi_isk INT,
  total_infeksi_hap INT,
  total_infeksi_vap INT,
  total_infeksi_iadp INT,
  total_phlebitis INT,
  total_dekubitus INT,
  infeksi_rate_ilo DECIMAL(10,2),
  infeksi_rate_isk DECIMAL(10,2),
  infeksi_rate_hap DECIMAL(10,2),
  infeksi_rate_vap DECIMAL(10,2),
  infeksi_rate_iadp DECIMAL(10,2),
  compliance_rate DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (ruangan_id) REFERENCES ruangan(id),
  UNIQUE KEY unique_monthly_report (ruangan_id, bulan, tahun),
  INDEX (tahun)
);
```

---

## 3. KEY FEATURES

### 3.1 Device Day Calculation
```
Device Day = Tanggal Lepas - Tanggal Pasang

Example:
Infus dipasang: 01-06-2026
Infus dilepas: 04-06-2026
Device Day = 4

Calculation Engine:
- Automatic calculation in database trigger
- Real-time calculation in application logic
- Aggregation for monthly report
```

### 3.2 Infection Rate Calculation
```
Infection Rate = (Total Infeksi / Device Days) × 1000

Example:
ISK Rate = (2 ISK / 50 Kateter Days) × 1000 = 40 per 1000 kateter days

Formula untuk setiap jenis alat:
- ILO Rate = (Total ILO / Total Device Days Pasien) × 1000
- ISK Rate = (Total ISK / Total Kateter Days) × 1000
- HAP Rate = (Total HAP / Total Ventilator Days) × 1000
- VAP Rate = (Total VAP / Total Ventilator Days) × 1000
- Phlebitis Rate = (Total Phlebitis / Total Infus Days) × 1000
```

### 3.3 Compliance Rate
```
Compliance Rate = (Total Hari Input / Total Hari Pasien Aktif) × 100%

Tracking:
- Input harian wajib oleh IPCLN
- Automatic flagging untuk missing days
- Alert untuk IPCN jika compliance < threshold
```

### 3.4 Real-time Dashboard IPCN
```
Per Ward Metrics:
- Pasien Aktif (count)
- Device Days (aggregated)
  - Infus Days
  - Kateter Days
  - Ventilator Days
- Infeksi Count (by type)
  - ILO
  - ISK
  - HAP
  - VAP
  - IADP
  - Phlebitis
  - Dekubitus
- Infection Rate (per 1000 device days)
- Compliance Rate

Dashboard RS Keseluruhan:
- Total Pasien Aktif (all wards)
- Total Device Days (all wards, by type)
- Total Infeksi (all types)
- Trend graphs (7 hari, 30 hari, 1 tahun)
- Comparison antar ruangan
```

---

## 4. TECHNOLOGY STACK

### 4.1 Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Components**: Shadcn UI
- **State Management**: React Query
- **Forms**: React Hook Form + Zod
- **Charts**: Chart.js / Recharts
- **Export**: SheetJS (Excel), html2pdf (PDF)

### 4.2 Backend
- **Framework**: Next.js API Routes
- **Language**: TypeScript
- **ORM**: Prisma
- **Authentication**: NextAuth.js v5
- **Validation**: Zod
- **File Upload**: Multer

### 4.3 Database
- **DBMS**: MySQL 8.0+
- **Connection**: Prisma Client

### 4.4 DevOps
- **Containerization**: Docker
- **Orchestration**: Docker Compose

---

## 5. PROJECT STRUCTURE

```
sistem-ppi-rs/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   ├── admin/
│   │   ├── ipcln/
│   │   └── ipcn/
│   ├── admin/
│   │   ├── dashboard/
│   │   ├── users/
│   │   ├── roles/
│   │   ├── ruangan/
│   │   ├── dokter/
│   │   └── diagnosa/
│   ├── ipcln/
│   │   ├── dashboard/
│   │   ├── pasien/
│   │   ├── surveilans/
│   │   ├── operasi/
│   │   ├── antibiotik/
│   │   ├── infeksi/
│   │   └── forms/
│   ├── ipcn/
│   │   ├── dashboard/
│   │   ├── monitoring/
│   │   ├── verifikasi/
│   │   ├── laporan/
│   │   └── export/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── ui/
│   ├── layouts/
│   ├── forms/
│   ├── charts/
│   └── shared/
├── lib/
│   ├── auth.ts
│   ├── db.ts
│   ├── utils.ts
│   ├── validations/
│   └── calculations/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── public/
├── styles/
├── middleware.ts
├── next.config.js
├── tsconfig.json
├── tailwind.config.js
├── .env.local
├── .env.example
├── docker-compose.yml
├── Dockerfile
└── README.md
```

---

## 6. AUTHENTICATION & AUTHORIZATION

### 6.1 NextAuth.js Configuration
- Email/Password authentication
- JWT session strategy
- Role-based access control (RBAC)
- Protected routes per role

### 6.2 Roles & Permissions
```
Admin:
- view_dashboard
- manage_users
- manage_roles
- manage_ruangan
- manage_dokter
- manage_diagnosa
- view_laporan

IPCN:
- view_dashboard_rs
- view_dashboard_ruangan
- verify_infeksi
- monitor_device_day
- monitor_compliance
- export_laporan
- view_grafik

IPCLN:
- input_pasien
- input_surveilans_harian
- input_operasi
- input_antibiotik
- input_infeksi
- view_pasien_sendiri
- view_surveilans_sendiri
```

---

## 7. API ENDPOINTS

### 7.1 Authentication
```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET /api/auth/session
POST /api/auth/refresh
```

### 7.2 Admin Endpoints
```
GET /api/admin/users
POST /api/admin/users
PUT /api/admin/users/:id
DELETE /api/admin/users/:id

GET /api/admin/roles
POST /api/admin/roles
PUT /api/admin/roles/:id

GET /api/admin/ruangan
POST /api/admin/ruangan
PUT /api/admin/ruangan/:id

GET /api/admin/dokter
POST /api/admin/dokter
PUT /api/admin/dokter/:id

GET /api/admin/diagnosa
POST /api/admin/diagnosa
PUT /api/admin/diagnosa/:id
```

### 7.3 IPCLN Endpoints
```
GET /api/ipcln/pasien
POST /api/ipcln/pasien
PUT /api/ipcln/pasien/:id
GET /api/ipcln/pasien/:id

GET /api/ipcln/rawat-inap
POST /api/ipcln/rawat-inap
PUT /api/ipcln/rawat-inap/:id
GET /api/ipcln/rawat-inap/:id

GET /api/ipcln/surveilans-harian
POST /api/ipcln/surveilans-harian
PUT /api/ipcln/surveilans-harian/:id

POST /api/ipcln/infeksi
PUT /api/ipcln/infeksi/:id

POST /api/ipcln/antibiotik
PUT /api/ipcln/antibiotik/:id

GET /api/ipcln/operasi
POST /api/ipcln/operasi
```

### 7.4 IPCN Endpoints
```
GET /api/ipcn/dashboard-rs
GET /api/ipcn/dashboard-ruangan/:id
GET /api/ipcn/monitoring/pasien-aktif
GET /api/ipcn/monitoring/device-day
GET /api/ipcn/monitoring/infeksi
GET /api/ipcn/monitoring/compliance

GET /api/ipcn/laporan/harian
GET /api/ipcn/laporan/bulanan
GET /api/ipcn/laporan/tahunan

POST /api/ipcn/export/excel
POST /api/ipcn/export/pdf

PUT /api/ipcn/verifikasi/infeksi/:id
```

---

## 8. SECURITY CONSIDERATIONS

1. **Authentication**: NextAuth.js v5 dengan JWT
2. **Authorization**: Role-based access control
3. **Database**: Prisma parameterized queries
4. **Validation**: Zod schema validation
5. **HTTPS**: Enforced in production
6. **CORS**: Configured for same-origin
7. **SQL Injection**: Protected by Prisma
8. **XSS**: Sanitized output by Next.js
9. **CSRF**: Protected by NextAuth.js
10. **Audit Trail**: Logging untuk sensitive operations

---

## 9. PERFORMANCE CONSIDERATIONS

1. **Caching**: React Query dengan invalidation strategy
2. **Database**: Indexed queries, connection pooling
3. **API**: Pagination, field selection
4. **Frontend**: Code splitting, lazy loading
5. **Images**: Optimization dengan Next.js Image
6. **Bundle**: Tree shaking, minification

---

## 10. DEPLOYMENT

### Docker Setup
- Node.js 20 LTS
- MySQL 8.0
- Environment variables
- Volume mounting
- Network configuration

### Environment Variables
```
DATABASE_URL="mysql://user:password@host:port/dbname"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"
JWT_SECRET="your-jwt-secret"
```

---

## 11. LAPORAN YANG DIHASILKAN

1. **Laporan Surveilans Harian**
   - Per pasien, per ruangan
   - Device status, tanda infeksi

2. **Laporan Surveilans Bulanan**
   - Per ruangan, per tipe infeksi
   - Device days aggregation
   - Infection rates

3. **Laporan IDO Harian**
   - Operasi yang dilakukan
   - ASA scoring

4. **Laporan Phlebitis Bulanan**
   - Detail phlebitis cases
   - Rate calculation
   - Isolat dan sensitifitas

5. **Dashboard Metrics**
   - Realtime update
   - Trend analysis
   - Comparison antar ruangan

---

## 12. TESTING STRATEGY

- Unit Tests: Jest
- Integration Tests: Prisma + Jest
- E2E Tests: Playwright
- API Tests: Supertest
- Performance Tests: k6

---

## 13. MAINTENANCE & MONITORING

- Database backups
- Log monitoring
- Performance monitoring
- Error tracking (Sentry)
- User activity audit trail

---

End of System Design Document
