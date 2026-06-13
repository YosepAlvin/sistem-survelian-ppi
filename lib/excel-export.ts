import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'

// Type for sheet data
interface SheetData {
  name: string
  title?: string
  headers: string[]
  data: any[]
}

export const exportToExcel = async (data: any[], fileName: string, title: string) => {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('PPI Report')

  // Style for title
  worksheet.mergeCells('A1:G1')
  const titleRow = worksheet.getRow(1)
  titleRow.values = [title]
  titleRow.font = { name: 'Arial Black', size: 16, bold: true, color: { argb: 'FFFFFFFF' } }
  titleRow.alignment = { vertical: 'middle', horizontal: 'center' }
  titleRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF1E3A8A' } // Dark blue
  }
  titleRow.height = 40

  // Header row
  const headerRow = worksheet.getRow(3)
  const headers = Object.keys(data[0] || {}).map(k => k.toUpperCase().replace(/_/g, ' '))
  headerRow.values = headers
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF334155' } // Slate
  }

  // Add data
  data.forEach((item, index) => {
    const row = worksheet.addRow(Object.values(item))
    // Alternate row styling
    if (index % 2 === 0) {
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF1F5F9' }
      }
    }
  })

  // Column width
  worksheet.columns.forEach(column => {
    column.width = 25
  })

  // Buffer and save
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  saveAs(blob, `${fileName}.xlsx`)
}

// New function for multi-sheet export!
export const exportMultiSheetExcel = async (sheets: SheetData[], fileName: string) => {
  const workbook = new ExcelJS.Workbook()

  sheets.forEach((sheet, sheetIndex) => {
    const worksheet = workbook.addWorksheet(sheet.name)

    // Add title if available
    if (sheet.title) {
      const mergeColumns = sheet.headers.length
      const mergeRange = `A1:${String.fromCharCode(64 + mergeColumns)}1`
      worksheet.mergeCells(mergeRange)
      const titleRow = worksheet.getRow(1)
      titleRow.values = [sheet.title]
      titleRow.font = { name: 'Arial Black', size: 16, bold: true, color: { argb: 'FFFFFFFF' } }
      titleRow.alignment = { vertical: 'middle', horizontal: 'center' }
      titleRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1E3A8A' } // Dark blue
      }
      titleRow.height = 40
    }

    // Header row
    const headerRowIndex = sheet.title ? 3 : 1
    const headerRow = worksheet.getRow(headerRowIndex)
    headerRow.values = sheet.headers
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF334155' } // Slate
    }

    // Add data rows
    sheet.data.forEach((item, index) => {
      const row = worksheet.addRow(Object.values(item))
      if (index % 2 === 0) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF1F5F9' }
        }
      }
    })

    // Set column widths
    worksheet.columns.forEach(column => {
      column.width = 25
    })
  })

  // Save to file
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  saveAs(blob, `${fileName}.xlsx`)
}
