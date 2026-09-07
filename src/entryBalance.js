// Descriptive bands for the published Dart/Pat distribution, not significance tests.
export function entryBalance(darts, pats) {
  const total = darts + pats;
  if (!total) return { total: 0, patShare: null, label: "No entries in this period", detail: "" };
  const patShare = pats / total;
  const dominantShare = Math.max(darts, pats) / total;
  const direction = darts > pats ? "Dart" : "Pat";
  const label = darts === pats ? "Even split"
    : dominantShare <= 0.55 ? "Nearly even"
    : dominantShare < 0.6 ? `${direction} lean`
    : dominantShare < 0.75 ? `Fairly strong ${direction} lean`
    : `Strong ${direction} lean`;
  const patPercent = Math.round(patShare * 100);
  return { total, patShare, label, detail: `${100 - patPercent}% Darts · ${patPercent}% Pats` };
}
