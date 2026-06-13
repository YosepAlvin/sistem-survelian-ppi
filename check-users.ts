import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkUsers() {
  try {
    const users = await prisma.user.findMany({
      include: { role: true }
    })
    console.log('Users in database:', JSON.stringify(users, null, 2))
    
    if (users.length === 0) {
      console.log('No users found in database!')
    }
  } catch (error) {
    console.error('Error checking users:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkUsers()
