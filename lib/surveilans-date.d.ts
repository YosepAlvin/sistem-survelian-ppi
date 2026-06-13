export interface ResolveSurveyDateOptions {
  tanggalSurveilans?: unknown
  tanggalMasuk?: unknown
  now?: Date
}

export function resolveSurveyDate(options?: ResolveSurveyDateOptions): Date
