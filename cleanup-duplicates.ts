import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function cleanup() {
  console.log('=== CLEANING UP DUPLICATE DATA ===\n')
  
  // Step 1: Update records using antibiotik id=3 to use id=2 instead
  console.log('Updating records using duplicate Ciprofloxacin...')
  const updateUsage = await prisma.penggunaanAntibiotik.updateMany({
    where: { antibiotik_id: 3 },
    data: { antibiotik_id: 2 }
  })
  console.log('✅ Updated records:', updateUsage.count)
  
  // Step 2: Delete duplicate antibiotik (id=3)
  console.log('\nRemoving duplicate Ciprofloxacin (id=3)...')
  const deleteAntibiotik = await prisma.antibiotik.delete({
    where: { id: 3 }
  })
  console.log('✅ Deleted:', deleteAntibiotik)
  
  // Verify current antibiotik
  const antibiotik = await prisma.antibiotik.findMany()
  console.log('\n✅ Final Antibiotik list:')
  console.log(JSON.stringify(antibiotik, null, 2))
  
  await prisma.$disconnect()
}

cleanup().catch(console.error)
