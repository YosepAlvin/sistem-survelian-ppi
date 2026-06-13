const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  const events = await prisma.kejadianInfeksi.findMany({
    select: {
      id: true,
      status: true,
      tanggal_selesai: true,
    },
  })

  let updated = 0

  for (const event of events) {
    const normalizedStatus = event.tanggal_selesai
      ? 'SELESAI'
      : event.status && ['AKTIF', 'SUSPEK', 'TERKONFIRMASI'].includes(String(event.status).toUpperCase())
        ? 'REVIEW_REQUIRED'
        : String(event.status || 'REVIEW_REQUIRED').toUpperCase()

    if (normalizedStatus !== String(event.status || '').toUpperCase()) {
      await prisma.kejadianInfeksi.update({
        where: { id: event.id },
        data: { status: normalizedStatus },
      })
      updated += 1
    }
  }

  console.log(`Processed ${events.length} infection events; updated ${updated}`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
