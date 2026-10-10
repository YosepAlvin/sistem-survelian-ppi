/**
 * Parser tanggal universal — support SEMUA format yang mungkin ditemukan di sistem ini:
 *   1. Date object native
 *   2. ISO string: "2026-07-27" | "2026-07-27T14:30:00.000Z"
 *   3. Format Indonesia: "27/07/2026" | "27-07-2026" | "27.07.2026" + opsional jam "14:30:00"
 *   4. Format locale ID yang sudah terformat: "27 Juli 2026" / "27 juli 2026, 14.30"
 *   5. Fallback: generic new Date()
 * Semua pemanggilan formatTanggal() / formatTanggalWaktu() lewat parser ini, sehingga
 * tidak akan pernah muncul "Invalid Date" meskipun value sudah diformat sekali di layer API.
 */
export function parseDateUniversal(value: unknown): Date | null {
  if (!value) return null
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value

  const str = String(value).trim()
  if (!str) return null

  // 1. ISO format (yyyy-mm-dd) → native langsung support
  if (/^\d{4}-\d{1,2}-\d{1,2}/.test(str) || /^\d{4}\/\d{1,2}\/\d{1,2}/.test(str)) {
    const d = new Date(str)
    if (!Number.isNaN(d.getTime())) return d
  }

  // 2. Format Indonesia: dd/mm/yyyy | dd-mm-yyyy | dd.mm.yyyy [T ][hh:mm[:ss]]
  const idMatch = str.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})(?:[ T]+(\d{1,2})[:\.](\d{1,2})(?:[:\.](\d{1,2}))?)?/)
  if (idMatch) {
    const [, day, month, year, hh, mm, ss] = idMatch
    const d = new Date(
      parseInt(year, 10),
      parseInt(month, 10) - 1,
      parseInt(day, 10),
      hh != null ? parseInt(hh, 10) : 0,
      mm != null ? parseInt(mm, 10) : 0,
      ss != null ? parseInt(ss, 10) : 0
    )
    if (!Number.isNaN(d.getTime())) return d
  }

  // 3. Format locale ID ("27 Juli 2026")
  const monthsId = ['januari','februari','maret','april','mei','juni','juli','agustus','september','oktober','november','desember']
  const localeMatch = str.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})(?:[ ,]+(\d{1,2})[:\.](\d{1,2})(?:[:\.](\d{1,2}))?)?/)
  if (localeMatch) {
    const [, day, monthStr, year, hh, mm, ss] = localeMatch
    const mIdx = monthsId.indexOf(monthStr.toLowerCase())
    if (mIdx >= 0) {
      const d = new Date(
        parseInt(year, 10),
        mIdx,
        parseInt(day, 10),
        hh != null ? parseInt(hh, 10) : 0,
        mm != null ? parseInt(mm, 10) : 0,
        ss != null ? parseInt(ss, 10) : 0
      )
      if (!Number.isNaN(d.getTime())) return d
    }
  }

  // 4. Fallback generic (coba parser bawaan browser)
  const d = new Date(str)
  return Number.isNaN(d.getTime()) ? null : d
}

// Helper function to format dates in Indonesian format (dd MMMM yyyy) with WIB time
export function formatTanggal(tanggal: Date | string | null | undefined): string {
  const date = parseDateUniversal(tanggal)
  if (!date) return '-'
  const options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Jakarta'
  }
  return date.toLocaleDateString('id-ID', options)
}

// Helper function to format dates in short format (dd/mm/yyyy)
export function formatTanggalSingkat(tanggal: Date | string | null | undefined): string {
  const date = parseDateUniversal(tanggal)
  if (!date) return '-'
  const options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Asia/Jakarta'
  }
  return date.toLocaleDateString('id-ID', options)
}

// Helper function to format date and time in Indonesian format with WIB
export function formatTanggalWaktu(tanggal: Date | string | null | undefined): string {
  const date = parseDateUniversal(tanggal)
  if (!date) return '-'
  const options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta',
    hour12: false
  }
  return date.toLocaleString('id-ID', options) + ' WIB'
}

// Helper function to get current date and time in WIB for datetime-local input
export function getCurrentDateTimeLocal(): string {
  const now = new Date()
  const jakartaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }))
  const year = jakartaTime.getFullYear()
  const month = String(jakartaTime.getMonth() + 1).padStart(2, '0')
  const day = String(jakartaTime.getDate()).padStart(2, '0')
  const hours = String(jakartaTime.getHours()).padStart(2, '0')
  const minutes = String(jakartaTime.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}
