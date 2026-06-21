# Panduan Pengguna Sistem Surveilans PPI
## Rumah Sakit Budi Rahayu

---

## Daftar Isi
1. [Panduan Umum](#panduan-umum)
2. [Panduan Admin](#panduan-admin)
3. [Panduan IPCN](#panduan-ipcn)
4. [Panduan IPCLN](#panduan-ipcln)

---

## Panduan Umum

### Cara Login
1. Buka browser dan akses alamat sistem (misal: http://localhost:3000)
2. Klik tombol "Masuk ke Sistem" atau "Login"
3. Masukkan email dan password yang telah diberikan
4. Klik tombol "Login"
5. Jika berhasil, Anda akan diarahkan ke dashboard sesuai role

---

## Panduan Admin

### Fitur Admin
- Manajemen pengguna
- Manajemen ruangan
- Manajemen dokter
- Manajemen diagnosa
- Manajemen antibiotik
- Manajemen pasien
- Manajemen alat kesehatan
- Audit trail
- Laporan

### Cara Menambah Pengguna Baru
1. Login sebagai admin
2. Buka menu "Admin" → "Users"
3. Klik tombol "Tambah User"
4. Isi data pengguna (nama, email, password, role, ruangan)
5. Klik "Simpan"

### Cara Menambah Ruangan Baru
1. Login sebagai admin
2. Buka menu "Admin" → "Ruangan"
3. Klik "Tambah Ruangan"
4. Isi nama ruangan, kode, dan jenis
5. Klik "Simpan"

---

## Panduan IPCN

### Fitur IPCN
- Dashboard rumah sakit
- Monitoring pasien aktif
- Monitoring device day
- Verifikasi kasus infeksi
- Kasus aktif dan ditutup
- Grafik bulanan
- Laporan
- Notifikasi
- Keamanan audit

### Cara Verifikasi Kasus Infeksi
1. Login sebagai IPCN
2. Buka menu "Verifikasi"
3. Pilih kasus infeksi yang akan diverifikasi
4. Periksa detail kasus dengan seksama
5. Jika valid, klik "Verifikasi"
6. Jika tidak valid, klik "Tolak" dan berikan alasan

### Cara Melihat Laporan
1. Login sebagai IPCN
2. Buka menu "Laporan"
3. Pilih jenis laporan (harian, bulanan, IDO, dll.)
4. Pilih rentang tanggal atau bulan
5. Klik "Export" untuk mengunduh laporan

---

## Panduan IPCLN

### Fitur IPCLN
- Dashboard ruangan
- Manajemen pasien
- Surveilans harian
- Surveilans bulanan
- Operasi dan IDO
- Kejadian infeksi
- Antibiotik
- Saran alat

### Cara Menambah Pasien Baru
1. Login sebagai IPCLN
2. Buka menu "Pasien"
3. Klik tombol "Tambah Pasien"
4. Isi data pasien (nama, no RM, usia, jenis kelamin, diagnosa)
5. Klik "Simpan"

### Cara Mengisi Surveilans Harian
1. Login sebagai IPCLN
2. Buka menu "Surveilans Harian"
3. Pilih pasien yang akan diisi
4. Isi form surveilans sesuai formulir:
   - Suhu tubuh
   - Alat yang terpasang (UC, IVL, CVL, ETT/V)
   - Kejadian infeksi (ISK, Phlebitis, HAP, VAP, IADP)
   - Tirah baring dan dekubitus
   - Hasil kultur
   - Antibiotik
5. Klik "Simpan"

### Cara Mencatat Alat Medis
1. Login sebagai IPCLN
2. Buka detail pasien
3. Pilih "Alat Medis"
4. Klik "Pasang Alat"
5. Pilih jenis alat dan tanggal pasang
6. Klik "Simpan"
7. Saat alat dilepas, klik "Lepas Alat" dan isi tanggal lepas

---

## Tips Umum
- Selalu logout setelah selesai menggunakan sistem
- Jangan berikan email dan password kepada orang lain
- Isi data secara lengkap dan akurat
- Jika menemukan kesalahan, hubungi admin
- Periksa notifikasi secara berkala

---

## Kontak Bantuan
Jika mengalami kesulitan, hubungi:
- Admin Sistem
- Tim IPCN Rumah Sakit Budi Rahayu

---
*Versi 1.0 | Juni 2026*