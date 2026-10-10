import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import bcryptjs from "bcryptjs"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { oldPassword, newPassword, confirmPassword } = body

    if (!oldPassword || !newPassword || !confirmPassword) {
      return NextResponse.json({ error: "Semua field harus diisi" }, { status: 400 })
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json({ error: "Password baru dan konfirmasi tidak sama" }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "Password baru minimal 6 karakter" }, { status: 400 })
    }

    const user = await db.user.findUnique({
      where: { id: parseInt(session.user.id) }
    })

    if (!user) {
      return NextResponse.json({ error: "User tidak ditemukan" }, { status: 404 })
    }

    const isPasswordValid = await bcryptjs.compare(oldPassword, user.password)
    if (!isPasswordValid) {
      return NextResponse.json({ error: "Password lama salah" }, { status: 400 })
    }

    const hashedNewPassword = await bcryptjs.hash(newPassword, 10)

    await db.user.update({
      where: { id: parseInt(session.user.id) },
      data: { password: hashedNewPassword }
    })

    // Tambahkan audit trail
    await db.auditTrail.create({
      data: {
        userId: parseInt(session.user.id),
        userName: user.name,
        entityType: "User",
        entityId: user.id,
        action: "CHANGE_PASSWORD",
        moduleName: "Profile",
      }
    })

    return NextResponse.json({ success: true, message: "Password berhasil diubah" })

  } catch (error) {
    console.error("Change password error:", error)
    return NextResponse.json({ error: "Terjadi kesalahan" }, { status: 500 })
  }
}
