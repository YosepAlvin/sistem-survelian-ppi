import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log("--- RUANGAN DATA ---")
  const ruangan = await prisma.ruangan.findMany()
  console.log(JSON.stringify(ruangan, null, 2))

  console.log("\n--- UNIQUE ROOM NAMES ---")
  const uniqueNames = await prisma.ruangan.groupBy({
    by: ['nama'],
    _count: {
      nama: true
    }
  })
  console.log(JSON.stringify(uniqueNames, null, 2))

  console.log("\n--- RAWAT INAP STATUS AKTIF PER RUANGAN ---")
  const rawatInap = await prisma.rawatInap.findMany({
    where: { status: 'AKTIF' },
    include: {
      ruangan: true
    }
  })
  
  const perRoom = rawatInap.reduce((acc: any, ri) => {
    const roomName = ri.ruangan.nama
    acc[roomName] = (acc[roomName] || 0) + 1
    return acc
  }, {})
  console.log(JSON.stringify(perRoom, null, 2))

  console.log("\n--- USERS BY ROLE ---")
  const users = await prisma.user.findMany({
    include: {
      role: true,
      ruangan: true
    }
  })
  console.log("\n--- IPCLN USERS AND ROOMS ---")
  const ipclnUsers = await prisma.user.findMany({
    where: { role: { slug: 'ipcln' } },
    include: { ruangan: true }
  })
  console.log(JSON.stringify(ipclnUsers.map(u => ({ name: u.name, room: u.ruangan?.nama })), null, 2))
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
