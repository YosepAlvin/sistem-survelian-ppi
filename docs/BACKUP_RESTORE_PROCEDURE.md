# Prosedur Backup & Restore
## Sistem Surveilans PPI - RSU Budi Rahayu

Dokumen ini menjelaskan langkah-langkah untuk melakukan cadangan (backup) dan pemulihan (restore) data sistem.

---

### 1. Strategi Backup (MySQL Production)

Disarankan melakukan backup otomatis setiap hari (Daily Backup) pada jam tidak sibuk (misal: 02:00 AM).

#### Backup Manual via CLI:
Gunakan perintah `mysqldump` untuk mengekspor seluruh database:
```bash
mysqldump -u [username] -p[password] ppi_db > backup_ppi_$(date +%Y%m%d).sql
```

#### Backup via Docker:
Jika menggunakan Docker Compose:
```bash
docker exec ppi-db-container /usr/bin/mysqldump -u root --password=root_password ppi_db > backup_ppi.sql
```

### 2. Strategi Backup (SQLite Development)
Cukup salin file `prisma/dev.db` ke lokasi penyimpanan yang aman:
```bash
cp prisma/dev.db backups/dev_backup_$(date +%Y%m%d).db
```

### 3. Prosedur Restore (Pemulihan)

#### Restore ke MySQL:
1. Pastikan database target kosong atau buat database baru.
2. Jalankan perintah import:
```bash
mysql -u [username] -p[password] ppi_db < backup_ppi.sql
```

#### Restore ke SQLite:
1. Hapus file `dev.db` yang rusak.
2. Salin file cadangan dan ubah namanya menjadi `dev.db`:
```bash
cp backups/dev_backup_20260610.db prisma/dev.db
```

### 4. Backup Environment Variables
Jangan lupa untuk mencadangkan file `.env` secara manual, karena file ini berisi kunci rahasia (`NEXTAUTH_SECRET`) dan kredensial database yang sangat penting. **Jangan simpan cadangan .env di repositori publik.**

---
*Generated: 2026-06-10 | Versi 1.0 Final*
