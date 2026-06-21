
const fs = require("fs")
const path = require("path")

const LOG_DIR = path.join(process.cwd(), "logs")
const BACKUP_DIR = path.join(process.cwd(), "backups")
const DB_PATH = path.join(process.cwd(), "prisma", "dev.db")

// Pastikan folder ada
if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true })
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true })

const logMessage = (msg, isError = false) => {
  const timestamp = new Date().toLocaleString("id-ID")
  const logStr = `[${timestamp}] ${isError ? "ERROR" : "INFO"}: ${msg}\n`
  console.log(logStr.trim())
  
  fs.appendFileSync(
    path.join(LOG_DIR, "backup.log"),
    logStr,
    "utf-8"
  )
}

const formatDateForFilename = () => {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, "0")
  const d = String(now.getDate()).padStart(2, "0")
  const h = String(now.getHours()).padStart(2, "0")
  const mi = String(now.getMinutes()).padStart(2, "0")
  const s = String(now.getSeconds()).padStart(2, "0")
  return `${y}${m}${d}_${h}${mi}${s}`
}

const deleteOldBackups = (daysOld = 30) => {
  try {
    const files = fs.readdirSync(BACKUP_DIR)
    const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000)
    let deleted = 0

    files.forEach(file => {
      if (!file.startsWith("ppi_database_backup_")) return
      const filePath = path.join(BACKUP_DIR, file)
      const stat = fs.statSync(filePath)
      
      if (stat.mtimeMs < cutoffTime) {
        fs.unlinkSync(filePath)
        deleted++
      }
    })

    if (deleted > 0) {
      logMessage(`Menghapus ${deleted} backup lama (lebih dari ${daysOld} hari)`)
    }
  } catch (err) {
    logMessage("Gagal membersihkan backup lama: " + err.message, true)
  }
}

const main = async () => {
  logMessage("Memulai proses backup database...")

  try {
    // Cek apakah database ada
    if (!fs.existsSync(DB_PATH)) {
      throw new Error(`File database tidak ditemukan: ${DB_PATH}`)
    }

    // Buat nama file backup
    const filename = `ppi_database_backup_${formatDateForFilename()}.db`
    const targetPath = path.join(BACKUP_DIR, filename)

    // Copy file database
    fs.copyFileSync(DB_PATH, targetPath)
    
    logMessage(`Backup sukses! File: ${filename}`)

    // Hapus backup lama
    deleteOldBackups(30)
    
    logMessage("Proses backup selesai!")

  } catch (err) {
    logMessage("Backup gagal: " + err.message, true)
    console.error(err)
    process.exit(1)
  }
}

main()
