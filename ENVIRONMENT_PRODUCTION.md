# Panduan Environment Production
## Sistem Surveilans PPI Rumah Sakit Budi Rahayu

---

## 1. Persyaratan Sistem

### Minimum Requirements
- **OS**: Windows Server 2019+ / Ubuntu 20.04+
- **Node.js**: v18+
- **RAM**: 4 GB+
- **Storage**: 20 GB+
- **Database**: SQLite (default) / PostgreSQL (opsional)

---

## 2. Langkah Instalasi Production

### 2.1 Clone / Copy Proyek
Salin seluruh file proyek ke server production.

### 2.2 Install Dependencies
```bash
npm install --production
```

### 2.3 Environment Variables
Buat file `.env.production`:
```
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-random-secret-key-here-min-32-chars
DATABASE_URL=file:./prod.db
```

### 2.4 Generate Prisma Client
```bash
npx prisma generate
```

### 2.5 Push Database Schema
```bash
npx prisma db push
```

### 2.6 Seed Data Awal (Opsional)
```bash
npx prisma db seed
```

### 2.7 Build Aplikasi
```bash
npm run build
```

### 2.8 Jalankan Aplikasi
```bash
npm start
```

---

## 3. Deploy Menggunakan Process Manager (PM2)

### Install PM2
```bash
npm install -g pm2
```

### Jalankan Aplikasi dengan PM2
```bash
pm2 start npm --name "ppi-system" -- start
```

### Perintah PM2 Lainnya
```bash
pm2 status               # Cek status
pm2 logs ppi-system      # Lihat log
pm2 restart ppi-system   # Restart
pm2 stop ppi-system      # Stop
pm2 delete ppi-system    # Hapus dari daftar
pm2 startup              # Auto start saat boot
pm2 save                 # Simpan konfigurasi
```

---

## 4. Backup Otomatis di Production

### Setup Windows Task Scheduler
1. Buka Task Scheduler
2. Buat Basic Task
3. Atur trigger (misal: daily jam 2 AM)
4. Pilih "Start a program"
5. Program: `C:\path\to\backup-database.bat`
6. Finish

### Setup Linux Cron
1. Edit crontab: `crontab -e`
2. Tambahkan baris:
   ```
   0 2 * * * cd /path/to/proyek && node backup-database.js >> /path/to/proyek/logs/cron-backup.log 2>&1
   ```
   (Backup harian jam 2 pagi)

---

## 5. Keamanan Production

- Gunakan HTTPS (SSL/TLS)
- Ganti `NEXTAUTH_SECRET` dengan random string
- Batasi akses ke folder `logs` dan `backups`
- Gunakan firewall untuk membatasi akses port
- Selalu backup sebelum update
- Monitor log secara berkala

---

## 6. Monitoring

- Lihat log aplikasi di `logs/system.log`
- Lihat log error di `logs/errors.log`
- Lihat log backup di `logs/backup.log`
- Akses halaman `/status` untuk monitoring real-time

---
*Versi 1.0 | Juni 2026*
