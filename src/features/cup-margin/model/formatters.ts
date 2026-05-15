export function formatWon(value: number) {
  return `${formatNumber(value)}원`;
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("ko-KR").format(value);
}

export function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}
