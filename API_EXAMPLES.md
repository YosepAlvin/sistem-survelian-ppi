# API IMPLEMENTATION EXAMPLES
## Template dan Contoh untuk Pengembang

Dokumen ini memberikan contoh implementasi API yang dapat dijadikan template untuk endpoint lainnya.

---

## Pattern 1: GET List dengan Pagination

### File: `app/api/admin/users/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Check authentication
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Check authorization
    if ((session.user as any).role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      )
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search")
    const roleId = searchParams.get("roleId")
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    if (search) {
      where.OR = [
        { email: { contains: search } },
        { namaLengkap: { contains: search } },
      ]
    }
    if (roleId) {
      where.roleId = parseInt(roleId)
    }

    // Execute query with count
    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        skip,
        take: limit,
        include: {
          role: true,
          ruangan: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      db.user.count({ where }),
    ])

    // Format response
    return NextResponse.json({
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("GET users error:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
```

---

## Pattern 2: POST Create dengan Validasi

### File: `app/api/admin/users/route.ts` (POST method)

```typescript
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { userCreateSchema } from "@/lib/validations"
import bcryptjs from "bcryptjs"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Check authentication & authorization
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      )
    }

    const body = await req.json()

    // Validate input
    const result = userCreateSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        {
          error: "Validation error",
          details: result.error.errors,
        },
        { status: 400 }
      )
    }

    const { email, password, namaLengkap, roleId, ruanganId } = result.data

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 10)

    // Create user
    const user = await db.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        namaLengkap,
        roleId,
        ruanganId,
      },
      include: {
        role: true,
        ruangan: true,
      },
    })

    // Remove password from response
    const { passwordHash, ...userWithoutPassword } = user

    return NextResponse.json(
      {
        message: "User created successfully",
        data: userWithoutPassword,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("POST users error:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
```

---

## Pattern 3: PUT Update dengan Partial Validation

### File: `app/api/admin/users/[id]/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { userUpdateSchema } from "@/lib/validations"

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      )
    }

    const userId = parseInt(params.id)
    const body = await req.json()

    // Validate input
    const result = userUpdateSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        {
          error: "Validation error",
          details: result.error.errors,
        },
        { status: 400 }
      )
    }

    // Check if user exists
    const user = await db.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Update user
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: result.data,
      include: {
        role: true,
        ruangan: true,
      },
    })

    const { passwordHash, ...userWithoutPassword } = updatedUser

    return NextResponse.json({
      message: "User updated successfully",
      data: userWithoutPassword,
    })
  } catch (error) {
    console.error("PUT user error:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
```

---

## Pattern 4: DELETE dengan Soft Delete Consideration

### File: `app/api/admin/users/[id]/route.ts` (DELETE method)

```typescript
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      )
    }

    const userId = parseInt(params.id)

    // Prevent deleting own account
    if ((session.user as any).id === userId) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 400 }
      )
    }

    // Check if user exists
    const user = await db.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Soft delete by deactivating
    await db.user.update({
      where: { id: userId },
      data: { isActive: false },
    })

    return NextResponse.json({
      message: "User deleted successfully",
    })
  } catch (error) {
    console.error("DELETE user error:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
```

---

## Pattern 5: Complex Data Fetch dengan Related Data

### File: `app/api/ipcn/dashboard-ruangan/[id]/route.ts`

```typescript
import { calculateTotalDeviceDays, calculateTotalInfeksi } from "@/lib/calculations"

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user as any).role !== "IPCN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      )
    }

    const ruanganId = parseInt(params.id)

    // Get ward data
    const ruangan = await db.ruangan.findUnique({
      where: { id: ruanganId },
    })

    if (!ruangan) {
      return NextResponse.json(
        { error: "Ward not found" },
        { status: 404 }
      )
    }

    // Get active patients count
    const activePatientsCount = await db.rawatInap.count({
      where: {
        ruanganId,
        status: "AKTIF",
      },
    })

    // Get current month's data
    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()

    // Calculate device days
    const infusDays = await calculateTotalDeviceDays(
      ruanganId,
      "INFUS",
      currentMonth,
      currentYear
    )
    const kateterDays = await calculateTotalDeviceDays(
      ruanganId,
      "KATETER_URINE",
      currentMonth,
      currentYear
    )
    const ventilatorDays = await calculateTotalDeviceDays(
      ruanganId,
      "VENTILATOR",
      currentMonth,
      currentYear
    )

    // Get infection counts
    const iloCount = await calculateTotalInfeksi(
      ruanganId,
      "ILO",
      currentMonth,
      currentYear
    )
    const iskCount = await calculateTotalInfeksi(
      ruanganId,
      "ISK",
      currentMonth,
      currentYear
    )
    const hapCount = await calculateTotalInfeksi(
      ruanganId,
      "HAP",
      currentMonth,
      currentYear
    )
    const vapCount = await calculateTotalInfeksi(
      ruanganId,
      "VAP",
      currentMonth,
      currentYear
    )

    return NextResponse.json({
      ruangan,
      metrics: {
        activePatientsCount,
        deviceDays: {
          infus: infusDays,
          kateter: kateterDays,
          ventilator: ventilatorDays,
        },
        infections: {
          ilo: iloCount,
          isk: iskCount,
          hap: hapCount,
          vap: vapCount,
        },
      },
    })
  } catch (error) {
    console.error("GET ward dashboard error:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
```

---

## Pattern 6: Batch Operations

### File: `app/api/ipcn/verifikasi/infeksi-batch/route.ts`

```typescript
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user as any).role !== "IPCN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { ids, status } = body

    if (!Array.isArray(ids) || !status) {
      return NextResponse.json(
        { error: "Invalid input" },
        { status: 400 }
      )
    }

    // Batch update
    const result = await db.kejadianInfeksi.updateMany({
      where: {
        id: { in: ids },
      },
      data: {
        statusVerifikasi: status,
        diverifikasiOleh: (session.user as any).id,
        tanggalVerifikasi: new Date(),
      },
    })

    return NextResponse.json({
      message: "Verification completed",
      updated: result.count,
    })
  } catch (error) {
    console.error("Batch verify error:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
```

---

## Pattern 7: File Upload & Export

### File: `app/api/ipcn/export/excel/route.ts`

```typescript
import XLSX from "sheetjs"

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || (session.user as any).role !== "IPCN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { ruanganId, bulan, tahun } = body

    // Get data
    const infeksi = await db.kejadianInfeksi.findMany({
      where: {
        surveilansHarian: {
          rawatInap: { ruanganId },
          tanggal: {
            gte: new Date(tahun, bulan - 1, 1),
            lte: new Date(tahun, bulan, 0),
          },
        },
      },
      include: {
        surveilansHarian: {
          include: {
            rawatInap: {
              include: {
                pasien: true,
              },
            },
          },
        },
      },
    })

    // Format for Excel
    const data = infeksi.map((inf) => ({
      "No RM": inf.surveilansHarian.rawatInap.pasien.nomorRm,
      "Nama Pasien": inf.surveilansHarian.rawatInap.pasien.namaPasien,
      "Jenis Infeksi": inf.jenisInfeksi,
      "Tanggal Deteksi": inf.tanggalDeteksi,
      "Tanda Gejala": inf.tandaGejala,
      "Status Verifikasi": inf.statusVerifikasi,
    }))

    // Create Excel file
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Infeksi")

    const buffer = XLSX.write(wb, { bookType: "xlsx", type: "buffer" })

    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="laporan_infeksi_${tahun}-${bulan}.xlsx"`,
      },
    })
  } catch (error) {
    console.error("Export error:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
```

---

## Pattern 8: Error Handling & Logging

### Reusable Error Handler

```typescript
// lib/error-handler.ts
export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message)
    Object.setPrototypeOf(this, AppError.prototype)
  }
}

export function handleError(error: unknown) {
  console.error("API Error:", error)

  if (error instanceof AppError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.statusCode }
    )
  }

  if (error instanceof Error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }

  return NextResponse.json(
    { error: "Internal Server Error" },
    { status: 500 }
  )
}
```

---

## Testing Your APIs

### Using cURL

```bash
# GET
curl http://localhost:3000/api/admin/users

# POST
curl -X POST http://localhost:3000/api/admin/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@rs.com",
    "password": "password123",
    "namaLengkap": "User Name",
    "roleId": 1
  }'

# PUT
curl -X PUT http://localhost:3000/api/admin/users/1 \
  -H "Content-Type: application/json" \
  -d '{"namaLengkap": "Updated Name"}'

# DELETE
curl -X DELETE http://localhost:3000/api/admin/users/1
```

### Using Postman

1. Create a new collection
2. Add requests following the patterns above
3. Use environment variables for base URL and auth tokens
4. Test all endpoints

---

## Best Practices Summary

✅ Always validate input using Zod schemas  
✅ Always check authentication with getServerSession  
✅ Always check authorization for sensitive operations  
✅ Use try-catch for error handling  
✅ Return appropriate HTTP status codes  
✅ Remove sensitive data (passwords) from responses  
✅ Log errors for debugging  
✅ Use pagination for list endpoints  
✅ Support filtering and search where applicable  
✅ Include proper error messages for client  
✅ Use Prisma for database operations  
✅ Test with different user roles  

---

**Copy these patterns and adapt them for other endpoints!**
