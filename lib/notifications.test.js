const test = require('node:test')
const assert = require('node:assert/strict')
const { buildDeviceAlertMessage, shouldTriggerDeviceAlert } = require('./notifications')

test('buildDeviceAlertMessage returns an alert when days exceed threshold', () => {
  const message = buildDeviceAlertMessage({
    jenisAlat: 'Urine Kateter',
    pasienNama: 'Ahmad Fauzi',
    ruangan: 'ICU',
    hariPasang: 8,
    threshold: 7,
  })

  assert.match(message, /Urine Kateter/) 
  assert.match(message, /8 hari/) 
})

test('shouldTriggerDeviceAlert stays false below threshold', () => {
  const shouldAlert = shouldTriggerDeviceAlert({
    jenisAlat: 'Ventilator',
    hariPasang: 10,
    threshold: 14,
  })

  assert.equal(shouldAlert, false)
})
