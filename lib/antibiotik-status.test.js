const test = require("node:test")
const assert = require("node:assert/strict")

const { calcAntibiotikStatus, countAntibiotikStatuses } = require("./antibiotik-status.ts")

test("calcAntibiotikStatus: AKTIF when no triggers and not near max duration", () => {
  const res = calcAntibiotikStatus(
    new Date("2026-06-01"),
    new Date("2026-06-10"),
    null,
    false,
    7,
    null,
    new Date("2026-06-03")
  )
  assert.equal(res.status, "AKTIF")
  assert.equal(res.hari_ke, 3)
  assert.deepEqual(res.alasan_review, [])
})

test("calcAntibiotikStatus: AKAN_SELESAI when within 2 days of max duration", () => {
  const res = calcAntibiotikStatus(
    new Date("2026-06-01"),
    new Date("2026-06-05"),
    null,
    false,
    7,
    null,
    new Date("2026-06-03")
  )
  assert.equal(res.status, "AKAN_SELESAI")
  assert.equal(res.hari_ke, 3)
})

test("calcAntibiotikStatus: OVERDUE when today is past planned end date", () => {
  const res = calcAntibiotikStatus(
    new Date("2026-06-01"),
    new Date("2026-06-02"),
    null,
    false,
    7,
    null,
    new Date("2026-06-03")
  )
  assert.equal(res.status, "OVERDUE")
  assert.equal(res.hari_ke, 3)
})

test("calcAntibiotikStatus: PERLU_REVIEW when restricted or has side effects (and not overdue)", () => {
  const res = calcAntibiotikStatus(
    new Date("2026-06-01"),
    new Date("2026-06-10"),
    null,
    true,
    7,
    "Mual",
    new Date("2026-06-03")
  )
  assert.equal(res.status, "PERLU_REVIEW")
  assert.equal(res.hari_ke, 3)
  assert.ok(res.alasan_review.includes("Antibiotik Restriksi"))
  assert.ok(res.alasan_review.includes("Efek Samping"))
})

test("calcAntibiotikStatus: SELESAI when tanggal_selesai_aktual is set", () => {
  const res = calcAntibiotikStatus(
    new Date("2026-06-01"),
    new Date("2026-06-05"),
    new Date("2026-06-04"),
    false,
    7,
    null,
    new Date("2026-06-10")
  )
  assert.equal(res.status, "SELESAI")
  assert.equal(res.hari_ke, 4)
})

test("countAntibiotikStatuses: aggregates counts and perlu_review_total", () => {
  const records = [
    { tanggal_mulai: new Date("2026-06-01"), tanggal_rencana_selesai: new Date("2026-06-10"), tanggal_selesai_aktual: null, efek_samping: null, antibiotik: { is_restriksi: false, durasi_maks_hari: 7 } },
    { tanggal_mulai: new Date("2026-06-01"), tanggal_rencana_selesai: new Date("2026-06-05"), tanggal_selesai_aktual: null, efek_samping: null, antibiotik: { is_restriksi: false, durasi_maks_hari: 7 } },
    { tanggal_mulai: new Date("2026-06-01"), tanggal_rencana_selesai: new Date("2026-06-02"), tanggal_selesai_aktual: null, efek_samping: null, antibiotik: { is_restriksi: false, durasi_maks_hari: 7 } },
    { tanggal_mulai: new Date("2026-06-01"), tanggal_rencana_selesai: new Date("2026-06-10"), tanggal_selesai_aktual: null, efek_samping: "Mual", antibiotik: { is_restriksi: false, durasi_maks_hari: 7 } },
    { tanggal_mulai: new Date("2026-06-01"), tanggal_rencana_selesai: new Date("2026-06-05"), tanggal_selesai_aktual: new Date("2026-06-04"), efek_samping: null, antibiotik: { is_restriksi: false, durasi_maks_hari: 7 } },
  ]

  const counts = countAntibiotikStatuses(records, new Date("2026-06-03"))

  assert.equal(counts.SELESAI, 1)
  assert.ok(counts.PERLU_REVIEW >= 1)
  assert.ok(counts.OVERDUE >= 1)
  assert.equal(counts.perlu_review_total, counts.PERLU_REVIEW + counts.OVERDUE)
})
