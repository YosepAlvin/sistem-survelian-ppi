# Data Dictionary Final
## Sistem Surveilans PPI - RSU Budi Rahayu

Dokumen ini merinci kamus data untuk tabel-tabel utama dalam database sistem PPI.

### 1. Tabel: `User`
Mengelola data pengguna sistem.

| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| `id` | Int (PK) | Auto-increment ID. |
| `name` | String | Nama lengkap pengguna. |
| `email` | String (Unique) | Alamat email untuk login. |
| `password` | String | Hash password (bcrypt). |
| `roleId` | Int (FK) | Referensi ke tabel `Role`. |
| `ruanganId`| Int (FK, Null) | Unit tugas (wajib untuk IPCLN). |
| `isActive` | Boolean | Status akun aktif/nonaktif. |

### 2. Tabel: `Pasien`
Data master pasien.

| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| `id` | Int (PK) | Auto-increment ID. |
| `no_rm` | String (Unique)| Nomor Rekam Medis (Format: XX-XX-XX). |
| `nama` | String | Nama lengkap pasien. |
| `tanggal_lahir`| DateTime | Tanggal lahir untuk perhitungan umur. |
| `jenis_kelamin`| String | Laki-laki / Perempuan. |

### 3. Tabel: `RawatInap`
Transaksi admission pasien.

| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| `id` | Int (PK) | Auto-increment ID. |
| `pasien_id` | Int (FK) | ID Pasien. |
| `ruangan_id`| Int (FK) | ID Ruangan saat ini. |
| `status` | String | AKTIF / KELUAR. |
| `tanggal_masuk`| DateTime | Tanggal mulai dirawat. |

### 4. Tabel: `AlatTerpasang`
Tracking alat medis.

| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| `id` | Int (PK) | Auto-increment ID. |
| `rawat_inap_id`| Int (FK) | Referensi ke Rawat Inap. |
| `jenis_alat` | String | Nama alat (Vena Sentra, Ventilator, dll). |
| `tanggal_pasang`| DateTime | Tanggal pemasangan alat. |
| `masih_terpasang`| Boolean | Status alat saat ini. |
| `device_day` | Int | Total hari alat terpasang. |

### 5. Tabel: `KejadianInfeksi`
Data kasus HAIs.

| Kolom | Tipe | Deskripsi |
|-------|------|-----------|
| `id` | Int (PK) | Auto-increment ID. |
| `jenis_infeksi`| String | Tipe (ISK, VAP, IADP, PLEBITIS, dll). |
| `status` | String | AKTIF / SELESAI. |
| `status_verifikasi`| String | PENDING / VERIFIED / REJECTED. |
| `tanggal_kejadian`| DateTime | Tanggal terdeteksi infeksi. |

---
*Generated: 2026-06-10 | Versi 1.0 Final*
