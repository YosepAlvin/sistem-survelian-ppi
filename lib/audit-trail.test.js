const test = require('node:test')
const assert = require('node:assert/strict')

const { buildAuditTrailEntry, aggregateAuditTrail } = require('./audit-trail')

test('builds an audit trail entry with before and after values', () => {
  const entry = buildAuditTrailEntry({
    action: 'CREATE_EVENT',
    moduleName: 'surveilans',
    userId: 3,
    userName: 'IPCLN',
    entityType: 'KejadianInfeksi',
    entityId: 15,
    previousValue: null,
    newValue: { status: 'AKTIF', status_verifikasi: 'PENDING' },
    timestamp: new Date('2026-06-09T08:10:00Z'),
  })

  assert.equal(entry.action, 'CREATE_EVENT')
  assert.equal(entry.moduleName, 'surveilans')
  assert.equal(entry.userName, 'IPCLN')
  assert.equal(entry.previousValue, null)
  assert.deepEqual(entry.newValue, { status: 'AKTIF', status_verifikasi: 'PENDING' })
})

test('aggregates audit trail actions by type', () => {
  const summary = aggregateAuditTrail([
    { action: 'CREATE_EVENT' },
    { action: 'UPDATE_EVENT' },
    { action: 'CLOSE_EVENT' },
    { action: 'CREATE_EVENT' },
  ])

  assert.deepEqual(summary, {
    CREATE_EVENT: 2,
    UPDATE_EVENT: 1,
    CLOSE_EVENT: 1,
  })
})
