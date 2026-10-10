const ALLOWED_INFECTION_TYPES = ['ILO', 'ISK', 'HAP', 'VAP', 'IADP', 'PLEBITIS']
const ALLOWED_DEVICE_TYPES = ['Vena sentra', 'Vena perifer', 'Arteri', 'Umbilikai', 'Urine kateter', 'Suprapubik kateter', 'Ventilator', 'Endotracheal Tube (ETT)', 'Trakeostomi', 'Nasogastric Tube (NGT)', 'Drain operasi', 'Chest tube (WSD)']

function normalizeInfectionName(value) {
  if (!value) return ''
  return String(value).trim().toUpperCase()
}

function normalizeDeviceName(value) {
  if (!value) return ''

  const cleaned = String(value).trim().toLowerCase()
  const aliases = {
    'vena sentra': 'Vena sentra',
    'central line': 'Vena sentra',
    'cvc': 'Vena sentra',
    'vena perifer': 'Vena perifer',
    'peripheral iv': 'Vena perifer',
    'arteri': 'Arteri',
    'umbilikai': 'Umbilikai',
    'urine kateter': 'Urine kateter',
    'kateter urine': 'Urine kateter',
    'kateter urin': 'Urine kateter',
    'suprapubik kateter': 'Suprapubik kateter',
    'suprapubic catheter': 'Suprapubik kateter',
    'ventilator': 'Ventilator',
    'ett': 'Endotracheal Tube (ETT)',
    'endotracheal tube': 'Endotracheal Tube (ETT)',
    'endotracheal': 'Endotracheal Tube (ETT)',
    'trakeostomi': 'Trakeostomi',
    'tracheostomy': 'Trakeostomi',
    'ngt': 'Nasogastric Tube (NGT)',
    'nasogastric tube': 'Nasogastric Tube (NGT)',
    'nasogastric': 'Nasogastric Tube (NGT)',
    'drain operasi': 'Drain operasi',
    'surgical drain': 'Drain operasi',
    'chest tube (wsd)': 'Chest tube (WSD)',
    'chest tube': 'Chest tube (WSD)',
    'wsd': 'Chest tube (WSD)',
  }

  return aliases[cleaned] || String(value).trim()
}

function parseOptionalInteger(value) {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(value)
  return Number.isNaN(parsed) ? null : parsed
}

function buildInfectionSnapshot(infections = []) {
  return (infections || [])
    .filter((entry) => entry && entry.jenis)
    .map((entry) => ({
      jenis_infeksi: normalizeInfectionName(entry.jenis),
      ada: Boolean(entry.ada),
      hari_ke: parseOptionalInteger(entry.hari_ke),
      catatan: entry.hasil_kultur || entry.catatan || "",
    }))
}

function parseDateUniversal(value) {
  if (!value) return null
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value

  const str = String(value).trim()
  if (!str) return null

  // 1. ISO format: yyyy-mm-dd atau yyyy-mm-ddThh:mm:ss
  if (/^\d{4}-\d{1,2}-\d{1,2}/.test(str) || /^\d{4}\/\d{1,2}\/\d{1,2}/.test(str)) {
    const d = new Date(str)
    if (!Number.isNaN(d.getTime())) return d
  }

  // 2. dd/mm/yyyy atau dd-mm-yyyy
  const idMatch = str.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})(?:[ T](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/)
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

  // 3. Sudah terformat locale ID (misal "27 Juli 2026")
  const monthsId = ['januari','februari','maret','april','mei','juni','juli','agustus','september','oktober','november','desember']
  const localeMatch = str.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})(?:[ ,]+(\d{1,2})[:\.](\d{1,2}))?/)
  if (localeMatch) {
    const [, day, monthStr, year, hh, mm] = localeMatch
    const mIdx = monthsId.indexOf(monthStr.toLowerCase())
    if (mIdx >= 0) {
      const d = new Date(
        parseInt(year, 10),
        mIdx,
        parseInt(day, 10),
        hh != null ? parseInt(hh, 10) : 0,
        mm != null ? parseInt(mm, 10) : 0
      )
      if (!Number.isNaN(d.getTime())) return d
    }
  }

  // 4. Fallback generic parser
  const d = new Date(str)
  return Number.isNaN(d.getTime()) ? null : d
}

