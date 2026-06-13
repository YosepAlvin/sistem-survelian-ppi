const test = require('node:test')
const assert = require('node:assert/strict')
const { buildMonthlySurveillanceRows } = require('./ipcln-rekap')

test('buildMonthlySurveillanceRows only includes admissions from the selected room', () => {
  const admissions = [
    {
      id: 1,
      tanggal_masuk: new Date('2026-06-01T00:00:00.000Z'),
      tanggal_keluar: new Date('2026-06-05T00:00:00.000Z'),
      status: 'PULANG',
      ruangan_id: 10,
      pasien: { nama: 'Pasien A', no_rm: '12-34-56' },
      surveilans_harian: [
        { uc_terpasang: true, ivl_terpasang: false, ventilator_terpasang: false },
      ],
      kejadian_infeksi: [
        { jenis_infeksi: 'Phlebitis', phlebitis: [{ id: 1 }], isk: [], hap_vap: [], iadp: [], dekubitus: [] },
      ],
    },
    {
      id: 2,
      tanggal_masuk: new Date('2026-06-10T00:00:00.000Z'),
      tanggal_keluar: null,
      status: 'AKTIF',
      ruangan_id: 20,
      pasien: { nama: 'Pasien B', no_rm: '88-12-90' },
      surveilans_harian: [
        { uc_terpasang: false, ivl_terpasang: true, ventilator_terpasang: true },
      ],
      kejadian_infeksi: [
        { jenis_infeksi: 'ISK', phlebitis: [], isk: [{ id: 1 }], hap_vap: [], iadp: [], dekubitus: [] },
      ],
    },
  ]

  const rows = buildMonthlySurveillanceRows(admissions, '2026-06', 10)

  assert.equal(rows.length, 1)
  assert.equal(rows[0].pasien, 'Pasien A')
  assert.equal(rows[0].uc, 1)
  assert.equal(rows[0].plb, 1)
})
