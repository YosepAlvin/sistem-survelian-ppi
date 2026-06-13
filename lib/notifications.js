function normalizeDeviceType(value = '') {
  const normalized = String(value || '').trim().toLowerCase()

  if (normalized.includes('urine') || normalized.includes('kateter')) return 'Urine Kateter'
  if (normalized.includes('ventilator')) return 'Ventilator'
  if (normalized.includes('cvc') || normalized.includes('central') || normalized.includes('vena sentra')) return 'CVC'
  if (normalized.includes('ett') || normalized.includes('endotracheal')) return 'ETT'
  if (normalized.includes('ngt') || normalized.includes('nasogastric')) return 'NGT'
  if (normalized.includes('trakeostomi') || normalized.includes('tracheostomy')) return 'Trakeostomi'
  if (normalized.includes('drain operasi') || normalized.includes('surgical drain')) return 'Drain operasi'
  if (normalized.includes('chest tube') || normalized.includes('wsd')) return 'Chest tube (WSD)'
  return String(value || '').trim()
}

function shouldTriggerDeviceAlert({ jenisAlat, hariPasang, threshold }) {
  if (!jenisAlat || !Number.isFinite(Number(hariPasang)) || !Number.isFinite(Number(threshold))) {
    return false
  }

  return Number(hariPasang) > Number(threshold)
}

function buildDeviceAlertMessage({ jenisAlat, pasienNama, ruangan, hariPasang, threshold }) {
  const normalizedType = normalizeDeviceType(jenisAlat)
  const days = Number(hariPasang) || 0
  const allowedThreshold = Number(threshold) || 0

  if (!shouldTriggerDeviceAlert({ jenisAlat: normalizedType, hariPasang: days, threshold: allowedThreshold })) {
    return null
  }

  return `${normalizedType} pasien ${pasienNama || 'pasien'} di ${ruangan || 'ruangan'} telah terpasang selama ${days} hari. Mohon evaluasi kebutuhan alat.`
}

module.exports = {
  buildDeviceAlertMessage,
  shouldTriggerDeviceAlert,
}
