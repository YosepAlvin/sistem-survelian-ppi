# Audit Menyeluruh Alur Sistem PPI

Tanggal audit: 2026-06-09

## Scope Audit

Audit ini dilakukan tanpa menambahkan fitur baru. Fokus utama adalah verifikasi konsistensi data dari:
- alur surveilans harian,
- tracking HAIs event,
- hubungan database,
- dashboard,
- laporan,
- notifikasi,
- UI dan alur data.

## Metode Pemeriksaan

- Pemeriksaan langsung ke database SQLite melalui Prisma.
- Verifikasi endpoint API terkait.
- Pemeriksaan logika helper dan route yang memproses surveilans, snapshot alat, event infeksi, dan notifikasi.

---

## Ringkasan Eksekutif

Secara umum, struktur data inti sudah terhubung dengan baik, tetapi terdapat beberapa temuan konsistensi yang perlu segera diperbaiki:

- Terdapat duplikasi event infeksi pada satu pasien/jenis infeksi.
- Salah satu record snapshot alat memiliki tanggal lepas yang lebih awal dari tanggal pasang, sehingga riwayat perangkat tidak konsisten.
- Tidak ada data notifikasi yang tersimpan pada database saat ini.
- Dashboard dan laporan belum sepenuhnya dapat diverifikasi dalam konteks sesi login yang valid karena endpoint terkait mengembalikan nilai default nol saat request tidak terautentikasi.
- Tidak ada tabel audit trail terpisah; jejak audit saat ini hanya dibangun dari field metadata pada event infeksi.

---

## ✅ Modul yang Sudah Sinkron

- Relasi dasar antara Pasien → RawatInap → Surveilans Harian sudah terhubung.
- Relasi dasar antara RawatInap → AlatTerpasang sudah terhubung.
- Relasi dasar antara RawatInap → KejadianInfeksi sudah terhubung.
- Pengujian helper untuk tanggal surveilans dan notifikasi sudah berhasil melalui test runner.
- Endpoint health aplikasi berjalan normal: HTTP 200 pada /api/health.

---

## ⚠️ Modul yang Perlu Diperbaiki

1. Alur HAIs Event Tracking
   - Event infeksi dapat dibuat lebih dari satu kali untuk jenis yang sama pada satu rawat inap.
   - Status event cenderung menyimpan nilai REVIEW_REQUIRED yang kemudian diabaikan oleh logika laporan.

2. Device Snapshot & Device Days
   - Riwayat alat tidak selalu konsisten dari sisi timeline.
   - Field device_day masih bernilai null pada data yang ada, sehingga perhitungan device day belum sepenuhnya diisi.

3. Notifikasi
   - Tidak ada notifikasi yang tersimpan di database saat ini.
   - Alur pembuatan notifikasi belum terkonfirmasi memberikan record persist yang valid.

4. Audit Trail
   - Tidak ada model AuditTrail terpisah; audit berasal dari field metadata event infeksi.
   - Ini mengurangi ketajaman pelacakan perubahan dan verifikasi lintas modul.

5. Dashboard & Laporan
   - Endpoint statistik dashboard mengembalikan nilai nol saat request tidak terautentikasi.
   - Laporan bulanan saat ini memerlukan sesi login yang valid agar data bisa diambil.

---

## ❌ Data yang Tidak Konsisten

1. Duplikasi Event Infeksi
   - Terdapat 3 record event infeksi dengan jenis VAP untuk rawat inap 10.
   - Data ini menunjukkan potensi penyimpanan event yang sama lebih dari satu kali.

2. Timeline Alat Tidak Konsisten
   - Salah satu record alat terpasang memiliki tanggal lepas sebelum tanggal pasang.
   - Ini mengganggu interpretasi riwayat pemakaian alat dan perhitungan device day.

3. Notifikasi Belum Tersimpan
   - Jumlah notifikasi pada database saat ini adalah 0.
   - Ini berarti alur notifikasi yang dirancang belum menghasilkan record persist yang bisa dibaca kembali.

4. Status Event Tidak Sejalan dengan Laporan
   - Sebagian besar event infeksi berada dalam status REVIEW_REQUIRED dengan status_verifikasi VERIFIED.
   - Logika laporan saat ini memfilter event yang status-nya REVIEW_REQUIRED, sehingga event tersebut tidak masuk perhitungan laporan.

