const test = require('node:test')
const assert = require('node:assert/strict')
const { buildInitialDeviceSelection, applyDailyDeviceSnapshot, buildDeviceHistoryRows } = require('./daily-snapshot')

test('buildInitialDeviceSelection keeps the last daily snapshot state', () => {
  const previous = [
    { jenis_alat: 'Urine kateter', terpasang: true },
    { jenis_alat: 'Ventilator', terpasang: false },
  ]

  const selection = buildInitialDeviceSelection(previous, [
    { jenis_alat: 'Urine kateter', terpasang: true },
    { jenis_alat: 'Ventilator', terpasang: false },
  ])

  const urineDevice = selection.find((device) => device.jenis_alat === 'Urine kateter')
  const ventilatorDevice = selection.find((device) => device.jenis_alat === 'Ventilator')

  assert.equal(urineDevice?.terpasang, true)
  assert.equal(ventilatorDevice?.terpasang, false)
})

test('applyDailyDeviceSnapshot closes an active device when it is marked removed for today', async () => {
  const tx = {
    alatTerpasang: {
      findFirst: async () => ({ id: 10, masih_terpasang: true, tanggal_pasang: new Date('2026-06-01') }),
      create: async (data) => ({ id: 11, ...data.data }),
      update: async ({ where, data }) => ({ id: where.id, ...data }),
    },
  }

  const result = await applyDailyDeviceSnapshot({
    tx,
    rawatInapId: 7,
    devices: [{ jenis_alat: 'Urine kateter', terpasang: false }],
    surveyDate: new Date('2026-06-04'),
  })

  assert.equal(result.updated.length, 1)
  assert.equal(result.updated[0].masih_terpasang, false)
})

test('buildDeviceHistoryRows summarizes device statuses clearly', () => {
  const rows = buildDeviceHistoryRows([
    { jenis_alat: 'Urine kateter', tanggal_pasang: new Date('2026-06-01'), tanggal_lepas: new Date('2026-06-04'), masih_terpasang: false, device_day: 4 },
    { jenis_alat: 'Ventilator', tanggal_pasang: new Date('2026-06-04'), tanggal_lepas: null, masih_terpasang: true, device_day: 1 },
  ])

  assert.equal(rows[0].status, 'Dilepas')
  assert.equal(rows[1].status, 'Terpasang')
  assert.equal(rows[0].jenis_alat, 'Urine kateter')
})
