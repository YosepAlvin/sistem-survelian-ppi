# Dokumen Arsitektur Sistem Final
## Sistem Surveilans PPI - RSU Budi Rahayu

Dokumen ini menjelaskan arsitektur teknis final dari Sistem Surveilans Pencegahan dan Pengendalian Infeksi (PPI) RSU Budi Rahayu.

### 1. Stack Teknologi
- **Frontend Framework**: [Next.js 15 (App Router)](https://nextjs.org/)
- **Programming Language**: [TypeScript](https://www.typescriptlang.org/)
- **UI Components**: [Radix UI](https://www.radix-ui.com/) + [Tailwind CSS](https://tailwindcss.com/)
- **State Management**: [React Query (TanStack Query)](https://tanstack.com/query/latest) & [SWR](https://swr.vercel.app/)
- **ORM**: [Prisma](https://www.prisma.io/)
- **Database**: [MySQL](https://www.mysql.com/) (Production) / [SQLite](https://www.sqlite.org/) (Development)
- **Autentikasi**: [NextAuth.js v5 (Beta)](https://authjs.dev/)
- **Validasi Data**: [Zod](https://zod.dev/)

### 2. Arsitektur Folder
```text
├── app/                  # Next.js App Router (Pages & API)
│   ├── admin/            # Modul Master Data & User Management
│   ├── ipcn/             # Modul Verifikasi & Laporan (IPCN)
│   ├── ipcln/            # Modul Input Data Harian (IPCLN)
│   ├── api/              # Backend API Endpoints
│   └── auth/             # Autentikasi (Login)
├── components/           # Reusable UI Components
│   ├── ui/               # Base UI Components (Atomic)
│   ├── layout/           # App Shell (Header, Sidebar)
│   └── forms/            # Complex Form Logic
├── lib/                  # Shared Utilities & Logic
│   ├── db.ts             # Prisma Client Instance
│   ├── auth.ts           # NextAuth Configuration
│   ├── calculations.ts   # HAI Rates Logic
│   └── audit-trail.ts    # Logging Utility
├── prisma/               # Database Schema & Migrations
└── public/               # Static Assets
```

### 3. Alur Kerja Sistem (System Workflow)
1. **Registrasi & Admission**: IPCLN mendaftarkan pasien dan membuat record rawat inap.
2. **Surveilans Harian**: IPCLN menginput data klinis harian dan status alat medis.
3. **Deteksi Infeksi**: Sistem secara otomatis mendeteksi potensi infeksi dan mengirim notifikasi ke IPCN.
4. **Verifikasi**: IPCN meninjau temuan dan melakukan verifikasi (Verify/Reject).
5. **Pelaporan**: Sistem menghitung rate infeksi (Phlebitis, ISK, VAP) secara real-time untuk dashboard dan laporan bulanan.

### 4. Keamanan & Otorisasi
- **RBAC (Role-Based Access Control)**: Akses dibatasi secara ketat berdasarkan peran pengguna di tingkat middleware dan API.
- **Audit Logging**: Setiap perubahan data penting (Create/Update/Delete/Verify) dicatat dalam tabel AuditTrail.
- **Data Protection**: Password di-hash menggunakan `bcryptjs` dan sesi dikelola menggunakan JWT yang aman.

---
*Generated: 2026-06-10 | Versi 1.0 Final*
