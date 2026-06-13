// Helper function to format dates in Indonesian format (dd MMMM yyyy) with WIB time
export function formatTanggal(tanggal: Date | string): string {
  if (!tanggal) return ''
  const date = typeof tanggal === 'string' ? new Date(tanggal) : tanggal
  const options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Jakarta'
  }
  return date.toLocaleDateString('id-ID', options)
}

// Helper function to format dates in short format (dd/mm/yyyy)
export function formatTanggalSingkat(tanggal: Date | string): string {
  if (!tanggal) return ''
  const date = typeof tanggal === 'string' ? new Date(tanggal) : tanggal
  const options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Asia/Jakarta'
  }
  return date.toLocaleDateString('id-ID', options)
}

// Helper function to format date and time in Indonesian format with WIB
export function formatTanggalWaktu(tanggal: Date | string): string {
  if (!tanggal) return ''
  const date = typeof tanggal === 'string' ? new Date(tanggal) : tanggal
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
