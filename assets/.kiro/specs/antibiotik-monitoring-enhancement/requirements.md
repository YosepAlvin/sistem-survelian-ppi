# Requirements Document

## Introduction

Peningkatan modul Monitoring Antibiotik yang sudah ada untuk peran IPCN dan IPCLN di Sistem PPI RSU Budi Rahayu. Modul ini sudah memiliki fitur pencatatan, kalkulasi status otomatis, review IPCN, panel alert, filter, dan dukungan antibiotik restriksi. Peningkatan ini menambahkan tujuh kapabilitas baru — ekspor Excel bulanan, widget dashboard, notifikasi antibiotic, audit trail, grafik analitik, kartu ringkasan eksekutif, dan peningkatan UX — **tanpa mengubah alur kerja atau API yang sudah ada**.

## Glossary

- **Antibiotik_Monitor**: Sistem monitoring penggunaan antibiotik pada modul IPCN/IPCLN
- **PenggunaanAntibiotik**: Model Prisma yang merepresentasikan satu sesi terapi antibiotik untuk seorang pasien
- **IPCLN**: Infection Prevention and Control Link Nurse — tenaga kesehatan yang mencatat data di ruangan
- **IPCN**: Infection Prevention and Control Nurse — perawat senior yang melakukan review
- **Status_Terapi**: Salah satu dari lima nilai yang dihitung secara otomatis: `AKTIF`, `AKAN_SELESAI`, `OVERDUE`, `PERLU_REVIEW`, `SELESAI`
- **Export_Service**: Bagian backend yang menghasilkan data untuk ekspor Excel multi-lembar
- **Analytics_Service**: Endpoint backend `/api/antibiotik/analytics` yang menghitung data agregat untuk grafik
- **Notification_Generator**: Endpoint backend `/api/antibiotik/notifications/generate` yang membuat atau memperbarui notifikasi antibiotik
- **Audit_Recorder**: Logika backend yang mencatat perubahan `PenggunaanAntibiotik` ke model `AuditTrail`
- **AuditTrailViewer**: Komponen React yang sudah ada untuk menampilkan entri riwayat aktivitas
- **StatCard**: Komponen React yang sudah ada dengan dukungan `title`, `value`, `description`, `icon`, `color`, dan `onClick`
- **Workbook**: File Excel multi-lembar yang dihasilkan oleh `exportMultiSheetExcel`
- **Ruangan**: Unit atau bangsal rumah sakit yang terhubung ke pasien melalui `RawatInap`

---

## Requirements

### Requirement 1: Ekspor Laporan Excel Bulanan

**User Story:** Sebagai IPCN, saya ingin mengekspor data penggunaan antibiotik bulanan ke Excel, agar saya dapat menganalisis tren dan membuat laporan untuk manajemen.

#### Acceptance Criteria

1. WHEN pengguna membuka halaman `/ipcln/antibiotik`, THE Antibiotik_Monitor SHALL menampilkan tombol "Export Excel" di sebelah tombol "Catat Antibiotik Baru" di area header halaman.

2. WHEN pengguna mengklik tombol "Export Excel", THE Antibiotik_Monitor SHALL menampilkan modal ekspor dengan input pilihan: Bulan (1–12), Tahun, Ruangan (opsional), dan Antibiotik (opsional).

3. WHEN pengguna mengklik tombol konfirmasi ekspor, THE Antibiotik_Monitor SHALL menampilkan label loading "Sedang membuat laporan..." dan menonaktifkan tombol konfirmasi selama proses berlangsung.

4. WHEN Export_Service menerima permintaan dengan parameter bulan dan tahun, THE Export_Service SHALL memfilter catatan `PenggunaanAntibiotik` berdasarkan bulan dan tahun dari `tanggal_mulai`, lalu mengembalikan data empat lembar.

5. WHEN parameter `ruangan` disertakan dalam permintaan ekspor, THE Export_Service SHALL memfilter catatan lebih lanjut sehingga hanya catatan yang `rawat_inap.ruangan.nama` cocok dengan nilai parameter yang disertakan.

6. WHEN parameter `antibiotik` disertakan dalam permintaan ekspor, THE Export_Service SHALL memfilter catatan lebih lanjut sehingga hanya catatan yang `antibiotik.nama` cocok dengan nilai parameter yang disertakan.

7. THE Export_Service SHALL mengembalikan Sheet 1 ("Detail Penggunaan") dengan kolom: Tanggal Input, No RM, Nama Pasien, Ruangan, Diagnosa, Antibiotik, Dosis, Tanggal Mulai, Tanggal Selesai, Hari Ke, Status.

