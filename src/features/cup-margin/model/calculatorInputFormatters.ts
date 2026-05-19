import { formatNumber } from "./formatters";

export function parseNumberInput(value: string) {
  const normalized = value.replace(/[^0-9]/g, "");
  return normalized ? Number(normalized) : 0;
}

export function parseSignedNumberInput(value: string) {
  const normalized = value.replace(/[^0-9-]/g, "");
  if (!normalized || normalized === "-") return 0;
  return Number(normalized);
}

export function formatInputValue(value: string | number) {
  if (typeof value === "string") return value;
  if (!Number.isFinite(value) || value === 0) return "";
  return formatNumber(value);
}