function formatDate(value) {
  if (!value) return '-'
  const date = parseDateUniversal(value)
  if (!date) return '-'
  return date.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatDateTime(value) {
  if (!value) return '-'
  const date = parseDateUniversal(value)
  if (!date) return '-'

  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${date.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })} ${hours}:${minutes}`
}

function normalizeEventStatus(status) {
  const normalized = String(status || '').toUpperCase()

  if (['AKTIF', 'ACTIVE'].includes(normalized)) return 'AKTIF'
  if (['PENDING_CLOSURE', 'PENDING-CLOSURE'].includes(normalized)) return 'PENDING_CLOSURE'
  if (['SELESAI', 'CLOSED', 'RESOLVED'].includes(normalized)) return 'SELESAI'
  if (['SUSPEK'].includes(normalized)) return 'SUSPEK'
  if (['TERKONFIRMASI', 'CONFIRMED'].includes(normalized)) return 'TERKONFIRMASI'
  if (['REVIEW_REQUIRED', 'REVIEW-REQUIRED'].includes(normalized)) return 'REVIEW_REQUIRED'

  return normalized || 'AKTIF'
}

function normalizeLegacyInfectionEventStatus(event = {}) {
  const status = String(event.status || '').toUpperCase()
  if (status === 'SELESAI' || event.tanggal_selesai) return 'SELESAI'
  return 'REVIEW_REQUIRED'
}

function buildInfectionHistoryRows(events = []) {
  return (events || [])
    .filter((event) => event && event.jenis_infeksi)
    .map((event) => ({
      jenis_infeksi: normalizeInfectionName(event.jenis_infeksi),
      // ⚠️ JANGAN pre-format di API layer!
      // Kirim nilai ASLI tanggal ke UI, biarkan UI yang format (cegah double-format → Invalid Date)
      tanggal_kejadian: event.tanggal_kejadian ?? null,
      hari_ke: event.hari_ke ?? '-',
      status: normalizeEventStatus(event.status),
      tanggal_selesai: event.tanggal_selesai ?? null,
      catatan: event.catatan || '',
      dicatat_oleh: event.createdBy?.name || event.createdBy?.nama || event.created_by || '-',
      tanggal_pencatatan: event.created_at ?? null,
      ditutup_oleh: event.updatedBy?.nama || event.updated_by || '-',
      tanggal_penutupan: event.updated_at ?? null,
    }))
}

function applyDailyInfectionEvents({ activeEvents = [], infections = [], surveyDate = new Date(), userId = null, tanggalMasuk = null }) {
  const snapshot = buildInfectionSnapshot(infections)
  const activeByType = new Map()

  ;(activeEvents || [])
    .filter((event) => event && event.jenis_infeksi && event.status !== 'SELESAI' && !event.tanggal_selesai)
    .forEach((event) => {
      activeByType.set(normalizeInfectionName(event.jenis_infeksi), event)
    })

  const created = []
  const updated = []

  // Hitung hari_ke otomatis jika tanggalMasuk tersedia
  let autoHariKe = null
  if (tanggalMasuk) {
    const start = new Date(tanggalMasuk)
    const end = new Date(surveyDate)
    start.setHours(0, 0, 0, 0)
    end.setHours(0, 0, 0, 0)
    const diffMs = end.getTime() - start.getTime()
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
    autoHariKe = Math.max(diffDays, 1)
  }

  for (const infection of snapshot) {
    const activeEvent = activeByType.get(infection.jenis_infeksi)

    if (infection.ada) {
      if (!activeEvent) {
        created.push({
          jenis_infeksi: infection.jenis_infeksi,
          tanggal_kejadian: surveyDate,
          hari_ke: infection.hari_ke || autoHariKe || null,
          catatan: infection.catatan || '',
          status: 'AKTIF',
          created_by: userId,
          updated_by: userId,
          updated_at: surveyDate,
        })
      }
      continue
    }

    if (activeEvent && activeEvent.status === 'AKTIF') {
      updated.push({
        id: activeEvent.id,
        jenis_infeksi: infection.jenis_infeksi,
        status: 'PENDING_CLOSURE', // Move to Pending Closure instead of automatic SELESAI
        updated_by: userId,
        updated_at: surveyDate,
      })
    }
  }

  return { created, updated, snapshot }
}

module.exports = {
  ALLOWED_INFECTION_TYPES,
  ALLOWED_DEVICE_TYPES,
  normalizeInfectionName,
  normalizeDeviceName,
  buildInfectionSnapshot,
  buildInfectionHistoryRows,
  applyDailyInfectionEvents,
  normalizeLegacyInfectionEventStatus,
  normalizeEventStatus,
  parseDateUniversal,
  formatDate,
  formatDateTime,
}
