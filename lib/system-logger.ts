
import fs from "fs"
import path from "path"

const LOG_DIR = path.join(process.cwd(), "logs")
const LOG_FILE = path.join(LOG_DIR, "system.log")
const ERROR_LOG_FILE = path.join(LOG_DIR, "errors.log")

// Pastikan folder logs ada
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true })
}

type LogLevel = "INFO" | "WARN" | "ERROR" | "DEBUG" | "AUDIT"

const getTimestamp = () => new Date().toISOString()

export const systemLogger = {
  log: async (level: LogLevel, message: string, metadata?: any) => {
    const logEntry = {
      timestamp: getTimestamp(),
      level,
      message,
      metadata: metadata || {}
    }

    const logString = JSON.stringify(logEntry) + "\n"

    try {
      // Tulis ke log umum
      fs.appendFileSync(LOG_FILE, logString, "utf-8")

      // Jika level ERROR atau WARN, juga tulis ke error log khusus
      if (level === "ERROR" || level === "WARN") {
        fs.appendFileSync(ERROR_LOG_FILE, logString, "utf-8")
      }
    } catch (err) {
      console.error("Gagal menulis log:", err)
    }
  },

  info: (msg: string, meta?: any) => systemLogger.log("INFO", msg, meta),
  warn: (msg: string, meta?: any) => systemLogger.log("WARN", msg, meta),
  error: (msg: string, meta?: any) => systemLogger.log("ERROR", msg, meta),
  debug: (msg: string, meta?: any) => systemLogger.log("DEBUG", msg, meta),
  audit: (msg: string, meta?: any) => systemLogger.log("AUDIT", msg, meta)
}

// Contoh penggunaan:
// systemLogger.info("Aplikasi dimulai")
// systemLogger.audit("User login berhasil", { userId: 1, email: "admin@rs.com" })
// systemLogger.error("Gagal menyimpan data", { error: err.message, stack: err.stack })
