export function formatMoney(value: number) { return `$${Math.round(value).toLocaleString()}`; }
export function formatCompact(value: number) {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${Math.round(value / 1000)}K`;
  return `${Math.round(value)}`;
}
export function signed(value: number) { return `${value >= 0 ? "+" : ""}${Math.round(value)}`; }
