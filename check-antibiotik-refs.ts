import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkReferences() {
  console.log('=== CHECKING ANTIBIOTIK REFERENCES ===\n')
  
  // Check if there are any usage records for antibiotik id=3
  const usageRecords = await prisma.penggunaanAntibiotik.findMany({
    where: { antibiotik_id: 3 }
  })
  
  console.log('Penggunaan_Antibiotik records for id=3:')
  console.log(JSON.stringify(usageRecords, null, 2))
  console.log('Count:', usageRecords.length)
  
  // List all antibiotik
  const antibiotik = await prisma.antibiotik.findMany()
  console.log('\nAll Antibiotik:')
  console.log(JSON.stringify(antibiotik, null, 2))
  
  await prisma.$disconnect()
}

checkReferences().catch(console.error)
