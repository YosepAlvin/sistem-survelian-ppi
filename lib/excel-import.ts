import * as XLSX from 'xlsx'

// Utility to read Excel file and convert to JSON
export const readExcelFile = async (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        
        // Get first sheet
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]
        
        // Convert sheet to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: null })
        
        resolve(jsonData)
      } catch (error) {
        reject(new Error('Failed to read Excel file'))
      }
    }
    reader.onerror = (error) => reject(error)
    reader.readAsArrayBuffer(file)
  })
}

// Utility to generate template Excel file for a specific entity
export const generateTemplate = (headers: string[], filename: string) => {
  const worksheet = XLSX.utils.aoa_to_sheet([headers])
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1')
  XLSX.writeFile(workbook, `${filename}.xlsx`)
}