8. THE Export_Service SHALL mengembalikan Sheet 2 ("Ringkasan") yang dikelompokkan per nama antibiotik, dengan kolom: Nama Antibiotik, Jumlah Pasien, Total Hari Penggunaan, Jumlah Kasus Review.

9. THE Export_Service SHALL mengembalikan Sheet 3 ("Monitoring IPCN") dengan baris untuk setiap nilai Status_Terapi (Aktif, Akan Selesai, Overdue, Perlu Review, Selesai) beserta jumlahnya.

10. THE Export_Service SHALL mengembalikan Sheet 4 ("Review IPCN") yang hanya berisi catatan yang memerlukan review, dengan kolom: Nama Pasien, Antibiotik, Alasan Review, Catatan IPCN, Rekomendasi IPCN, Tanggal Review.

11. WHEN ekspor berhasil, THE Antibiotik_Monitor SHALL mengunduh file `.xlsx` dengan nama format `Laporan Antibiotik {bulan}-{tahun}.xlsx` dan menampilkan notifikasi toast sukses.

12. IF Export_Service mengembalikan respons error, THEN THE Antibiotik_Monitor SHALL menampilkan notifikasi toast error dan mengembalikan tombol ekspor ke keadaan aktif.

---

### Requirement 2: Widget Monitoring Antibiotik di Dashboard IPCLN

**User Story:** Sebagai IPCLN, saya ingin melihat ringkasan status antibiotik di dashboard, agar saya dapat langsung mengetahui kasus yang membutuhkan perhatian tanpa harus membuka halaman terpisah.

#### Acceptance Criteria

1. THE Antibiotik_Monitor SHALL menampilkan widget monitoring antibiotik pada halaman `/ipcln/dashboard` yang menggunakan komponen `StatCard` yang sudah ada.

2. THE Antibiotik_Monitor SHALL menampilkan empat status dalam widget: Terapi Aktif, Akan Selesai, Overdue, dan Perlu Review IPCN — menggunakan nilai dari endpoint `/api/ipcln/stats` yang sudah ada (`antibiotics.aktif`, `antibiotics.akanSelesai`, `antibiotics.overdue`, `antibiotics.perluReview`).

3. WHEN pengguna mengklik widget antibiotik di dashboard, THE Antibiotik_Monitor SHALL menavigasi pengguna ke halaman `/ipcln/antibiotik`.

4. THE Antibiotik_Monitor SHALL menampilkan nilai sub-status (Akan Selesai, Overdue, Perlu Review) sebagai teks deskripsi dengan format pill-style dalam properti `description` pada `StatCard`, konsisten dengan pola yang sudah ada pada `StatCard` "Monitoring Antibiotik" di dashboard.

---

### Requirement 3: Notifikasi Antibiotik di Notification Center

**User Story:** Sebagai IPCN, saya ingin menerima notifikasi otomatis untuk kasus antibiotik kritis, agar saya tidak melewatkan kasus yang membutuhkan review atau tindakan segera.

#### Acceptance Criteria

1. THE Notification_Generator SHALL membuat atau memperbarui entri `Notification` di database untuk setiap `PenggunaanAntibiotik` aktif yang memiliki Status_Terapi `OVERDUE`, `AKAN_SELESAI`, atau `PERLU_REVIEW`.

2. WHEN Status_Terapi adalah `OVERDUE`, THE Notification_Generator SHALL membuat notifikasi dengan pesan: `"⚠ [NamaAntibiotik] pasien [NamaPasien] telah melewati tanggal selesai."` dan `type: "ANTIBIOTIC_ALERT"`, `category: "antibiotik"`.

3. WHEN Status_Terapi adalah `AKAN_SELESAI`, THE Notification_Generator SHALL membuat notifikasi dengan pesan: `"⏳ [NamaAntibiotik] pasien [NamaPasien] akan selesai besok."` dan `type: "ANTIBIOTIC_ALERT"`, `category: "antibiotik"`.

4. WHEN Status_Terapi adalah `PERLU_REVIEW`, THE Notification_Generator SHALL membuat notifikasi dengan pesan: `"🔍 [NamaAntibiotik] pasien [NamaPasien] memerlukan review IPCN."` dan `type: "ANTIBIOTIC_ALERT"`, `category: "antibiotik"`.

