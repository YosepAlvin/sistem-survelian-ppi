const test = require('node:test')
const assert = require('node:assert/strict')

const { applyDailyInfectionEvents, buildInfectionSnapshot, buildInfectionHistoryRows, normalizeLegacyInfectionEventStatus } = require('./haIs-event-tracking')

test('creates a new active infection event on first occurrence', () => {
  const result = applyDailyInfectionEvents({
    activeEvents: [],
    infections: [{ jenis: 'VAP', ada: true, hari_ke: '5', hasil_kultur: 'Kultur positif' }],
    surveyDate: new Date('2026-06-01'),
    userId: 7,
  })

  assert.equal(result.created.length, 1)
  assert.equal(result.updated.length, 0)
  assert.equal(result.created[0].jenis_infeksi, 'VAP')
  assert.equal(result.created[0].status, 'AKTIF')
  assert.equal(result.created[0].hari_ke, 5)
  assert.equal(result.created[0].catatan, 'Kultur positif')
})

test('does not create a duplicate event when the infection is still active the next day', () => {
  const result = applyDailyInfectionEvents({
    activeEvents: [{ id: 1, jenis_infeksi: 'VAP', status: 'AKTIF', tanggal_selesai: null }],
    infections: [{ jenis: 'VAP', ada: true, hari_ke: '6' }],
    surveyDate: new Date('2026-06-02'),
    userId: 7,
  })

  assert.equal(result.created.length, 0)
  assert.equal(result.updated.length, 0)
})

test('closes an active infection event when it is unchecked later', () => {
  const result = applyDailyInfectionEvents({
    activeEvents: [{ id: 2, jenis_infeksi: 'ISK', status: 'AKTIF', tanggal_selesai: null }],
    infections: [{ jenis: 'ISK', ada: false, hari_ke: '8' }],
    surveyDate: new Date('2026-06-03'),
    userId: 9,
  })

  assert.equal(result.created.length, 0)
  assert.equal(result.updated.length, 1)
  assert.equal(result.updated[0].status, 'PENDING_CLOSURE')
  assert.equal(result.updated[0].updated_by, 9)
})

test('builds a daily infection snapshot payload from checked infections', () => {
  const snapshot = buildInfectionSnapshot([
    { jenis: 'VAP', ada: true, hari_ke: '5', hasil_kultur: 'Ada' },
    { jenis: 'ISK', ada: false, hari_ke: '2' },
  ])

  assert.deepEqual(snapshot, [
    { jenis_infeksi: 'VAP', ada: true, hari_ke: 5, catatan: 'Ada' },
    { jenis_infeksi: 'ISK', ada: false, hari_ke: 2, catatan: '' },
  ])
})

test('formats infection history rows with readable status and audit fields', () => {
  const rows = buildInfectionHistoryRows([
    {
      jenis_infeksi: 'VAP',
      tanggal_kejadian: new Date('2026-06-03T08:00:00Z'),
      hari_ke: 5,
      status: 'AKTIF',
      tanggal_selesai: null,
      catatan: 'Kultur positif',
      createdBy: { nama: 'Admin IPCN' },
      updatedBy: null,
      created_at: new Date('2026-06-03T08:12:00Z'),
      updated_at: null,
    },
  ])

  assert.equal(rows[0].jenis_infeksi, 'VAP')
  assert.equal(rows[0].status, 'AKTIF')
  assert.equal(rows[0].dicatat_oleh, 'Admin IPCN')
  assert.equal(rows[0].tanggal_pencatatan, '03/06/2026 08:12')
})

test('marks legacy infection rows without explicit closure as review-required', () => {
  assert.equal(normalizeLegacyInfectionEventStatus({ status: 'AKTIF', tanggal_selesai: null }), 'REVIEW_REQUIRED')
  assert.equal(normalizeLegacyInfectionEventStatus({ status: 'SELESAI', tanggal_selesai: new Date('2026-06-07') }), 'SELESAI')
})
