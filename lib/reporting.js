const STATUS_META = {
  PENDING: {
    label: 'Menunggu Verifikasi',
    tone: 'amber',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  VERIFIED: {
    label: 'Terverifikasi',
    tone: 'green',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  REJECTED: {
    label: 'Ditolak',
    tone: 'red',
    badgeClass: 'bg-red-50 text-red-700 border-red-200',
  },
  REVIEW_REQUIRED: {
    label: 'Perlu Review',
    tone: 'purple',
    badgeClass: 'bg-violet-50 text-violet-700 border-violet-200',
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