---

## 📊 Ringkasan Relasi Database

### Rekap jumlah data

- Total Pasien: 8
- Total Surveilans: 9
- Total Snapshot Alat: 9
- Total Event Infeksi: 11
- Total Audit Trail: 11 (saat ini berasal dari metadata event infeksi; bukan tabel terpisah)
- Total Notifikasi: 0

### Pemeriksaan relasi

Hasil pemeriksaan orphan/invalid relation:
- RawatInap tanpa Pasien: 0
- RawatInap tanpa Ruangan: 0
- Surveilans tanpa RawatInap: 0
- Snapshot alat tanpa RawatInap: 0
- Event infeksi tanpa RawatInap: 0
- Notifikasi dengan creator yang tidak valid: 0

Kesimpulan:
- Tidak ditemukan orphan record pada relasi inti yang diuji.
- Relasi foreign key secara umum valid.

---

## 📊 Ringkasan Data Dashboard

### Data yang berhasil diverifikasi dari database

- Total pasien: 8
- Total surveilans: 9
- Total snapshot alat: 9
- Total event infeksi: 11

### Perbandingan terhadap endpoint dashboard

- Endpoint dashboard statistik mengembalikan nilai default nol untuk request yang tidak terautentikasi.
- Hal ini menunjukkan bahwa hasil dashboard sangat bergantung pada konteks sesi pengguna.

Kesimpulan:
- Data sumber database ada, namun nilai dashboard belum bisa dipastikan konsisten untuk semua user tanpa sesi login yang valid.

---

## 📊 Ringkasan Data Laporan

### Data laporan yang terdeteksi

- Laporan bulanan memerlukan sesi login yang valid.
- Saat request tanpa autentikasi, endpoint mengembalikan 401 Unauthorized.
- Saat request terautentikasi, report logic akan memproses data berdasarkan event infeksi yang ada, namun status REVIEW_REQUIRED dapat menyebabkan event tidak masuk hitungan laporan.

### Temuan relevan

- Event infeksi yang sudah diverifikasi tetapi berada pada status REVIEW_REQUIRED tidak masuk ke logika perhitungan laporan karena filter status pada route laporan.
- Ini berarti laporan berpotensi undercount terhadap kasus infeksi yang seharusnya terlihat.

---

## 🔄 Hasil Pengujian End-to-End

### Skenario yang diuji

1. Pasien baru
   - Tersimpan sebagai data pasien dan rawat inap.

2. Tambah alat
   - Snapshot alat tersimpan.

3. Tambah alat baru di hari berikutnya
   - Data tersimpan sebagai record baru/riwayat alat.

4. Lepas alat
   - Ada record dengan tanggal lepas, tetapi pada satu kasus tanggal lepas lebih awal dari tanggal pasang.

5. Buat event infeksi
   - Event berhasil tersimpan, tetapi ada duplikasi untuk jenis yang sama.

6. Lanjutkan surveilans
   - Surveilans harian tersimpan dengan baik.

7. Tutup infeksi
   - Data status event secara umum ada, tetapi tidak semua event disinkronkan ke logika laporan.

8. Verifikasi IPCN
   - Data verifikasi ada, namun status event sering menjadi REVIEW_REQUIRED.

9. Cek dashboard
   - Nilai dashboard bergantung pada sesi; tanpa sesi nilai default nol.

10. Cek laporan
   - Laporan memerlukan autentikasi dan berpotensi mengabaikan event yang status-nya REVIEW_REQUIRED.

11. Cek audit trail
   - Audit trail saat ini bergantung pada metadata event, bukan tabel audit terpisah.

12. Cek notifikasi
   - Tidak ada data notifikasi tersimpan saat ini.

---

## Detail Temuan dan Rekomendasi

### Temuan 1 — Duplikasi event infeksi
- Bukti: query database menemukan 3 record VAP untuk rawat inap 10.
- Dampak: dashboard dan laporan dapat menghitung kasus yang sama lebih dari satu kali.
- Rekomendasi:
  - Tambahkan guard sebelum membuat event baru.
  - Gunakan unique constraint atau aturan bisnis yang mencegah event ganda per pasien per jenis infeksi dalam status aktif.

