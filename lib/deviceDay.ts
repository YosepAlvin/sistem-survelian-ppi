/**
 * Kalkulasi Device Day PPI
 * Sesuai Arsitektur Sistem PPI Bagian 3
 */
export function hitungDeviceDay(
  tanggalPasang: Date | string | null,
  tanggalLepas: Date | string | null
): number {
  if (!tanggalPasang) return 0;

  const start = new Date(tanggalPasang);
  const end = tanggalLepas ? new Date(tanggalLepas) : new Date();

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;

  // Reset jam ke 00:00:00 agar perhitungan hari akurat
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  const diffMs = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    return tanggalLepas ? 0 : 1;
  }

  // Minimal 1 hari sesuai dokumen arsitektur
  return Math.max(diffDays, 1);
}
