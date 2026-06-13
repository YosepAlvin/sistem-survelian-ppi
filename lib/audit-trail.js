function formatAuditValue(value) {
  if (value === null || value === undefined) return null
  if (typeof value === 'string') return value
  return JSON.stringify(value)
}

function buildAuditTrailEntry({
  action,
  moduleName,
  userId,
  userName,
  entityType,
  entityId,
  field,
  previousValue,
  newValue,
  ipAddress,
  timestamp = new Date(),
}) {
  return {
    action,
    moduleName,
    userId: userId ?? null,
    userName: userName ?? null,
    entityType,
    entityId: entityId ?? null,
    field: field || null,
    previousValue: formatAuditValue(previousValue),
    newValue: formatAuditValue(newValue),
    ipAddress: ipAddress || null,
    timestamp,
  }
}

function aggregateAuditTrail(entries = []) {
  return (entries || []).reduce((acc, entry) => {
    const action = entry?.action || 'UNKNOWN'
    acc[action] = (acc[action] || 0) + 1
    return acc
  }, {})
}

module.exports = {
  buildAuditTrailEntry,
  aggregateAuditTrail,
  formatAuditValue,
}
