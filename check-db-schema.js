
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Checking database schema for PenggunaanAntibiotik...');
  
  // For SQLite, we can use a raw query to get the table schema
  const tableInfo = await prisma.$queryRaw`PRAGMA table_info(PenggunaanAntibiotik)`;
  console.log('Current columns in PenggunaanAntibiotik:');
  console.log(tableInfo);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
