/**
 * Shared status calculation logic for PenggunaanAntibiotik.
 * Single source of truth — used by route.ts, export/route.ts,
 * analytics/route.ts, and notifications/route.ts.
 *
 * Status definitions (canonical):
 *   SELESAI       — tanggal_selesai_aktual is set (therapy completed)
 *   OVERDUE       — tanggal_selesai_aktual is null AND today > tanggal_rencana_selesai
 *   AKAN_SELESAI  — tanggal_selesai_aktual is null AND days remaining to tanggal_rencana_selesai <= 2
 *   PERLU_REVIEW  — active therapy with review triggers (restriksi and/or efek samping)
 *   AKTIF         — active therapy without triggers
 */

export type AntibiotikStatus =
  | "AKTIF"
  | "AKAN_SELESAI"
  | "OVERDUE"
  | "PERLU_REVIEW"
  | "SUDAH_DIREVIEW"
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
 * @param tanggal_rencana_selesai - planned end date
 * @param tanggal_selesai_aktual - actual end date (null = still active)
 * @param is_restriksi    - antibiotic is a restricted type
 * @param durasi_maks_hari - maximum allowed duration in days
 * @param efek_samping    - side effect string (null/empty = none)
 * @param tanggal_review  - date when IPCN reviewed (null = not reviewed yet)
 * @param today           - optional override for "today" (defaults to current date at midnight)
 */
export function calcAntibiotikStatus(
  tanggal_mulai: Date | string,
  tanggal_rencana_selesai: Date | string | null,
  tanggal_selesai_aktual: Date | string | null,
  is_restriksi: boolean,
  durasi_maks_hari: number | null | undefined,
  efek_samping: string | null | undefined,
  tanggal_review: Date | string | null | undefined,
  today?: Date
): AntibiotikStatusResult {
  const todayDate = today ? new Date(today) : new Date()
  todayDate.setHours(0, 0, 0, 0)

  const startDate = new Date(tanggal_mulai)
  startDate.setHours(0, 0, 0, 0)

  const durasiMaks = durasi_maks_hari ?? 7

  const plannedEndDate = tanggal_rencana_selesai
    ? new Date(tanggal_rencana_selesai)
    : new Date(startDate.getTime() + (durasiMaks - 1) * 24 * 60 * 60 * 1000)
  plannedEndDate.setHours(0, 0, 0, 0)

  if (tanggal_selesai_aktual) {
    const endDate = new Date(tanggal_selesai_aktual)
    endDate.setHours(0, 0, 0, 0)
    const hari_ke = Math.max(
      1,
      Math.floor(1 + (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    )
    return { status: "SELESAI", hari_ke, alasan_review: [] }
  }

  const hari_ke = Math.max(
    1,
    Math.floor(1 + (todayDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  )

  const alasan_review: string[] = []

  if (is_restriksi) alasan_review.push("Antibiotik Restriksi")
  if (efek_samping) alasan_review.push("Efek Samping")

  const daysRemaining = Math.ceil(
    (plannedEndDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24)
  )

  if (daysRemaining < 0) {
    return {
      status: "OVERDUE",
      hari_ke,
      alasan_review: [...alasan_review, "Lewat tanggal rencana selesai"],
    }
  }

  if (daysRemaining <= 2) {
    return { status: "AKAN_SELESAI", hari_ke, alasan_review: [] }
  }

  if (alasan_review.length > 0) {
    if (tanggal_review) {
      return { status: "SUDAH_DIREVIEW", hari_ke, alasan_review }
    }
    return { status: "PERLU_REVIEW", hari_ke, alasan_review }
  }

  return { status: "AKTIF", hari_ke, alasan_review: [] }
}

/** Human-readable label for a status value */
export function statusLabel(status: AntibiotikStatus): string {
  switch (status) {
    case "AKTIF":         return "Aktif"
    case "AKAN_SELESAI":  return "Akan Selesai"
    case "OVERDUE":       return "Overdue"
    case "PERLU_REVIEW":  return "Perlu Review"
    case "SUDAH_DIREVIEW":return "Sudah Direview"
    case "SELESAI":       return "Selesai"
  }
}

/** Tooltip text for each status */
export const STATUS_TOOLTIP: Record<AntibiotikStatus, string> = {
  AKTIF:          "Terapi sedang berjalan",
  AKAN_SELESAI:   "Tanggal rencana selesai dalam 2 hari ke depan",
  OVERDUE:        "Melewati tanggal rencana selesai",
  PERLU_REVIEW:   "Memerlukan evaluasi IPCN",
  SUDAH_DIREVIEW: "Sudah direview oleh IPCN",
  SELESAI:        "Terapi telah diselesaikan",
}

export type AntibiotikStatusCounts = Record<AntibiotikStatus, number> & {
  perlu_review_total: number
}

export function countAntibiotikStatuses(records: any[], today?: Date): AntibiotikStatusCounts {
  const counts: Record<AntibiotikStatus, number> = {
    AKTIF: 0,
    AKAN_SELESAI: 0,
    OVERDUE: 0,
    PERLU_REVIEW: 0,
    SUDAH_DIREVIEW: 0,
    SELESAI: 0,
  }

  for (const ab of records) {
    const { status } = calcAntibiotikStatus(
      ab.tanggal_mulai,
      ab.tanggal_rencana_selesai,
      ab.tanggal_selesai_aktual,
      ab.antibiotik?.is_restriksi ?? false,
      ab.antibiotik?.durasi_maks_hari,
      ab.efek_samping,
      ab.tanggal_review,
      today
    )
    counts[status]++
  }

  return {
    ...counts,
    perlu_review_total: counts.PERLU_REVIEW + counts.OVERDUE,
  }
}
