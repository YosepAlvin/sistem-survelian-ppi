const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

function calculateDeviceDay(tanggalPasang, tanggalLepas) {
  if (!tanggalPasang) return 0

  const start = new Date(tanggalPasang)
  const end = tanggalLepas ? new Date(tanggalLepas) : new Date()

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0

  start.setHours(0, 0, 0, 0)
  end.setHours(0, 0, 0, 0)

  const diffMs = end.getTime() - start.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays <= 0) {
    return tanggalLepas ? 0 : 1
  }

  return Math.max(diffDays, 1)
}

async function main() {
  const duplicateGroups = new Map()
  const events = await prisma.kejadianInfeksi.findMany({ orderBy: { tanggal_kejadian: 'asc' } })

  for (const event of events) {
    if (!event?.jenis_infeksi || !event.rawat_inap_id) continue

    const key = `${event.rawat_inap_id}:${String(event.jenis_infeksi).toUpperCase()}`
    if (!duplicateGroups.has(key)) duplicateGroups.set(key, [])
    duplicateGroups.get(key).push(event)
  }

  let mergedCount = 0
  for (const [key, group] of duplicateGroups.entries()) {
    if (group.length <= 1) continue

    const primary = group[0]
    for (const duplicate of group.slice(1)) {
      await prisma.kejadianInfeksi.update({
        where: { id: duplicate.id },
        data: {
          status: 'SELESAI',
          tanggal_selesai: new Date(),
          catatan: `${duplicate.catatan || ''}\n[Tergabung otomatis sebagai duplikat]`.trim(),
        },
      })
      mergedCount += 1
    }

    if (primary.status === 'REVIEW_REQUIRED' && !primary.tanggal_selesai) {
      await prisma.kejadianInfeksi.update({
        where: { id: primary.id },
        data: {
          status: 'AKTIF',
        },
      })
    }
  }

  const devices = await prisma.alatTerpasang.findMany({ orderBy: { tanggal_pasang: 'asc' } })
  let deviceDayCount = 0

  for (const device of devices) {
    const start = device.tanggal_pasang
    const end = device.tanggal_lepas

    const normalizedEnd = end && new Date(end) < new Date(start) ? start : end
    const days = calculateDeviceDay(start, normalizedEnd)

    await prisma.alatTerpasang.update({
      where: { id: device.id },
      data: {
        tanggal_lepas: normalizedEnd,
        device_day: days,
        masih_terpasang: Boolean(!normalizedEnd || normalizedEnd >= start),
      },
    })
    deviceDayCount += 1
  }

  console.log(JSON.stringify({ mergedCount, deviceDayCount }, null, 2))
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
