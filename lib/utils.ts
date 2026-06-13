import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, formatDistance, formatRelative, subDays } from "date-fns"
import { id } from "date-fns/locale"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format tanggal ke format Indonesia
 */
export function formatDateId(date: Date | string, formatStr: string = "dd MMMM yyyy"): string {
  return format(new Date(date), formatStr, { locale: id })
}

/**
 * Format tanggal ke format ISO (untuk input date HTML)
 */
export function formatDateISO(date: Date | string): string {
  const d = new Date(date)
  return d.toISOString().split("T")[0]
}

/**
 * Parse tanggal dari string ISO
 */
export function parseDateISO(dateString: string): Date {
  return new Date(dateString + "T00:00:00Z")
}

/**
 * Hitung umur berdasarkan tanggal lahir
 */
export function calculateAge(tanggalLahir: Date | string): number {
  const birthDate = new Date(tanggalLahir)
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }

  return age
}

/**
 * Format nomor RM
 */
export function formatNomorRM(nomorRM: string): string {
  return nomorRM.toUpperCase()
}

/**
 * Validasi nomor RM
 */
export function validateNomorRM(nomorRM: string): boolean {
  return /^[A-Z0-9]{3,20}$/.test(nomorRM)
}

/**
 * Format persen dengan 2 desimal
 */
export function formatPercent(value: number, decimals: number = 2): string {
  return (value * 100).toFixed(decimals) + "%"
}

/**
 * Format nominal mata uang
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
  }).format(value)
}

/**
 * Format number dengan separator ribuan
 */
export function formatNumber(value: number, decimals: number = 0): string {
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

/**
 * Get label untuk jenis infeksi
 */
export function getInfeksiLabel(jenis: string): string {
  const labels: Record<string, string> = {
    ILO: "Infeksi Luka Operasi",
    ISK: "Infeksi Saluran Kemih",
    HAP: "Hospital Acquired Pneumonia",
    VAP: "Ventilator Associated Pneumonia",
    IADP: "Infeksi Aliran Darah Primer",
    PHLEBITIS: "Flebitis",
    DEKUBITUS: "Luka Dekubitus",
  }
  return labels[jenis] || jenis
}

/**
 * Get label untuk jenis alat
 */
export function getAlatLabel(jenis: string): string {
  const labels: Record<string, string> = {
    INFUS: "Infus",
    KATETER_URINE: "Kateter Urine",
    VENTILATOR: "Ventilator",
    CENTRAL_LINE: "Central Line",
    TRAKEOSTOMI: "Trakeostomi",
    DRAIN_LAIN: "Drain Lain",
  }
  return labels[jenis] || jenis
}

/**
 * Get label untuk status
 */
export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    AKTIF: "Aktif",
    SELESAI: "Selesai",
    REFERRAL: "Referral",
    PENDING: "Menunggu Verifikasi",
    VERIFIED: "Terverifikasi",
    REJECTED: "Ditolak",
  }
  return labels[status] || status
}

/**
 * Get status badge color
 */
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    AKTIF: "bg-blue-100 text-blue-800",
    SELESAI: "bg-gray-100 text-gray-800",
    REFERRAL: "bg-yellow-100 text-yellow-800",
    PENDING: "bg-orange-100 text-orange-800",
    VERIFIED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
  }
  return colors[status] || "bg-gray-100 text-gray-800"
}

/**
 * Get jenis kelamin label
 */
export function getJenisKelaminLabel(jenis: string): string {
  return jenis === "L" ? "Laki-laki" : "Perempuan"
}

/**
 * Generate laporan filename dengan timestamp
 */
export function generateReportFilename(prefix: string): string {
  const now = new Date()
  const dateStr = format(now, "yyyy-MM-dd_HHmmss")
  return `${prefix}_${dateStr}`
}

/**
 * Delay untuk async operations
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Handle error dengan message yang user-friendly
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return String(error)
}

/**
 * Check apakah user memiliki permission
 */
export function hasPermission(userPermissions: string[] | undefined, requiredPermission: string): boolean {
  return userPermissions?.includes(requiredPermission) || false
}

/**
 * Get initials dari nama
 */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}
