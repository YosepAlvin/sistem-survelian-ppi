import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"
import bcryptjs from "bcryptjs"

export async function GET() {
  try {
    const session = await auth()
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const users = await db.user.findMany({
      include: {
        role: true,
        ruangan: true,
      },
      orderBy: { createdAt: "desc" },
    })

    const formattedUsers = users.map((user) => ({
      id: user.id.toString(),
      nama: user.name,
      email: user.email,
      role: user.role.name,
      ruangan: user.ruangan ? { id: user.ruangan.id.toString(), nama: user.ruangan.nama } : null,
      status: user.isActive ? "Aktif" : "Nonaktif",
    }))

    return NextResponse.json(formattedUsers)
  } catch (error: any) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { nama, email, role, ruanganId, password } = body

    if (!nama || !email || !role || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 })
    }

    // Get Role ID
    const roleRecord = await db.role.findFirst({
      where: { name: role.toUpperCase() },
    })

    if (!roleRecord) {
      return NextResponse.json({ error: `Role ${role} not found` }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 10)

    const newUser = await db.user.create({
      data: {
        name: nama,
        email,
        password: hashedPassword,
        roleId: roleRecord.id,
        ruanganId: ruanganId ? parseInt(ruanganId) : null,
        isActive: true,
      },
    })

    return NextResponse.json({ success: true, data: newUser })
  } catch (error: any) {
    console.error("Error creating user:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth()
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id, isActive, nama, email, role, ruanganId, password } = await req.json()
    
    if (!id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const dataToUpdate: any = {}
    
    if (typeof isActive === 'boolean') {
      dataToUpdate.isActive = isActive
    }
    
    if (nama) dataToUpdate.name = nama
    if (email) dataToUpdate.email = email
    
    if (role) {
      const roleRecord = await db.role.findFirst({
        where: { name: role.toUpperCase() },
      })
      if (roleRecord) {
        dataToUpdate.roleId = roleRecord.id
      }
    }
    
    if (ruanganId !== undefined) {
      dataToUpdate.ruanganId = ruanganId ? parseInt(ruanganId) : null
    }
    
    if (password) {
      const bcryptjs = await import('bcryptjs')
      dataToUpdate.password = await bcryptjs.hash(password, 10)
    }

    const updatedUser = await db.user.update({
      where: { id: parseInt(id) },
      data: dataToUpdate
    })

    return NextResponse.json({ success: true, data: {
      id: updatedUser.id.toString(),
      status: updatedUser.isActive ? 'Aktif' : 'Nonaktif'
    } })
  } catch (error: any) {
    console.error("Error updating user:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
