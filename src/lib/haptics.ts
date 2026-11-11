// Haptics where the platform allows (Android/Chromium Vibration API; iOS Safari ignores it silently).
// Fire on the causal event only — selection ticks, commits, success — never on every tap.
const ok = () => typeof navigator !== 'undefined' && 'vibrate' in navigator &&
  !(typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
const buzz = (p: number | number[]) => { try { if (ok()) navigator.vibrate(p); } catch { /* ignore */ } };
export const haptic = {
  tick: () => buzz(8),
  commit: () => buzz(14),
  success: () => buzz([12, 40, 18]),
  warn: () => buzz([20, 50, 20]),
};
