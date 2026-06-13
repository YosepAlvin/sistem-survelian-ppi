import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkData() {
  console.log('=== DATABASE CONTENT VERIFICATION ===\n')
  
  const users = await prisma.user.findMany({ include: { role: true, ruangan: true } })
  console.log('USERS:')
  console.log(JSON.stringify(users, null, 2))
  
  const roles = await prisma.role.findMany()
  console.log('\nROLES:')
  console.log(JSON.stringify(roles, null, 2))
  
  const ruangan = await prisma.ruangan.findMany()
  console.log('\nRUANGAN:')
  console.log(JSON.stringify(ruangan, null, 2))
  
  const dokter = await prisma.dokter.findMany()
  console.log('\nDOKTER:')
  console.log(JSON.stringify(dokter, null, 2))
  
  const diagnosa = await prisma.diagnosa.findMany()
  console.log('\nDIAGNOSA:')
  console.log(JSON.stringify(diagnosa, null, 2))
  
  const antibiotik = await prisma.antibiotik.findMany()
  console.log('\nANTIBIOTIK:')
  console.log(JSON.stringify(antibiotik, null, 2))
  
  await prisma.$disconnect()
}

checkData().catch(console.error)
