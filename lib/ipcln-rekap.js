function parseMonth(month) {
  if (!month) return null

  const [year, monthNumber] = month.split('-').map((value) => Number(value))
  if (!year || !monthNumber) return null

  return { year, month: monthNumber }
}

function toMonthKey(dateValue) {
  const date = dateValue instanceof Date ? dateValue : new Date(dateValue)
  if (Number.isNaN(date.getTime())) return null

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function isWithinMonth(dateValue, selectedMonth) {
  if (!selectedMonth) return true

  const date = dateValue instanceof Date ? dateValue : new Date(dateValue)
  if (Number.isNaN(date.getTime())) return false

  return date.getFullYear() === selectedMonth.year && date.getMonth() + 1 === selectedMonth.month
}

function getDayCount(startDate, endDate, fallbackDate) {
  const start = startDate instanceof Date ? startDate : new Date(startDate)
  const end = endDate instanceof Date ? endDate : endDate ? new Date(endDate) : null

  if (Number.isNaN(start.getTime())) return 0

  const referenceDate = end || fallbackDate || start
  if (Number.isNaN(referenceDate.getTime())) return 0

  const diffInMs = referenceDate.getTime() - start.getTime()
  const diffInDays = Math.max(0, Math.ceil(diffInMs / (1000 * 60 * 60 * 24)) + 1)
  return diffInDays
}

function buildMonthlySurveillanceRows(admissions, selectedMonth, roomId = null) {
  const month = parseMonth(selectedMonth)
  const fallbackDate = new Date()

  return (admissions || [])
    .filter((admission) => {
      if (roomId !== null && roomId !== undefined && roomId !== '') {
        const admissionRoomId = admission.ruangan_id ?? admission.ruangan?.id ?? null
        if (Number(admissionRoomId) !== Number(roomId)) {
          return false
        }
      }

      if (!month) return true

      return isWithinMonth(admission.tanggal_masuk, month) || isWithinMonth(admission.tanggal_keluar, month)
    })
    .map((admission) => {
      const hariRawat = getDayCount(admission.tanggal_masuk, admission.tanggal_keluar, admission.status === 'AKTIF' ? fallbackDate : null)
      const surveilans = admission.surveilans_harian || []
      const kejadian = admission.kejadian_infeksi || []

      const uc = surveilans.filter((item) => item?.uc_terpasang).length
      const ivl = surveilans.filter((item) => item?.ivl_terpasang).length
      const vapDays = surveilans.filter((item) => item?.ventilator_terpasang).length
      const plb = kejadian.reduce((sum, item) => sum + (item?.phlebitis?.length || 0), 0)
      const isk = kejadian.reduce((sum, item) => sum + (item?.isk?.length || 0), 0)
      const hap = kejadian.reduce((sum, item) => sum + (item?.hap_vap || []).filter((entry) => entry?.jenis === 'HAP').length, 0)
      const vap = kejadian.reduce((sum, item) => sum + (item?.hap_vap || []).filter((entry) => entry?.jenis === 'VAP').length, 0)
      const iadp = kejadian.reduce((sum, item) => sum + (item?.iadp?.length || 0), 0)

      return {
        id: admission.id?.toString() || '',
        rm: admission.pasien?.no_rm || '-',
        pasien: admission.pasien?.nama || '-',
        tgl_masuk: admission.tanggal_masuk ? new Date(admission.tanggal_masuk).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-',
        tgl_keluar: admission.tanggal_keluar ? new Date(admission.tanggal_keluar).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }) : (admission.status === 'AKTIF' ? 'Aktif' : '-'),
        hari_rawat: hariRawat,
        uc,
        ivl,
        vap_days: vapDays,
        isk,
        plb,
        hap,
        vap,
        iadp,
      }
    })
}

function buildMonthlySurveillanceSummary(rows) {
  return {
    pasien: rows.length,
    hariRawat: rows.reduce((sum, row) => sum + (Number(row.hari_rawat) || 0), 0),
    deviceDays: rows.reduce((sum, row) => sum + (Number(row.uc) || 0) + (Number(row.ivl) || 0) + (Number(row.vap_days) || 0), 0),
    infeksi: rows.reduce((sum, row) => sum + (Number(row.isk) || 0) + (Number(row.plb) || 0) + (Number(row.hap) || 0) + (Number(row.vap) || 0) + (Number(row.iadp) || 0), 0),
    uc: rows.reduce((sum, row) => sum + (Number(row.uc) || 0), 0),
    ivl: rows.reduce((sum, row) => sum + (Number(row.ivl) || 0), 0),
    vapDays: rows.reduce((sum, row) => sum + (Number(row.vap_days) || 0), 0),
    isk: rows.reduce((sum, row) => sum + (Number(row.isk) || 0), 0),
    plb: rows.reduce((sum, row) => sum + (Number(row.plb) || 0), 0),
    hap: rows.reduce((sum, row) => sum + (Number(row.hap) || 0), 0),
    vap: rows.reduce((sum, row) => sum + (Number(row.vap) || 0), 0),
    iadp: rows.reduce((sum, row) => sum + (Number(row.iadp) || 0), 0),
  }
}

module.exports = {
  buildMonthlySurveillanceRows,
  buildMonthlySurveillanceSummary,
  parseMonth,
  toMonthKey,
}
