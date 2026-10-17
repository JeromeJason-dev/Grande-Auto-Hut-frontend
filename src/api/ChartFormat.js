// Compact KES labels for axes: 1.2M, 450K, 800.
export function formatCompact(value) {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${+(value / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)}M`;
  if (abs >= 1_000) return `${+(value / 1_000).toFixed(abs >= 10_000 ? 0 : 1)}K`;
  return String(Math.round(value));
}

export function formatKES(value) {
  return `KES ${new Intl.NumberFormat("en-KE", { maximumFractionDigits: 0 }).format(Number(value) || 0)}`;
}