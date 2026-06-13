/**
 * Shared status calculation logic for PenggunaanAntibiotik.
 * Single source of truth — used by route.ts, export/route.ts,
 * analytics/route.ts, and notifications/route.ts.
 *
 * Status definitions (canonical):
 *   SELESAI       — tanggal_selesai is set (therapy marked done)
 *   OVERDUE       — tanggal_selesai is set AND that date is in the past
 *   AKAN_SELESAI  — tanggal_selesai is set AND ≤2 days remaining
 *   PERLU_REVIEW  — no tanggal_selesai, but: restriksi OR durasi melebihi batas OR efek samping
 *   AKTIF         — no tanggal_selesai, no review triggers
 */

export type AntibiotikStatus =
  | "AKTIF"
  | "AKAN_SELESAI"
  | "OVERDUE"
  | "PERLU_REVIEW"
  | "SELESAI"

export interface AntibiotikStatusResult {
  status: AntibiotikStatus
  hari_ke: number
  alasan_review: string[]
}

/**
 * Calculate the status and supporting metadata for one PenggunaanAntibiotik record.
 *
 * @param tanggal_mulai   - therapy start date
 * @param tanggal_selesai - therapy end date (null = still active)
 * @param is_restriksi    - antibiotic is a restricted type
 * @param durasi_maks_hari - maximum allowed duration in days
 * @param efek_samping    - side effect string (null/empty = none)
 * @param today           - optional override for "today" (defaults to current date at midnight)
 */
export function calcAntibiotikStatus(
  tanggal_mulai: Date | string,
  tanggal_selesai: Date | string | null,
  is_restriksi: boolean,
  durasi_maks_hari: number | null | undefined,
  efek_samping: string | null | undefined,
  today?: Date
): AntibiotikStatusResult {
  const todayDate = today ? new Date(today) : new Date()
  todayDate.setHours(0, 0, 0, 0)

  const startDate = new Date(tanggal_mulai)
  startDate.setHours(0, 0, 0, 0)

  const hari_ke = Math.max(
    1,
    Math.floor(1 + (todayDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  )

  const durasiMaks = durasi_maks_hari ?? 7

  // ── SELESAI: end date is set (manually marked complete) ──────────────────
  if (tanggal_selesai) {
    const endDate = new Date(tanggal_selesai)
    endDate.setHours(0, 0, 0, 0)
    const daysRemaining = Math.ceil(
      (endDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24)
    )

    // OVERDUE: end date has already passed
    if (daysRemaining < 0) {
      return {
        status: "OVERDUE",
        hari_ke,
        alasan_review: ["Overdue"],
      }
    }

    // AKAN_SELESAI: ends today, tomorrow, or the day after
    if (daysRemaining <= 2) {
      return {
        status: "AKAN_SELESAI",
        hari_ke,
        alasan_review: [],
      }
    }

    // End date set but still in the future → SELESAI marker is not "complete" yet
    // Treat as AKTIF with no review triggers from the end date alone
    return {
      status: "SELESAI",
      hari_ke,
      alasan_review: [],
    }
  }

  // ── Active therapy (no tanggal_selesai) ─────────────────────────────────
  const alasan_review: string[] = []

  if (is_restriksi) alasan_review.push("Antibiotik Restriksi")
  if (hari_ke > durasiMaks) alasan_review.push(`Durasi > ${durasiMaks} hari`)
  if (efek_samping) alasan_review.push("Efek Samping")

  if (alasan_review.length > 0) {
    return { status: "PERLU_REVIEW", hari_ke, alasan_review }
  }

  return { status: "AKTIF", hari_ke, alasan_review: [] }
}

/** Human-readable label for a status value */
export function statusLabel(status: AntibiotikStatus): string {
  switch (status) {
    case "AKTIF":       return "Aktif"
    case "AKAN_SELESAI":return "Akan Selesai"
    case "OVERDUE":     return "Overdue"
    case "PERLU_REVIEW":return "Perlu Review"
    case "SELESAI":     return "Selesai"
  }
}

/** Tooltip text for each status */
export const STATUS_TOOLTIP: Record<AntibiotikStatus, string> = {
  AKTIF:        "Terapi sedang berjalan",
  AKAN_SELESAI: "Terapi berakhir dalam 2 hari ke depan",
  OVERDUE:      "Tanggal selesai telah terlewat",
  PERLU_REVIEW: "Memerlukan evaluasi IPCN",
  SELESAI:      "Terapi telah diselesaikan",
}
