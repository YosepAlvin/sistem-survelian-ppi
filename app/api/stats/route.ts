import { NextResponse } from "next/server"
import { getSystemStats } from "@/lib/stats"

export async function GET() {
  try {
    const stats = await getSystemStats()
    return NextResponse.json({
      success: true,
      data: stats,
    })
  } catch (error: any) {
    console.error("Error fetching system stats:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch system stats",
      },
      { status: 500 }
    )
  }
}
