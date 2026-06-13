const test = require('node:test');
const assert = require('node:assert/strict');
const { buildVerificationSummary, getStatusMeta } = require('../lib/reporting');

test('buildVerificationSummary groups status counts and pending urgency', () => {
  const summary = buildVerificationSummary([
    { status: 'PENDING' },
    { status: 'PENDING' },
    { status: 'VERIFIED' },
    { status: 'REJECTED' },
  ]);

  assert.equal(summary.pending, 2);
  assert.equal(summary.verified, 1);
  assert.equal(summary.rejected, 1);
  assert.equal(summary.needsAttention, true);
});

test('getStatusMeta returns user-friendly labels for verification states', () => {
  assert.deepEqual(getStatusMeta('PENDING'), {
    label: 'Menunggu Verifikasi',
    tone: 'amber',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  });

  assert.deepEqual(getStatusMeta('VERIFIED'), {
    label: 'Terverifikasi',
    tone: 'green',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  });
});
