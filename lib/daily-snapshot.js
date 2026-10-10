const { hitungDeviceDay } = require('./deviceDay.ts');

const DEVICE_CATALOG = [
  { jenis_alat: 'Vena sentra', terpasang: false },
  { jenis_alat: 'Vena perifer', terpasang: false },
  { jenis_alat: 'Arteri', terpasang: false },
  { jenis_alat: 'Umbilikai', terpasang: false },
  { jenis_alat: 'Urine kateter', terpasang: false },
  { jenis_alat: 'Suprapubik kateter', terpasang: false },
  { jenis_alat: 'Ventilator', terpasang: false },
  { jenis_alat: 'Endotracheal Tube (ETT)', terpasang: false },
  { jenis_alat: 'Trakeostomi', terpasang: false },
  { jenis_alat: 'Nasogastric Tube (NGT)', terpasang: false },
  { jenis_alat: 'Drain operasi', terpasang: false },
  { jenis_alat: 'Chest tube (WSD)', terpasang: false },
]

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

  return aliases[cleaned] || value.trim()
}

function buildInitialDeviceSelection(previousSelections = [], activeDevices = []) {
  const previousMap = new Map(
    (previousSelections || [])
      .filter((entry) => entry && entry.jenis_alat)
      .map((entry) => [normalizeDeviceName(entry.jenis_alat), Boolean(entry.terpasang)])
  )

  const activeMap = new Map(
    (activeDevices || [])
      .filter((entry) => entry && entry.jenis_alat)
      .map((entry) => [normalizeDeviceName(entry.jenis_alat), Boolean(entry.terpasang ?? entry.masih_terpasang ?? true)])
  )

  return DEVICE_CATALOG.map((device) => {
    const normalizedName = normalizeDeviceName(device.jenis_alat)
    const previousValue = previousMap.has(normalizedName) ? previousMap.get(normalizedName) : null
    const activeValue = activeMap.has(normalizedName) ? activeMap.get(normalizedName) : null

    return {
      ...device,
      jenis_alat: normalizedName,
      terpasang: previousValue !== null ? previousValue : Boolean(activeValue),
    }
  })
}

async function applyDailyDeviceSnapshot({ tx, rawatInapId, devices = [], surveyDate = new Date() }) {
  const updated = []
  const normalizedDevices = (devices || []).filter((device) => device && device.jenis_alat)

  for (const device of normalizedDevices) {
    const deviceName = normalizeDeviceName(device.jenis_alat)
    const shouldBeActive = Boolean(device.terpasang)
    const shouldReinstall = Boolean(device.ganti_baru)

    const existing = await tx.alatTerpasang.findFirst({
      where: {
        rawat_inap_id: rawatInapId,
        jenis_alat: deviceName,
        masih_terpasang: true,
      },
    })

    // Case: User wants to RE-INSTALL (Replace) the device
    if (shouldReinstall && existing) {
      // 1. Close the old one
      const closed = await tx.alatTerpasang.update({
        where: { id: existing.id },
        data: {
          tanggal_lepas: surveyDate,
          masih_terpasang: false,
          device_day: hitungDeviceDay(existing.tanggal_pasang, surveyDate),
        },
      })
      updated.push({ ...closed, _action: 'REPLACED_OLD' })

      // 2. Create the new one
      const reinstalled = await tx.alatTerpasang.create({
        data: {
          rawat_inap_id: rawatInapId,
          jenis_alat: deviceName,
          tanggal_pasang: surveyDate,
          masih_terpasang: true,
          device_day: 1, // Reset to day 1
        },
      })
      updated.push({ ...reinstalled, _action: 'REPLACED_NEW' })
      continue
    }

    if (shouldBeActive) {
      if (!existing) {
        const created = await tx.alatTerpasang.create({
          data: {
            rawat_inap_id: rawatInapId,
            jenis_alat: deviceName,
            tanggal_pasang: surveyDate,
            masih_terpasang: true,
            device_day: hitungDeviceDay(surveyDate, null),
          },
        })
        updated.push({ ...created, _action: 'CREATED' })
      }
      continue
    }

    if (existing) {
      const closed = await tx.alatTerpasang.update({
        where: { id: existing.id },
        data: {
          tanggal_lepas: surveyDate,
          masih_terpasang: false,
          device_day: hitungDeviceDay(existing.tanggal_pasang, surveyDate),
        },
      })
      updated.push({ ...closed, _action: 'CLOSED' })
    }
  }

  return { updated }
}

function parseDateUniversal(value) {
  if (!value) return null
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value

  const str = String(value).trim()
  if (!str) return null

  // 1. ISO format: yyyy-mm-dd atau yyyy-mm-ddThh:mm:ss (new Date() support)
  if (/^\d{4}-\d{1,2}-\d{1,2}/.test(str) || /^\d{4}\/\d{1,2}\/\d{1,2}/.test(str)) {
    const d = new Date(str)
    if (!Number.isNaN(d.getTime())) return d
  }

  // 2. dd/mm/yyyy atau dd-mm-yyyy  ← ini yg sering bikin Invalid Date di JS!
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

  // 3. Already formatted Indo locale, e.g "27 Juli 2026" — extract angka bulan.
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

function buildDeviceHistoryRows(entries = []) {
  return (entries || [])
    .filter((entry) => entry && entry.jenis_alat)
    .map((entry) => ({
      jenis_alat: normalizeDeviceName(entry.jenis_alat),
      // JANGAN pre-format tanggal di API layer → biarkan UI yang render dengan helper visual pilihannya
      tanggal_pasang: entry.tanggal_pasang ?? null,
      tanggal_lepas: entry.tanggal_lepas ?? null,
      status: entry.masih_terpasang ? 'Terpasang' : 'Dilepas',
      device_day: entry.device_day ?? 0,
    }))
}

module.exports = {
  DEVICE_CATALOG,
  normalizeDeviceName,
  buildInitialDeviceSelection,
  applyDailyDeviceSnapshot,
  buildDeviceHistoryRows,
  parseDateUniversal,
  formatDate,
}
