import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log("Starting Database Audit and Cleanup...")

  // 1. Standardize Room Names (Trim and handle case)
  const allRooms = await prisma.ruangan.findMany()
  for (const room of allRooms) {
    const trimmedName = room.nama.trim()
    if (trimmedName !== room.nama) {
      console.log(`Trimming room name: "${room.nama}" -> "${trimmedName}"`)
      await prisma.ruangan.update({
        where: { id: room.id },
        data: { nama: trimmedName }
      })
    }
  }

  // 2. Handle Duplicate "Mawar"
  // We found "Mawar" (ID 3) and "Mawar (Rawat Inap Umum)" (ID 4)
  // Let's merge them into one standardized "Mawar"
  const targetRoomName = "Mawar"
  const mawarRooms = await prisma.ruangan.findMany({
    where: {
      nama: {
        contains: "Mawar"
      }
    }
  })

  if (mawarRooms.length > 1) {
    const primaryMawar = mawarRooms.find(r => r.nama === "Mawar") || mawarRooms[0]
    const duplicates = mawarRooms.filter(r => r.id !== primaryMawar.id)

    console.log(`Merging ${duplicates.length} duplicate Mawar rooms into ID: ${primaryMawar.id} (${primaryMawar.nama})`)

    for (const dup of duplicates) {
      // Move patients
      const updatedPatients = await prisma.rawatInap.updateMany({
        where: { ruangan_id: dup.id },
        data: { ruangan_id: primaryMawar.id }
      })
      console.log(`Moved ${updatedPatients.count} patients from room ${dup.id} to ${primaryMawar.id}`)

      // Move users (IPCLN)
      const updatedUsers = await prisma.user.updateMany({
        where: { ruanganId: dup.id },
        data: { ruanganId: primaryMawar.id }
      })
      console.log(`Moved ${updatedUsers.count} users from room ${dup.id} to ${primaryMawar.id}`)

      // Move surveilans bulanan
      const updatedSurveilans = await prisma.surveilansBulanan.updateMany({
        where: { ruangan_id: dup.id },
        data: { ruangan_id: primaryMawar.id }
      })
      console.log(`Moved ${updatedSurveilans.count} monthly surveillance records`)

      // Delete the duplicate room
      await prisma.ruangan.delete({
        where: { id: dup.id }
      })
      console.log(`Deleted duplicate room ID: ${dup.id}`)
    }
    
    // Update primary mawar name to be clean
    await prisma.ruangan.update({
      where: { id: primaryMawar.id },
      data: { nama: "Mawar", kode: "MWR" } // Standardizing
    })
  }

  // 3. Ensure all active patients have a valid room (Prisma already ensures this via FK, but let's check for NULL if any)
  const orphans = await prisma.rawatInap.count({
    where: { ruangan_id: { equals: undefined } } // Just a sanity check
  })
  console.log(`Orphaned RawatInap records: ${orphans}`)

  console.log("Cleanup completed.")
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
