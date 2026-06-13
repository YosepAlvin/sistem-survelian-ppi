const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./prisma/dev.db');

db.all("SELECT name FROM sqlite_master WHERE type='table';", (err, tables) => {
  if (err) {
    console.error(err);
    return;
  }
  console.log("Tables:", tables.map(t => t.name).join(', '));
  db.all("SELECT * FROM _prisma_migrations", (err, migrations) => {
    if (err) {
      console.log("No _prisma_migrations table found or error reading it.");
    } else {
      console.log("Applied Migrations:", migrations.map(m => m.migration_name).join(', '));
    }
    db.close();
  });
});
