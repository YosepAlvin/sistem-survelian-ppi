# PANDUAN IMPLEMENTASI LANJUTAN

Dokumen ini menjelaskan bagaimana melanjutkan pembangunan Sistem Surveilans PPI setelah setup awal.

## Fase 1: Setup Dasar ✅ SELESAI

- [x] Database schema dan Prisma setup
- [x] NextAuth configuration
- [x] Struktur project Next.js
- [x] Library utilities (auth, db, validations, calculations)
- [x] Global styles dan providers
- [x] Docker configuration
- [x] Dokumentasi komprehensif

## Fase 2: API Routes (TODO)

### 2.1 Authentication API
**File**: `app/api/auth/[...nextauth].ts`

```typescript
import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
```

### 2.2 Admin API Endpoints

#### Get Users - `app/api/admin/users/route.ts`
```typescript
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get("page") || "1")
  const limit = parseInt(searchParams.get("limit") || "10")
  const skip = (page - 1) * limit

  const [users, total] = await Promise.all([
    db.user.findMany({
      skip,
      take: limit,
      include: { role: true, ruangan: true },
      orderBy: { createdAt: "desc" },
    }),
    db.user.count(),
  ])

  return NextResponse.json({
    data: users,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  try {
    const body = await req.json()
    
    // Validate input
    const result = userCreateSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: result.error.errors }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(result.data.password, 10)

    // Create user
    const user = await db.user.create({
      data: {
        email: result.data.email,
        passwordHash: hashedPassword,
        namaLengkap: result.data.namaLengkap,
        roleId: result.data.roleId,
        ruanganId: result.data.ruanganId,
      },
      include: { role: true, ruangan: true },
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
```

### 2.3 IPCLN API Endpoints

#### Create Admission - `app/api/ipcln/rawat-inap/route.ts`
```typescript
// Similar pattern - validate input, check authorization, create in DB
```

#### Create Daily Surveillance - `app/api/ipcln/surveilans-harian/route.ts`
```typescript
// Handle device status tracking, auto-calculate if needed
```

### 2.4 IPCN API Endpoints

#### Get Dashboard Metrics - `app/api/ipcn/dashboard-rs/route.ts`
```typescript
// Aggregate data from calculations library
// Return active patients, device days, infections, compliance rate
```

#### Generate Monthly Report - `app/api/ipcn/laporan/bulanan/route.ts`
```typescript
// Call generateMonthlyReport from calculations library
// Store in surveilansBulanan table
// Return formatted data
```

## Fase 3: UI Components

### 3.1 Shadcn UI Components Setup

```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add form
npx shadcn-ui@latest add table
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add card
npx shadcn-ui@latest add alert
npx shadcn-ui@latest add select
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add pagination
npx shadcn-ui@latest add toast
```

### 3.2 Layout Components
- `components/layouts/admin-layout.tsx` - Admin panel layout
- `components/layouts/ipcln-layout.tsx` - IPCLN sidebar layout
- `components/layouts/ipcn-layout.tsx` - IPCN dashboard layout
- `components/layouts/auth-layout.tsx` - Login page layout

### 3.3 Form Components
- `components/forms/login-form.tsx`
- `components/forms/patient-form.tsx`
- `components/forms/admission-form.tsx`
- `components/forms/surveillance-form.tsx`
- `components/forms/infection-form.tsx`
- `components/forms/user-form.tsx`

### 3.4 Dashboard Components
- `components/dashboard/stats-card.tsx` - Metric display
- `components/dashboard/infection-chart.tsx` - Infection trend chart
- `components/dashboard/device-day-chart.tsx` - Device days visualization
- `components/dashboard/ward-comparison.tsx` - Comparison chart
- `components/dashboard/compliance-gauge.tsx` - Compliance rate display

### 3.5 Data Table Components
- `components/data-tables/users-table.tsx`
- `components/data-tables/patients-table.tsx`
- `components/data-tables/admissions-table.tsx`
- `components/data-tables/infections-table.tsx`

## Fase 4: Page Implementation

### 4.1 Admin Pages

#### `/admin/users/page.tsx`
- Display users list dengan pagination
- Add/Edit/Delete user modal
- Search dan filter functionality

#### `/admin/ruangan/page.tsx`
- CRUD for wards

#### `/admin/dokter/page.tsx`
- CRUD for doctors

#### `/admin/diagnosa/page.tsx`
- CRUD for diagnoses

### 4.2 IPCLN Pages

#### `/ipcln/pasien/page.tsx`
- List pasien
- Add pasien modal
- Search functionality

#### `/ipcln/surveilans/page.tsx`
- Display surveilans forms
- List existing surveillance
- Status indicators