5. THE Notification_Generator SHALL menggunakan field `relatedEntityType: "PenggunaanAntibiotik"` dan `relatedEntityId: [id]` pada setiap notifikasi yang dibuat, sehingga notifikasi dapat dilacak ke catatan asal.

6. THE Notification_Generator SHALL menghindari duplikasi dengan memeriksa apakah notifikasi dengan `relatedEntityType: "PenggunaanAntibiotik"`, `relatedEntityId`, dan `type` yang sama sudah ada sebelum membuat entri baru.

7. WHEN endpoint `POST /api/antibiotik/notifications/generate` dipanggil, THE Notification_Generator SHALL memproses seluruh catatan `PenggunaanAntibiotik` aktif dan mengembalikan respons JSON yang berisi jumlah notifikasi yang dibuat dan dilewati.

8. WHILE notifikasi antibiotik belum dibaca (`isRead: false`), THE AppHeader SHALL menyertakan notifikasi tersebut dalam `unreadCount` yang ditampilkan pada badge ikon bell, menggunakan endpoint `/api/notifications?unread=1` yang sudah ada.

---

### Requirement 4: Audit Trail untuk Aktivitas Antibiotik

**User Story:** Sebagai IPCN/administrator, saya ingin melihat riwayat semua aktivitas pada catatan antibiotik, agar saya dapat memverifikasi perubahan dan mempertahankan jejak audit yang lengkap.

#### Acceptance Criteria

1. WHEN `PenggunaanAntibiotik` baru dibuat melalui `POST /api/antibiotik`, THE Audit_Recorder SHALL menyimpan entri `AuditTrail` dengan `action: "CREATE"`, `moduleName: "antibiotik"`, `entityType: "PenggunaanAntibiotik"`, `entityId: [id yang baru dibuat]`, dan `newValue` berupa ringkasan terapi (nama antibiotik dan pasien).

2. WHEN `PenggunaanAntibiotik` diperbarui pada field tertentu melalui `PUT /api/antibiotik`, THE Audit_Recorder SHALL menyimpan satu entri `AuditTrail` per field yang berubah dengan `action: "UPDATE"`, `field: [nama field]`, `previousValue: [nilai lama]`, dan `newValue: [nilai baru]`.

3. WHEN terapi ditandai selesai melalui `PUT /api/antibiotik` dengan `markComplete: true`, THE Audit_Recorder SHALL menyimpan entri `AuditTrail` dengan `action: "COMPLETE"` dan `newValue` berisi tanggal selesai yang diset.

4. WHEN IPCN menyimpan catatan review melalui `PUT /api/antibiotik` dengan `is_review: true`, THE Audit_Recorder SHALL menyimpan entri `AuditTrail` dengan `action: "REVIEW"`, `field: "catatan_ipcn"`, dan `newValue` berisi catatan IPCN yang dimasukkan.

5. THE Audit_Recorder SHALL mengisi `userId` dan `userName` dari sesi pengguna yang sedang aktif untuk setiap entri `AuditTrail` yang dibuat.

6. THE Antibiotik_Monitor SHALL menambahkan tab "Riwayat Aktivitas" pada modal Detail di halaman `/ipcln/antibiotik`, di sebelah konten detail yang sudah ada.

7. WHEN pengguna membuka tab "Riwayat Aktivitas" pada modal Detail, THE Antibiotik_Monitor SHALL menampilkan daftar entri `AuditTrail` dengan `entityType: "PenggunaanAntibiotik"` dan `entityId` sesuai catatan yang dipilih, mengikuti pola tampilan `AuditTrailViewer` yang sudah ada.

8. IF tidak ada entri `AuditTrail` untuk catatan yang dipilih, THEN THE Antibiotik_Monitor SHALL menampilkan pesan "Belum ada riwayat aktivitas untuk catatan ini."

---

### Requirement 5: Grafik Analitik Penggunaan Antibiotik

**User Story:** Sebagai IPCN, saya ingin melihat grafik tren penggunaan antibiotik, agar saya dapat mengidentifikasi pola dan mengambil keputusan berbasis data.

#### Acceptance Criteria

1. THE Analytics_Service SHALL menyediakan endpoint `GET /api/antibiotik/analytics` yang mengembalikan data agregat: tren penggunaan bulanan (12 bulan terakhir), top 10 antibiotik terbanyak digunakan, distribusi Status_Terapi saat ini, dan distribusi penggunaan per ruangan.

