# Sistem Surveilans PPI Rumah Sakit Budi Rahayu

![Next.js](https://img.shields.io/badge/Next.js-15.0-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?style=flat-square&logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-5.8-2D3748?style=flat-square&logo=prisma)
![MySQL](https://img.shields.io/badge/MySQL-8.0-00758F?style=flat-square&logo=mysql)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.4-38B2AC?style=flat-square&logo=tailwind-css)

Sistem Surveilans Pencegahan dan Pengendalian Infeksi (PPI) Rumah Sakit yang dirancang untuk menghilangkan rekap manual dan mengotomasi seluruh proses pengumpulan data, monitoring, dan pelaporan infeksi nosokomial.

## 📋 Daftar Isi

- [Fitur Utama](#-fitur-utama)
- [Teknologi yang Digunakan](#-teknologi-yang-digunakan)
- [Prerequisites](#-prerequisites)
- [Instalasi](#-instalasi)
- [Konfigurasi Database](#-konfigurasi-database)
- [Menjalankan Aplikasi](#-menjalankan-aplikasi)
- [Docker Setup](#-docker-setup)
- [Struktur Proyek](#-struktur-proyek)
- [Panduan Pengguna](#-panduan-pengguna)
- [API Documentation](#-api-documentation)
- [Troubleshooting](#-troubleshooting)

## 🎯 Fitur Utama

### Core Features
- ✅ **Multi-role Authentication** - Admin, IPCN, IPCLN dengan role-based access control
- ✅ **Master Data Management** - Kelola user, ruangan, dokter, diagnosa
- ✅ **Patient Management** - Registrasi pasien baru dan tracking data rawat inap
- ✅ **Daily Surveillance** - Input surveilans harian per pasien
- ✅ **Device Day Calculation** - Kalkulasi otomatis device days untuk setiap alat
- ✅ **Infection Tracking** - Input dan verifikasi kasus infeksi
- ✅ **Real-time Dashboard** - Monitoring real-time per ruangan dan RS
- ✅ **Automated Reports** - Laporan harian, bulanan, dan tahunan otomatis
- ✅ **Excel/PDF Export** - Export data dan laporan ke format Excel dan PDF
- ✅ **Compliance Monitoring** - Tracking kepatuhan input surveilans

### Infection Types Supported
- ILO (Infeksi Luka Operasi)
- ISK (Infeksi Saluran Kemih)
- HAP (Hospital Acquired Pneumonia)
- VAP (Ventilator Associated Pneumonia)
- IADP (Infeksi Aliran Darah Primer)
- Phlebitis
- Dekubitus

### Device Types Supported
- Infus
- Kateter Urine
- Ventilator
- Central Line
- Trakeostomi
- Drain Lain

## 💻 Teknologi yang Digunakan

### Frontend
- **Next.js 15** - React framework dengan App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn UI** - Component library berbasis Radix UI
- **React Query** - Data fetching dan state management
- **React Hook Form** - Efficient form handling
- **Zod** - TypeScript-first schema validation
- **Recharts** - Data visualization
- **SheetJS** - Excel export
- **html2pdf** - PDF export

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **TypeScript** - Type-safe backend code
- **Prisma ORM** - Database abstraction layer
- **NextAuth.js v5** - Authentication solution
- **Zod** - Data validation

### Database
- **MySQL 8.0** - Relational database
- **Prisma** - ORM dan query builder

### DevOps
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration

## ⚙️ Prerequisites

- Node.js 20+ (recommended: 20.10 LTS)
- npm atau pnpm
- MySQL 8.0+
- Docker & Docker Compose (untuk Docker setup)

## 📦 Instalasi

### 1. Clone Repository
```bash
git clone <repository-url>
cd sistem-ppi-rs
```

### 2. Install Dependencies
```bash
npm install
# atau
pnpm install
```

### 3. Setup Environment Variables
```bash
cp .env.example .env.local
```

Edit `.env.local` dan sesuaikan konfigurasi database Anda:
```env
DATABASE_URL="mysql://user:password@localhost:3306/sistem_ppi_rs"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-a-secure-secret-key"
JWT_SECRET="generate-a-secure-jwt-key"
```

**Untuk generate secret key:**
```bash
openssl rand -base64 32
```

## 🗄️ Konfigurasi Database

### 1. Create Database
```bash
mysql -u root -p
```

```sql
CREATE DATABASE sistem_ppi_rs CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'ppi_user'@'localhost' IDENTIFIED BY 'ppi_password_123';
GRANT ALL PRIVILEGES ON sistem_ppi_rs.* TO 'ppi_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 2. Run Prisma Migrations
```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed initial data
npm run prisma:seed
```

## 🚀 Menjalankan Aplikasi

### Development Mode
```bash
npm run dev
```

Aplikasi akan berjalan di `http://localhost:3000`

### Production Build
```bash
npm run build
npm run start
```

### Lint & Type Check
```bash
npm run lint
npm run type-check
```

## 🐳 Docker Setup

### 1. Setup Environment
```bash
cp .env.example .env.docker
```

Edit `.env.docker` sesuai kebutuhan Anda.

### 2. Build dan Run dengan Docker Compose
```bash
docker-compose up -d
```

Aplikasi akan tersedia di:
- **Web App**: http://localhost:3000
- **phpMyAdmin**: http://localhost:8080

### 3. Stop Docker Compose
```bash
docker-compose down
```

### 4. View Docker Logs
```bash
docker-compose logs -f app
docker-compose logs -f mysql
```

## 📂 Struktur Proyek

```
sistem-ppi-rs/
├── app/                              # Next.js App Router
│   ├── api/                          # API Routes
│   │   ├── auth/                     # Authentication endpoints
│   │   ├── admin/                    # Admin endpoints
│   │   ├── ipcln/                    # IPCLN endpoints
│   │   └── ipcn/                     # IPCN endpoints
│   ├── admin/                        # Admin pages
│   │   ├── users/                    # User management
│   │   ├── ruangan/                  # Ward management
│   │   ├── dokter/                   # Doctor management
│   │   ├── diagnosa/                 # Diagnosis management
│   │   └── dashboard/                # Admin dashboard
│   ├── ipcln/                        # IPCLN pages
│   │   ├── pasien/                   # Patient management
│   │   ├── surveilans/               # Daily surveillance
│   │   ├── operasi/                  # Surgery records
│   │   ├── infeksi/                  # Infection reporting
│   │   ├── antibiotik/               # Antibiotic usage
│   │   └── dashboard/                # IPCLN dashboard
│   ├── ipcn/                         # IPCN pages
│   │   ├── dashboard/                # Main dashboard
│   │   ├── monitoring/               # Monitoring views
│   │   ├── verifikasi/               # Verification
│   │   ├── laporan/                  # Reports
│   │   └── export/                   # Export functions
│   ├── auth/                         # Authentication pages
│   │   ├── login/
│   │   └── register/
│   ├── layout.tsx                    # Root layout
│   ├── page.tsx                      # Root page
│   └── globals.css                   # Global styles
├── components/                       # React components
│   ├── ui/                           # Shadcn UI components
│   ├── layouts/                      # Layout components
│   ├── forms/                        # Form components
│   ├── charts/                       # Chart components
│   ├── shared/                       # Shared components
│   └── providers.tsx                 # Context providers
├── lib/                              # Utility functions
│   ├── auth.ts                       # NextAuth config
│   ├── db.ts                         # Prisma client
│   ├── utils.ts                      # Helper functions
│   ├── validations.ts                # Zod schemas
│   └── calculations.ts               # Business logic
├── prisma/                           # Prisma configuration
│   ├── schema.prisma                 # Database schema
│   ├── seed.ts                       # Database seeding
│   └── migrations/                   # Migration files
├── public/                           # Static assets
├── styles/                           # CSS files
├── middleware.ts                     # Next.js middleware
├── next.config.ts                    # Next.js config
├── tailwind.config.ts                # Tailwind config
├── tsconfig.json                     # TypeScript config
├── package.json                      # Dependencies
├── docker-compose.yml                # Docker config
├── Dockerfile                        # Docker image
├── .env.example                      # Environment template
├── SYSTEM_DESIGN.md                  # System design document
└── README.md                         # This file
```

## 👥 Panduan Pengguna

### Login Credentials (Setelah Seed)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@rs.com | admin123 |
| IPCN | ipcn@rs.com | admin123 |
| IPCLN ICU | ipcln.icu@rs.com | admin123 |

**⚠️ PENTING**: Ganti password ini setelah setup pertama!

### Admin Panel

#### User Management
1. Login dengan akun admin
2. Navigasi ke **Settings → User Management**
3. Klik **Add User** untuk menambah user baru
4. Isi form dan pilih role (Admin, IPCN, atau IPCLN)
5. Set ruangan untuk IPCLN users
6. Save

#### Master Data Management
- **Ruangan**: Tambah/edit/delete ward/room di rumah sakit
- **Dokter**: Kelola data dokter dan spesialisasinya
- **Diagnosa**: Kelola kode diagnosa dan deskripsi
- **Role**: Setup role dan permissions

### IPCLN Operations

#### Input Pasien Baru
1. Login dengan akun IPCLN
2. Navigasi ke **Pasien → Data Pasien**
3. Klik **Tambah Pasien**
4. Isi identitas pasien (Nama, No RM, Alamat, dll)
5. Click **Save**

#### Input Rawat Inap
1. Navigasi ke **Rawat Inap**
2. Klik **Admission Baru**
3. Pilih pasien, ruangan, dokter, diagnosa
4. Isi tanggal masuk
5. Jika ada alat yang terpasang, input di bagian devices
6. Save

#### Input Surveilans Harian
1. Navigasi ke **Surveilans → Harian**
2. Pilih tanggal dan pasien
3. Update status device yang terpasang
4. Jika ada infeksi, check **Ada Infeksi** dan pilih jenis
5. Input tanda gejala jika ada
6. Save

#### Report Infeksi
1. Jika ditemukan infeksi, navigasi ke **Input Infeksi**
2. Pilih jenis infeksi (ILO, ISK, HAP, VAP, IADP, Phlebitis, Dekubitus)
3. Input tanggal deteksi dan tanda gejala
4. Jika ada kultur, input hasil isolat dan sensitifitas
5. Pilih antibiotik yang diberikan
6. Save dan tunggu verifikasi IPCN

### IPCN Operations

#### Dashboard Monitoring
1. Login dengan akun IPCN
2. Lihat **Dashboard Utama** untuk overview RS
3. Klik ruangan untuk melihat detail per ward
4. Monitor:
   - Pasien aktif
   - Device days
   - Kejadian infeksi
   - Compliance rate

#### Verification
1. Navigasi ke **Verifikasi → Kasus Infeksi**
2. Filter infeksi dengan status "Pending"
3. Review data yang di-input oleh IPCLN
4. Verify atau reject dengan keterangan
5. Verified infeksi akan masuk dalam perhitungan laporan

#### Generate Reports
1. Navigasi ke **Laporan**
2. Pilih periode (harian/bulanan/tahunan)
3. Pilih ruangan atau semua ruangan
4. Klik **Generate Report**
5. Laporan akan ditampilkan dan bisa di-export ke Excel/PDF

#### Export Data
1. Navigasi ke **Export**
2. Pilih jenis laporan
3. Pilih format (Excel atau PDF)
4. Klik **Export**
5. File akan di-download ke komputer Anda

## 📊 API Documentation

### Authentication Endpoints

#### POST /api/auth/login
Login dengan email dan password

**Request:**
```json
{
  "email": "admin@rs.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "user": {
    "id": "1",
    "email": "admin@rs.com",
    "name": "Administrator",
    "role": "ADMIN"
  },
  "token": "jwt_token_here"
}
```

#### POST /api/auth/logout
Logout user

#### GET /api/auth/session
Get current user session

### Admin Endpoints

#### GET /api/admin/users
Get semua users

**Query Parameters:**
- `role`: Filter by role (optional)
- `ruanganId`: Filter by ward (optional)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

#### POST /api/admin/users
Create new user

**Request:**
```json
{
  "email": "user@rs.com",
  "password": "password123",
  "namaLengkap": "User Name",
  "roleId": 3,
  "ruanganId": 1
}
```

#### PUT /api/admin/users/:id
Update user

#### DELETE /api/admin/users/:id
Delete user

### IPCLN Endpoints

#### GET /api/ipcln/pasien
Get pasien list

#### POST /api/ipcln/pasien
Create new patient

#### GET /api/ipcln/surveilans-harian
Get daily surveillance

#### POST /api/ipcln/surveilans-harian
Create surveillance record

#### POST /api/ipcln/infeksi
Report infection case

### IPCN Endpoints

#### GET /api/ipcn/dashboard-rs
Get hospital-wide metrics

#### GET /api/ipcn/dashboard-ruangan/:id
Get ward-specific metrics

#### GET /api/ipcn/laporan/bulanan
Get monthly report

**Query Parameters:**
- `ruanganId`: Ward ID
- `bulan`: Month (1-12)
- `tahun`: Year

#### PUT /api/ipcn/verifikasi/infeksi/:id
Verify infection case

**Request:**
```json
{
  "statusVerifikasi": "VERIFIED"
}
```

#### POST /api/ipcn/export/excel
Export data to Excel

#### POST /api/ipcn/export/pdf
Export data to PDF

## 🔧 Troubleshooting

### Database Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:3306
```

**Solusi:**
1. Pastikan MySQL running: `mysql -u root -p`
2. Check `.env.local` DATABASE_URL
3. Pastikan database sudah dibuat: `CREATE DATABASE sistem_ppi_rs;`
4. Restart aplikasi

### Prisma Client Error
```
Error: @prisma/client can't find your schema file
```

**Solusi:**
```bash
npm run prisma:generate
```

### NextAuth Session Error
```
Error: JWTSignatureVerificationFailed
```

**Solusi:**
1. Generate secret key baru: `openssl rand -base64 32`
2. Update NEXTAUTH_SECRET dan JWT_SECRET di .env.local
3. Clear browser cookies
4. Restart aplikasi

### Docker Port Already in Use
```
Error: port is already allocated
```

**Solusi:**
```bash
# Stop yang pakai port 3000
lsof -ti:3000 | xargs kill -9

# Atau ganti port di docker-compose.yml
# Change "3000:3000" to "3001:3000"
```

### Permission Denied Error
```
Error: User does not have access to this resource
```

**Solusi:**
1. Pastikan user login dengan role yang tepat
2. Pastikan ruangan sudah di-assign untuk IPCLN
3. Check middleware.ts untuk access control rules

## 📝 Frequently Asked Questions

### Q: Bagaimana cara reset password user?
**A:** Admin bisa reset password user melalui User Management panel.

### Q: Berapa lama data disimpan?
**A:** Semua data disimpan di database MySQL dengan backup reguler.

### Q: Bisa akses dari remote?
**A:** Ya, dengan konfigurasi NEXTAUTH_URL ke domain Anda.

### Q: Bagaimana cara backup database?
```bash
mysqldump -u ppi_user -p sistem_ppi_rs > backup.sql
```

### Q: Bisa custom report format?
**A:** Ya, edit template di `components/reports/` sesuai kebutuhan.

## 🤝 Kontribusi

Kontribusi sangat diterima! Silakan buat pull request dengan:
1. Fork repository
2. Buat feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push ke branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 Lisensi

Project ini dilisensikan di bawah MIT License - lihat file LICENSE untuk detail.

## 📞 Kontak & Support

- **Email**: support@rsbudirahyu.com
- **WhatsApp**: +62-xxx-xxxx-xxxx
- **Office**: Jl. Rumah Sakit No. 1, Kota, Provinsi

---

**Dibuat dengan ❤️ oleh Tim IT Rumah Sakit Budi Rahayu**

Last Updated: 2026-06-04
Version: 1.0.0
