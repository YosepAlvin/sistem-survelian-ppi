# Panduan Admin
## Sistem Surveilans PPI - RSU Budi Rahayu

Panduan ini ditujukan bagi Administrator Sistem untuk pengelolaan master data dan keamanan.

---

### 1. Pengelolaan Pengguna (User Management)
1. Login dengan akun ADMIN.
2. Navigasi ke **Data Master > User Management**.
3. **Tambah User**: Klik "Add User", masukkan Nama, Email, Password, dan tentukan Role.
   - *Penting: Untuk Role IPCLN, Anda wajib memilih Ruangan/Unit tugas.*
4. **Nonaktifkan User**: Jika petugas sudah tidak bertugas, ubah status menjadi "Nonaktif" daripada menghapus data untuk menjaga integritas audit log.

### 2. Pengelolaan Data Master
Admin bertanggung jawab menjaga keakuratan data master berikut:
- **Ruangan Unit**: Kelola daftar bangsal/ruangan di RS.
- **Dokter Spesialis**: Kelola daftar dokter DPJP.
- **Master Diagnosa**: Kelola kode ICD-10 yang digunakan sebagai diagnosa awal.

### 3. Konfigurasi Sistem
Melalui menu **System Settings**, Admin dapat:
- Mengatur ambang batas (threshold) hari pemasangan alat medis sebelum sistem mengirimkan alert.
- Mengelola konfigurasi email/notifikasi (jika diimplementasikan).

### 4. Audit Trail & Keamanan
1. Gunakan menu **Security Audit** (melalui role IPCN/Admin) untuk memantau log aktivitas.
2. Setiap tindakan kritikal (penghapusan data, verifikasi kasus) tercatat secara permanen di sini.
3. Pastikan `NEXTAUTH_SECRET` di file `.env` dirahasiakan dan diganti secara berkala.

---

### Troubleshooting Dasar
- **Masalah Login**: Pastikan email benar dan status user adalah "Aktif". Jika lupa password, Admin dapat mereset melalui database atau fitur edit user.
- **Data Tidak Muncul**: Pastikan koneksi database stabil. Periksa log server jika terjadi error 500.
- **Sinkronisasi Database**: Jika ada perubahan skema, jalankan `npx prisma generate` dan `npx prisma migrate deploy`.

---
*Generated: 2026-06-10 | Versi 1.0 Final*
