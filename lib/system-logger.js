
const fs = require("fs")
const path = require("path")

const LOG_DIR = path.join(process.cwd(), "logs")
const LOG_FILE = path.join(LOG_DIR, "system.log")
const ERROR_LOG_FILE = path.join(LOG_DIR, "errors.log")

// Pastikan folder logs ada
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true })
}

const getTimestamp = () => new Date().toISOString()

const log = (level, message, metadata) => {
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
}

const systemLogger = {
  log,
  info: (msg, meta) => log("INFO", msg, meta),
  warn: (msg, meta) => log("WARN", msg, meta),
  error: (msg, meta) => log("ERROR", msg, meta),
  debug: (msg, meta) => log("DEBUG", msg, meta),
  audit: (msg, meta) => log("AUDIT", msg, meta)
}

module.exports = systemLogger
