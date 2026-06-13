/**
 * Rumus Perhitungan Rate Infeksi PPI
 * Sesuai Arsitektur Sistem PPI Bagian 7
 */

// Phlebitis Rate = (Jumlah Phlebitis / Total Hari Rawat) × 1000
export const hitungPhlebitisRate = (jumlah: number, hariRawat: number) =>
  hariRawat > 0 ? (jumlah / hariRawat) * 1000 : 0

// CAUTI Rate = (Jumlah ISK / Total Kateter Day) × 1000
export const hitungCautiRate = (jumlah: number, kateterDay: number) =>
  kateterDay > 0 ? (jumlah / kateterDay) * 1000 : 0

// CLABSI Rate = (Jumlah IADP / Total CVL Day) × 1000
export const hitungClabsiRate = (jumlah: number, cvlDay: number) =>
  cvlDay > 0 ? (jumlah / cvlDay) * 1000 : 0

// VAP Rate = (Jumlah VAP / Total Ventilator Day) × 1000
export const hitungVapRate = (jumlah: number, ventilatorDay: number) =>
  ventilatorDay > 0 ? (jumlah / ventilatorDay) * 1000 : 0

// HAP Rate = (Jumlah HAP / Total Hari Rawat) × 1000
export const hitungHapRate = (jumlah: number, hariRawat: number) =>
  hariRawat > 0 ? (jumlah / hariRawat) * 1000 : 0

// IDO Rate = (Jumlah IDO / Total Operasi) × 100
export const hitungIdoRate = (jumlah: number, totalOperasi: number) =>
  totalOperasi > 0 ? (jumlah / totalOperasi) * 100 : 0