#### `/ipcln/infeksi/page.tsx`
- Report infection form
- List reported infections
- Status tracking

### 4.3 IPCN Pages

#### `/ipcn/dashboard/page.tsx`
- Hospital-wide metrics
- Overall statistics
- Trend charts

#### `/ipcn/monitoring/[ruanganId]/page.tsx`
- Ward-specific dashboard
- Ward metrics
- Patient list

#### `/ipcn/laporan/page.tsx`
- Report generation
- Date range picker
- Format selection (Excel/PDF)

## Fase 5: Export Functionality

### 5.1 Excel Export
```typescript
import XLSX from 'sheetjs'

export function exportToExcel(data: any[], filename: string) {
  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Data")
  XLSX.writeFile(wb, `${filename}.xlsx`)
}
```

### 5.2 PDF Export
```typescript
import html2pdf from 'html2pdf.js'

export function exportToPDF(element: HTMLElement, filename: string) {
  const options = {
    margin: 10,
    filename: `${filename}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' },
  }
  html2pdf().set(options).from(element).save()
}
```

## Implementasi Best Practices

### 1. Error Handling
```typescript
try {
  // operation
} catch (error) {
  console.error('Error:', error)
  return NextResponse.json(
    { error: 'Internal Server Error' },
    { status: 500 }
  )
}
```

### 2. Loading States
```typescript
const [loading, setLoading] = useState(false)

const handleSubmit = async (data: any) => {
  setLoading(true)
  try {
    // API call
  } finally {
    setLoading(false)
  }
}
```

### 3. Data Validation
```typescript
const result = validationSchema.safeParse(data)
if (!result.success) {
  // Handle validation errors
  return NextResponse.json({ error: result.error }, { status: 400 })
}
```

### 4. Permission Checking
```typescript
if ((session.user as any).role !== 'ADMIN') {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
}
```

## Testing Checklist

- [ ] Authentication flow (login, logout, session)
- [ ] Admin CRUD operations
- [ ] IPCLN form submissions
- [ ] IPCN dashboard metrics
- [ ] Device day calculations
- [ ] Infection rate calculations
- [ ] Export to Excel
- [ ] Export to PDF
- [ ] Role-based access control
- [ ] Error handling

## Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Seed data loaded
- [ ] Build process tested (`npm run build`)
- [ ] Docker image built
- [ ] Docker compose tested
- [ ] SSL/HTTPS configured
- [ ] Backup strategy implemented
- [ ] Monitoring setup
- [ ] Logging configured

## File Structure Template

```
Untuk setiap modul baru, ikuti struktur ini:

app/
└── [role]/
    └── [modul]/
        ├── page.tsx           # Main page
        ├── [id]/
        │   └── page.tsx       # Detail page
        ├── layout.tsx         # Module layout
        └── components/        # Module-specific components

api/
└── [role]/
    └── [modul]/
        ├── route.ts           # GET, POST
        └── [id]/
            └── route.ts       # PUT, DELETE
```

## Referensi Perhitungan

### Device Day Calculation
```typescript
// Sudah diimplementasi di lib/calculations.ts
const days = calculateDeviceDay(tanggalPasang, tanggalLepas)
```

### Infection Rate
```typescript
// Formula: (Total Infeksi / Total Device Days) × 1000
const rate = calculateInfectionRate(totalInfeksi, totalDeviceDays)
```

### Compliance Rate
```typescript
// Formula: (Total Hari Input / Total Hari Pasien Aktif) × 100
const rate = calculateComplianceRate(totalHariInput, totalHariAktif)
```

### Monthly Report Generation
```typescript
const report = await generateMonthlyReport(ruanganId, bulan, tahun)
// Automatically saves to database
```

## Helpful Commands

```bash
# Development
npm run dev

# Type checking
npm run type-check

# Linting
npm run lint

# Prisma operations
npm run prisma:generate
npm run prisma:migrate
npm run prisma:studio
npm run prisma:seed

# Build & start
npm run build
npm run start

# Docker
docker-compose up -d
docker-compose down
docker-compose logs -f app

# Format code
npm run format
```

## Resources

- Next.js Docs: https://nextjs.org/docs
- Prisma Docs: https://www.prisma.io/docs
- NextAuth.js: https://next-auth.js.org
- Tailwind CSS: https://tailwindcss.com/docs
- React Query: https://tanstack.com/query/latest
- Shadcn UI: https://ui.shadcn.com

## Support & Troubleshooting

Untuk troubleshooting, lihat bagian **Troubleshooting** di README.md

---

**Next Steps:**
1. Setup API routes berdasarkan template di atas
2. Buat UI components menggunakan Shadcn
3. Implement page components
4. Test setiap fitur
5. Deploy ke production

Good Luck! 🚀
