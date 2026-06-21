
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Fixing database columns...');

  // Step 1: Rename existing `tanggal_selesai` to `tanggal_rencana_selesai`
  console.log('Renaming `tanggal_selesai` to `tanggal_rencana_selesai`...');
  await prisma.$executeRaw`ALTER TABLE PenggunaanAntibiotik RENAME COLUMN tanggal_selesai TO tanggal_rencana_selesai`;

  // Step 2: Add the new `tanggal_selesai_aktual` column (nullable)
  console.log('Adding `tanggal_selesai_aktual` column...');
  await prisma.$executeRaw`ALTER TABLE PenggunaanAntibiotik ADD COLUMN tanggal_selesai_aktual DATETIME`;

  console.log('Database columns fixed successfully!');
}

main()
  .catch((e) => {
    console.error('Error fixing database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
