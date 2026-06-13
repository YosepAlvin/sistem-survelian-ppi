import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function GET() {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    // Fetch all rooms first to ensure Single Source of Truth
    const allRooms = await db.ruangan.findMany({
      where: { isActive: true },
      orderBy: { nama: 'asc' }
    })

    // Fetch IPCLN users and their surveillance upload stats
    const ipclnUsers = await (db.user as any).findMany({
      where: {
        role: { slug: 'ipcln' },
        isActive: true
      },
      select: {
        id: true,
        name: true,
        ruanganId: true,
        surveilansHarian: {
          where: {
            tanggal: {
              gte: todayStart,
              lte: todayEnd
            }
          },
          select: {
            id: true,
            tanggal: true
          }
        },
        _count: {
          select: {
            surveilansHarian: true // Total historical uploads
          }
        }
      }
    })

    const formattedActivity = allRooms.map(room => {
      // Find user(s) assigned to this room
      const userInRoom = ipclnUsers.find((u: any) => u.ruanganId === room.id)
      
      return {
        id: room.id,
        name: userInRoom?.name || 'Belum Ada IPCLN',
        ruangan: room.nama,
        ruanganKode: room.kode,
        uploadsToday: userInRoom?.surveilansHarian?.length || 0,
        lastUpload: userInRoom?.surveilansHarian?.length > 0 
          ? userInRoom.surveilansHarian[0].tanggal 
          : null,
        totalUploads: userInRoom?._count?.surveilansHarian || 0
      }
    })

    return NextResponse.json({
      success: true,
      data: formattedActivity
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
