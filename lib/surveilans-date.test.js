const test = require('node:test')
const assert = require('node:assert/strict')
const { resolveSurveyDate } = require('./surveilans-date')

test('uses provided surveilans date when present', () => {
  const now = new Date('2026-06-09T10:00:00.000Z')
  const result = resolveSurveyDate({
    tanggalSurveilans: '2026-06-08T08:30:00.000Z',
    tanggalMasuk: '2026-06-01T00:00:00.000Z',
    now,
  })

  assert.equal(result.toISOString(), '2026-06-08T08:30:00.000Z')
})

test('falls back to current time when no surveilans date is provided', () => {
  const now = new Date('2026-06-09T10:00:00.000Z')
  const result = resolveSurveyDate({
    tanggalMasuk: '2026-05-30T00:00:00.000Z',
    now,
  })

  assert.equal(result.toISOString(), now.toISOString())
})
