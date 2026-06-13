const STATUS_META = {
  PENDING: {
    label: 'Menunggu Verifikasi',
    tone: 'amber',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  },
  VERIFIED: {
    label: 'Terverifikasi',
    tone: 'green',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  },
  REJECTED: {
    label: 'Ditolak',
    tone: 'red',
    badgeClass: 'bg-red-500/15 text-red-300 border-red-500/30',
  },
  REVIEW_REQUIRED: {
    label: 'Perlu Review',
    tone: 'purple',
    badgeClass: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
  },
};

function getStatusMeta(status) {
  const normalized = String(status || 'PENDING').toUpperCase();
  return STATUS_META[normalized] || STATUS_META.PENDING;
}

function buildVerificationSummary(reports) {
  const counts = reports.reduce(
    (acc, report) => {
      const normalized = String(report?.status || 'PENDING').toUpperCase();
      if (normalized === 'VERIFIED') acc.verified += 1;
      else if (normalized === 'REJECTED') acc.rejected += 1;
      else acc.pending += 1;
      return acc;
    },
    { pending: 0, verified: 0, rejected: 0 }
  );

  return {
    ...counts,
    needsAttention: counts.pending > 0,
  };
}

module.exports = {
  getStatusMeta,
  buildVerificationSummary,
};
