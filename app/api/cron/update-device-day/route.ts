import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { hitungDeviceDay } from "@/lib/deviceDay"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const secret = searchParams.get('secret') || process.env.CRON_SECRET

    if (!secret || secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tools = await db.alatTerpasang.findMany({ orderBy: { tanggal_pasang: 'asc' } })

    for (const alat of tools) {
      const normalizedEnd = alat.tanggal_lepas && new Date(alat.tanggal_lepas) < new Date(alat.tanggal_pasang) ? alat.tanggal_pasang : alat.tanggal_lepas
      const deviceDay = hitungDeviceDay(alat.tanggal_pasang, normalizedEnd || null)
      await db.alatTerpasang.update({ where: { id: alat.id }, data: { device_day: deviceDay, tanggal_lepas: normalizedEnd, masih_terpasang: !normalizedEnd || normalizedEnd >= alat.tanggal_pasang } })
    }

    return NextResponse.json({ success: true, updated: tools.length })
  } catch (error: any) {
    console.error('Cron update-device-day error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
