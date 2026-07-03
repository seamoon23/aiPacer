import type { ProviderType, ProviderUsageDirection } from "./types";

export function getProviderUsageDirection(
  providerType: ProviderType
): ProviderUsageDirection {
  if (providerType === "claude" || providerType === "claude-code") {
    return "used-up";
  }

  return "remaining-down";
}

export function getProviderDirectionLabel(providerType: ProviderType): string {
  return getProviderUsageDirection(providerType) === "used-up"
    ? "0->100으로 올라가는 사용량 표시"
    : "100->0으로 내려오는 잔여량 표시";
}

export function normalizeDisplayedUsageValue(
  providerType: ProviderType,
  displayedPct: number
): number {
  const clampedValue = Math.min(100, Math.max(0, displayedPct));

  return getProviderUsageDirection(providerType) === "used-up"
    ? 100 - clampedValue
    : clampedValue;
}

export function toProviderDisplayValue(
  providerType: ProviderType,
  remainingPct: number
): number {
  const clampedValue = Math.min(100, Math.max(0, remainingPct));

  return getProviderUsageDirection(providerType) === "used-up"
    ? 100 - clampedValue
    : clampedValue;
}