### Temuan 2 — Riwayat alat tidak konsisten
- Bukti: satu record alat terpasang memiliki tanggal lepas sebelum tanggal pasang.
- Dampak: riwayat alat dan device day tidak dapat dipercaya.
- Rekomendasi:
  - Periksa logic penutupan snapshot alat.
  - Normalisasi timeline sebelum menyimpan record baru.

### Temuan 3 — Device day belum terisi
- Bukti: field device_day pada record alat terpasang masih null.
- Dampak: angka device day pada dashboard/laporan bisa tidak akurat.
- Rekomendasi:
  - Jalankan proses kalkulasi device day secara konsisten.
  - Pastikan field ini dihitung dari interval pasang-lepas.

### Temuan 3b — Laporan menghitung device day dari jumlah record, bukan interval aktual
- Bukti: route laporan menghitung device day dari jumlah record alat yang ada, bukan dari interval pasang-lepas yang sebenarnya.
- Dampak: angka device day dan permil berpotensi over/under count.
- Rekomendasi:
  - Gunakan data interval aktual dari record alat terpasang untuk perhitungan device day.
  - Hindari menghitung hanya berdasarkan banyaknya snapshot.

### Temuan 4 — Notifikasi belum tersimpan
- Bukti: total notifikasi pada database = 0.
- Dampak: modul notifikasi tidak dapat diandalkan sebagai sumber informasi real-time.
- Rekomendasi:
  - Verifikasi trigger pembuatan notifikasi pada setiap event infeksi dan device alert.
  - Pastikan record notification benar-benar dibuat dan dapat dibaca oleh endpoint.

### Temuan 5 — Audit trail belum terpisah
- Bukti: schema tidak memiliki model AuditTrail terpisah; audit berasal dari field metadata event infeksi.
- Dampak: jejak perubahan tidak memiliki struktur yang kuat untuk audit forensik.
- Rekomendasi:
  - Tambahkan model AuditTrail atau log table yang mencatat perubahan status, verifikasi, dan tindakan user.

### Temuan 6 — Dashboard dan laporan bergantung pada sesi login
- Bukti: endpoint /api/ipcn/stats mengembalikan nilai nol saat tidak ada sesi; endpoint laporan mengembalikan 401 Unauthorized.
- Dampak: data yang ditampilkan dapat tidak konsisten saat konteks autentikasi tidak tersedia.
- Rekomendasi:
  - Uji dengan session IPCN yang valid dan pastikan data yang dikembalikan sesuai database.
  - Hindari menampilkan angka nol sebagai representasi data tanpa autentikasi.

---

## Alur Sistem Secara Keseluruhan

1. Pasien masuk rawat inap.
2. Petugas menginput surveilans harian.
3. Snapshot alat disimpan berdasarkan kondisi aktual per hari.
4. Event infeksi dapat dibuat saat surveilans mengindikasikan infeksi.
5. Event ini kemudian diverifikasi oleh IPCN.
6. Status event dan snapshot alat seharusnya tampil di dashboard, laporan, detail pasien, verifikasi, dan notifikasi.

### Kondisi saat ini
- Alur inti penyimpanan data berjalan.
- Namun ada celah pada deduplikasi event, konsistensi riwayat alat, pengisian device day, dan penyimpanan notifikasi.
- Karena itu, dashboard dan laporan masih memerlukan validasi lebih lanjut untuk memastikan angka yang ditampilkan benar-benar mencerminkan data database.

---

## Kesimpulan

Sistem PPI secara struktur sudah memiliki fondasi yang baik, tetapi masih ada beberapa titik yang perlu diperbaiki sebelum dapat dikatakan sepenuhnya konsisten end-to-end.

Prioritas perbaikan:
1. Deduplicate event infeksi.
2. Koreksi riwayat alat dan device day.
3. Pastikan notifikasi benar-benar tersimpan dan terbaca.
4. Sinkronkan logika status event antara dashboard, laporan, dan verifikasi.
5. Tambahkan struktur audit trail yang lebih kuat.
