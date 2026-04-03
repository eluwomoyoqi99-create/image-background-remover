/**
 * Client-side guest usage tracking via localStorage.
 * Key format: guest_usage_YYYYMMDD
 */

function getTodayKey(): string {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `guest_usage_${y}${m}${day}`;
}

export function getGuestUsageCount(): number {
  if (typeof window === 'undefined') return 0;
  const val = localStorage.getItem(getTodayKey());
  return val ? parseInt(val, 10) : 0;
}

export function getGuestRemaining(limit: number = 3): number {
  return Math.max(0, limit - getGuestUsageCount());
}

export function incrementGuestUsage(): void {
  if (typeof window === 'undefined') return;
  const key = getTodayKey();
  const current = getGuestUsageCount();
  localStorage.setItem(key, String(current + 1));
}
