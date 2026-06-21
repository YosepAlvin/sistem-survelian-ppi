
// Utility untuk validasi dan penanganan edge case

export const validateEmail = (email: string): boolean => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email)
}

export const validateRequired = (value: any, fieldName: string): string | null => {
  if (value === null || value === undefined || value === "") {
    return `${fieldName} harus diisi`
  }
  return null
}

export const validateDateRange = (startDate: Date, endDate: Date): string | null => {
  if (endDate < startDate) {
    return "Tanggal akhir tidak boleh sebelum tanggal mulai"
  }
  return null
}

export const validatePositiveNumber = (num: number, fieldName: string): string | null => {
  if (num < 0) {
    return `${fieldName} tidak boleh negatif`
  }
  return null
}

export const formatErrorMessage = (error: any): string => {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === "string") {
    return error
  }
  return "Terjadi kesalahan yang tidak diketahui"
}