2. WHEN endpoint `/api/antibiotik/analytics` dipanggil, THE Analytics_Service SHALL menghitung data tren bulanan dengan mengelompokkan `PenggunaanAntibiotik` berdasarkan bulan dan tahun dari `tanggal_mulai` selama 12 bulan terakhir.

3. WHEN endpoint `/api/antibiotik/analytics` dipanggil, THE Analytics_Service SHALL menghitung top 10 antibiotik berdasarkan jumlah catatan `PenggunaanAntibiotik` yang terhubung ke setiap `Antibiotik`.

4. WHEN endpoint `/api/antibiotik/analytics` dipanggil, THE Analytics_Service SHALL menghitung distribusi Status_Terapi saat ini (AKTIF, AKAN_SELESAI, OVERDUE, PERLU_REVIEW, SELESAI) menggunakan logika kalkulasi status yang sama dengan `GET /api/antibiotik`.

5. WHEN endpoint `/api/antibiotik/analytics` dipanggil, THE Analytics_Service SHALL menghitung jumlah catatan `PenggunaanAntibiotik` per ruangan berdasarkan `rawat_inap.ruangan.nama`.

6. THE Antibiotik_Monitor SHALL menampilkan bagian analitik pada halaman `/ipcln/antibiotik` yang berisi empat grafik menggunakan library Recharts yang sudah terinstal: bar chart vertikal untuk tren bulanan, bar chart horizontal untuk top 10 antibiotik, pie chart untuk distribusi status, dan bar chart per ruangan.

7. WHEN data Analytics_Service belum dimuat, THE Antibiotik_Monitor SHALL menampilkan state loading yang sesuai pada area grafik.

8. IF Analytics_Service mengembalikan respons error, THEN THE Antibiotik_Monitor SHALL menampilkan pesan error yang informatif di area grafik tanpa mengganggu fungsi tabel utama.

---

### Requirement 6: Kartu Ringkasan Eksekutif

**User Story:** Sebagai IPCN, saya ingin melihat metrik ringkasan tingkat tinggi di halaman antibiotik atau dashboard, agar saya dapat memantau kinerja program antibiotik secara sekilas.

#### Acceptance Criteria

1. THE Antibiotik_Monitor SHALL menampilkan enam kartu ringkasan eksekutif menggunakan komponen `StatCard` yang sudah ada: Total Penggunaan Antibiotik Bulan Ini, Total Antibiotik Restriksi (aktif), Total Kasus Perlu Review, Total Kasus Overdue, Total Review IPCN Selesai (memiliki `tanggal_review`).

2. THE Analytics_Service SHALL menyertakan data untuk keenam metrik ringkasan eksekutif dalam respons endpoint `/api/antibiotik/analytics`, sehingga hanya satu pemanggilan API yang diperlukan untuk memuat seluruh bagian analitik.

3. WHEN nilai kartu ringkasan adalah nol, THE Antibiotik_Monitor SHALL tetap menampilkan kartu dengan nilai "0" agar konsistensi tata letak terjaga.

---

### Requirement 7: Peningkatan UX

**User Story:** Sebagai IPCLN/IPCN, saya ingin interaksi yang lebih informatif dan umpan balik visual yang jelas, agar saya dapat menggunakan modul dengan lebih efisien.

#### Acceptance Criteria

1. WHEN pengguna mengarahkan kursor ke badge status pada tabel atau modal, THE Antibiotik_Monitor SHALL menampilkan tooltip yang menjelaskan makna setiap Status_Terapi: AKTIF ("Terapi sedang berjalan"), AKAN_SELESAI ("Terapi berakhir dalam 2 hari ke depan"), OVERDUE ("Tanggal selesai telah terlewat"), PERLU_REVIEW ("Memerlukan evaluasi IPCN"), SELESAI ("Terapi telah diselesaikan").

2. WHEN tabel penggunaan antibiotik tidak memiliki data setelah filter diterapkan, THE Antibiotik_Monitor SHALL menampilkan pesan empty state: "Belum ada penggunaan antibiotik yang tercatat." di area tengah tabel.

3. WHEN tabel penggunaan antibiotik tidak memiliki data karena filter aktif tidak menghasilkan hasil, THE Antibiotik_Monitor SHALL menampilkan pesan empty state: "Tidak ada data yang sesuai dengan filter yang dipilih." di area tengah tabel.

4. THE Antibiotik_Monitor SHALL mempertahankan state loading "Sedang membuat laporan..." pada tombol ekspor selama proses ekspor berlangsung (sudah diimplementasikan, harus dipertahankan saat refactoring).
