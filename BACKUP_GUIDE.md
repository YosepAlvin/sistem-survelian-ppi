# Panduan Backup & Restore Database
## Sistem Surveilans PPI Rumah Sakit Budi Rahayu

---

## 1. Backup Database Manual (Untuk Pengembangan)

### Langkah Backup SQLite:
1. Pastikan server tidak sedang mengakses database secara intensif
2. Salin file `prisma/dev.db` ke folder backup:
   ```bash
   # Contoh di Windows:
   copy "prisma\dev.db" "backups\dev.db.backup.%date:~-4%%date:~3,2%%date:~0,2%.%time:~0,2%%time:~3,2%.db"
   ```

---

## 2. Skrip Backup Otomatis (Windows)

Buat file `backup-database.bat` di root proyek:

```batch
@echo off
REM Skrip backup database Sistem PPI
REM Digunakan untuk otomatis backup harian

echo Memulai backup database...

REM Buat folder backups jika belum ada
if not exist "backups" mkdir backups

REM Format tanggal dan waktu untuk nama file
set "CUR_DATE=%date:~-4%%date:~3,2%%date:~0,2%_%time:~0,2%%time:~3,2%%time:~6,2%"
set "CUR_DATE=%CUR_DATE: =0%"
set "BACKUP_FILE=backups\ppi_database_backup_%CUR_DATE%.db"

REM Copy database ke folder backup
copy /Y "prisma\dev.db" "%BACKUP_FILE%"

echo Backup selesai!
echo File backup: %BACKUP_FILE%
echo.

REM Opsional: Hapus backup yang lebih lama dari 30 hari
forfiles /p backups /m ppi_database_backup_*.db /d -30 /c "cmd /c del @path"

echo Membersihkan backup lama selesai!
pause
```

---

## 3. Cara Restore Database

### Langkah Restore:
1. Pastikan server aplikasi dihentikan
2. Salin file backup ke `prisma/dev.db`:
   ```bash
   copy "backups\ppi_database_backup_20260618_143000.db" "prisma\dev.db"
   ```
3. Jalankan aplikasi kembali

---

## 4. Rekomendasi Jadwal Backup

| Lingkungan | Frekuensi | Penyimpanan |
|------------|-----------|-------------|
| Produksi   | Harian    | 30 hari     |
| Staging    | Mingguan  | 3 bulan     |
| Development | Sesuai kebutuhan | - |

---

## 5. Catatan Penting

- Selalu uji restore backup secara berkala
- Simpan backup di lokasi yang aman dan terpisah
- Jangan lupa backup sebelum perubahan besar
- Dokumentasikan setiap restore yang dilakukan

---
*Versi 1.0 | Juni 2026*