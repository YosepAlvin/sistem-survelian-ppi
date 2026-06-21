# UAT (User Acceptance Testing) Checklist
## Sistem Surveilans PPI Rumah Sakit Budi Rahayu

---

## 1. Persiapan Testing

- [ ] Lingkungan testing sudah disiapkan
- [ ] Data testing sudah disiapkan (user test
- [ ] Tim tester sudah ditentukan (Admin, IPCN, IPCLN)
- [ ] Dokumentasi panduan pengguna sudah siap

---

## 2. Testing Fitur Login & Hak Akses

### 2.1 Login
- [ ] Login admin berhasil
- [ ] Login IPCN berhasil
- [ ] Login IPCLN berhasil
- [ ] Login dengan password salah menampilkan error
- [ ] Logout berhasil
- [ ] Session timeout berfungsi

### 2.2 Hak Akses
- [ ] Admin dapat mengakses menu Admin
- [ ] IPCN tidak dapat mengakses menu Admin
- [ ] IPCLN tidak dapat mengakses menu Admin

---

## 3. Testing Fitur Admin

- [ ] Menambah user baru
- [ ] Mengedit user
- [ ] Menghapus user
- [ ] Menambah ruangan
- [ ] Menambah dokter
- [ ] Menambah diagnosa
- [ ] Menambah antibiotik
- [ ] Melihat audit trail

---

## 4. Testing Fitur IPCLN

### 4.1 Pasien
- [ ] Menambah pasien baru
- [ ] Melihat daftar pasien
- [ ] Melihat detail pasien
- [ ] Mengedit data pasien

### 4.2 Surveilans
- [ ] Mengisi surveilans harian
- [ ] Mengedit surveilans harian
- [ ] Melihat riwayat surveilans

### 4.3 Alat Medis
- [ ] Mencatat pemasangan alat
- [ ] Mencatat pelepasan alat
- [ ] Melihat device day

### 4.4 Kejadian Infeksi
- [ ] Mencatat kejadian infeksi
- [ ] Mengedit kejadian infeksi

---

## 5. Testing Fitur IPCN

### 5.1 Verifikasi
- [ ] Melihat daftar kasus infeksi
- [ ] Verifikasi kasus infeksi (setujui)
- [ ] Menolak kasus infeksi
- [ ] Memberikan alasan penolakan

### 5.2 Laporan
- [ ] Melihat dashboard
- [ ] Melihat laporan harian
- [ ] Melihat laporan bulanan
- [ ] Export laporan Excel

---

## 6. Testing Fitur Umum

- [ ] Notifikasi berfungsi
- [ ] Animasi loading berfungsi
- [ ] Tampilan mobile berfungsi
- [ ] Tampilan desktop berfungsi
- [ ] Halaman FAQ dapat diakses
- [ ] Halaman status sistem dapat diakses

---

## 7. Testing Database & Backup

- [ ] Backup database berhasil
- [ ] Restore database berhasil
- [ ] Data tidak hilang setelah restore

---

## 8. Catatan Testing

| Tanggal | Tester | Catatan | Status |
|---------|--------|----------|--------|
|         |        |          |        |
|         |        |          |        |

---

## 9. Tanda Tangan

| Peran | Nama | Tanggal | Tanda Tangan |
|-------|------|---------|--------------|
| Admin |      |         |              |
| IPCN  |      |         |              |
| IPCLN |      |         |              |

---
*Versi 1.0 | Juni 2026*
