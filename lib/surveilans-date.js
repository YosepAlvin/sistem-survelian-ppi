function parseDateInput(value) {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) {
      return null
    }

    const parsed = new Date(trimmed)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }

  return null
}

function resolveSurveyDate({ tanggalSurveilans, now = new Date() } = {}) {
  const explicitDate = parseDateInput(tanggalSurveilans)
  if (explicitDate) {
    return explicitDate
  }

  return now
}

module.exports = {
  resolveSurveyDate,
}
