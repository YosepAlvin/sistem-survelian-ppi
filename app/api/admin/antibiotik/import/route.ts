import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await req.json()
    if (!Array.isArray(data)) {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 })
    }

    const processed: any[] = []
    const errors: any[] = []

    for (let i = 0; i < data.length; i++) {
      const item = data[i]
      try {
        // Validate required fields
        if (!item.nama || !item.kode) {
          errors.push({ index: i, message: "Nama dan Kode Antibiotik wajib diisi" })
          continue
        }

        // Use upsert to create or update if exists
        const antibiotik = await db.antibiotik.upsert({
          where: { kode: item.kode },
          update: {
            nama: item.nama,
            golongan: item.golongan || undefined,
            is_restriksi: Boolean(item.is_restriksi),
            durasi_maks_hari: parseInt(item.durasi_maks_hari) || 7,
          },
          create: {
            nama: item.nama,
            kode: item.kode,
            golongan: item.golongan || undefined,
            is_restriksi: Boolean(item.is_restriksi),
            durasi_maks_hari: parseInt(item.durasi_maks_hari) || 7,
          }
        })
        processed.push({ ...antibiotik, action: 'upserted' })
      } catch (err: any) {
        console.error("Error importing item at index", i, ":", err)
        errors.push({ index: i, message: err.message || "Gagal memproses antibiotik" })
      }
    }

    // Log the result to help debug
    console.log("Import result: processed =", processed.length, "errors =", errors.length)

    return NextResponse.json({ 
      success: true, 
      processed, 
      errors,
      total: data.length,
      processedCount: processed.length,
      errorCount: errors.length
    })
  } catch (error: any) {
    console.error("Import error:", error)
    return NextResponse.json({ error: error.message || "Terjadi kesalahan saat import" }, { status: 500 })
  }
}
