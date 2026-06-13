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

function calculateDeviceDay(tanggalPasang, tanggalLepas) {
  if (!tanggalPasang) return 0

  const start = new Date(tanggalPasang)
  const end = tanggalLepas ? new Date(tanggalLepas) : new Date()

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0

  start.setHours(0, 0, 0, 0)
  end.setHours(0, 0, 0, 0)

  const diffMs = end.getTime() - start.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays <= 0) {
    return tanggalLepas ? 0 : 1
  }

  return Math.max(diffDays, 1)
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
          device_day: calculateDeviceDay(existing.tanggal_pasang, surveyDate),
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
            device_day: calculateDeviceDay(surveyDate, null),
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
          device_day: calculateDeviceDay(existing.tanggal_pasang, surveyDate),
        },
      })
      updated.push({ ...closed, _action: 'CLOSED' })
    }
  }

  return { updated }
}

function formatDate(value) {
  if (!value) return '-'

  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return '-'

  return date.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function buildDeviceHistoryRows(entries = []) {
  return (entries || [])
    .filter((entry) => entry && entry.jenis_alat)
    .map((entry) => ({
      jenis_alat: normalizeDeviceName(entry.jenis_alat),
      tanggal_pasang: formatDate(entry.tanggal_pasang),
      tanggal_lepas: entry.tanggal_lepas ? formatDate(entry.tanggal_lepas) : '-',
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
  formatDate,
}
