# Panduan Pengguna (User Manual)
## Sistem Surveilans PPI - RSU Budi Rahayu

Panduan ini ditujukan bagi pengguna dengan peran **IPCLN (Infection Prevention Control Link Nurse)** dan **IPCN (Infection Prevention Control Nurse)**.

---

### 1. Alur Penggunaan IPCLN (Petugas Ruangan)

#### A. Registrasi Pasien Baru
1. Login dengan akun IPCLN Anda.
2. Pilih menu **Registrasi Pasien** di Sidebar.
3. Klik tombol **Tambah Pasien Baru**.
4. Isi data: No RM, Nama, Diagnosa Awal, dan Tanggal Masuk.
5. Klik **Simpan Data Pasien**.

#### B. Input Surveilans Harian
1. Pada daftar pasien aktif, klik tombol **Input Harian**.
2. Masukkan data klinis (Suhu).
3. Pada bagian **Faktor Risiko**, centang alat medis yang terpasang pada hari ini.
   - *Penting: Jika alat sudah dilepas, jangan centang lagi agar sistem menghitung Device Day secara otomatis.*
4. Jika ditemukan tanda infeksi, centang jenis infeksi pada bagian **Komplikasi**.
5. Klik **Simpan Formulir**.

#### C. Melaporkan Infeksi
1. Jika ditemukan kasus infeksi yang jelas, gunakan menu **Lapor Infeksi**.
2. Isi form laporan dan klik **Simpan**. Laporan ini akan muncul di dashboard IPCN untuk diverifikasi.

---

### 2. Alur Penggunaan IPCN (Petugas PPI)

#### A. Dashboard Monitoring
1. Login dengan akun IPCN Anda.
2. Pantau metrik utama: Kasus Aktif, Menunggu Verifikasi, dan Alert Alat Medis.
3. Klik pada grafik atau kartu metrik untuk melihat detail data.

#### B. Verifikasi Kasus
1. Buka menu **Verifikasi Laporan**.
2. Pilih laporan dengan status "PENDING".
3. Review data yang diinput oleh IPCLN.
4. Klik **Verify** jika data valid, atau **Reject** dengan memberikan alasan jika data tidak valid.

#### C. Mengunduh Laporan
1. Buka menu **Laporan Bulanan**.
2. Pilih Bulan dan Tahun yang diinginkan.
3. Klik tombol **Export to Excel** atau **Export to PDF** untuk mendapatkan dokumen laporan resmi.

---

### 3. FAQ (Tanya Jawab)
- **Q: Mengapa saya tidak bisa mengakses menu Admin?**
  - A: Menu Admin hanya tersedia untuk pengguna dengan peran ADMIN.
- **Q: Apa yang dimaksud dengan Alert Alat Medis?**
  - A: Peringatan otomatis jika alat medis (seperti Kateter atau Ventilator) sudah terpasang melebihi ambang batas hari yang disarankan.
- **Q: Bagaimana jika saya salah menginput data harian?**
  - A: Anda dapat menginput kembali untuk hari yang sama, sistem akan memperbarui snapshot harian terakhir.

---
*Generated: 2026-06-10 | Versi 1.0 Final*
