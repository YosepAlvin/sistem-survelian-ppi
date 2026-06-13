const { readFile } = require("fs/promises")
const sqlite3 = require("sqlite3").verbose()
const path = require("path")

async function main() {
  const migrationPath = path.resolve(__dirname, "..", "prisma", "migrations", "20260605_add_audit_kejadianInfeksi", "migration.sql")
  const dbPath = path.resolve(__dirname, "..", "prisma", "dev.db")

  const sql = await readFile(migrationPath, "utf8")
  const db = new sqlite3.Database(dbPath)

  await new Promise((resolve, reject) => {
    db.exec(sql, (err) => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })

  db.close((err) => {
    if (err) {
      console.error("Failed to close database:", err)
    }
  })

  console.log("Migration applied successfully to", dbPath)
}

main().catch((error) => {
  console.error("Migration failed:", error)
  process.exit(1)
})
