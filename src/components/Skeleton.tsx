import React, { useEffect, useRef, useState, useCallback } from 'react';

function prefersReducedMotion() {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Drives a brief, deliberate "loading" moment for data-heavy screens in this client-only
 * mock (there is no real network latency to wait on). `refresh()` re-arms it — used by
 * pull-to-refresh to show the skeleton again without actually re-fetching anything, since
 * the underlying data is already derived live from the store on every render.
 */
export function useSkeletonLoading(opts?: { delay?: number; skipInitial?: boolean }) {
  const delay = opts?.delay ?? 380;
  const [loading, setLoading] = useState(() => !(opts?.skipInitial || prefersReducedMotion()));
  const timerRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (opts?.skipInitial || prefersReducedMotion()) { setLoading(false); return; }
    timerRef.current = window.setTimeout(() => setLoading(false), delay);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refresh = useCallback(() => {
    if (prefersReducedMotion()) return;
    setLoading(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setLoading(false), delay);
  }, [delay]);

  return [loading, refresh] as const;
}

export function SkeletonBlock({ className = '' }: { className?: string }) {
  return <div className={`m-skel ${className}`} />;
}

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="m-card p-3.5 space-y-2">
      <div className="flex items-center justify-between">
        <SkeletonBlock className="h-3 w-2/5" />
        <SkeletonBlock className="h-4 w-16 !rounded-full" />
      </div>
      <SkeletonBlock className="h-3.5 w-3/5" />
      {lines > 2 && <SkeletonBlock className="h-3 w-4/5" />}
    </div>
  );
}

export function SkeletonList({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-2.5" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => <SkeletonCard key={i} />)}
    </div>
  );
}

export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="m-card p-0 overflow-hidden">
          <SkeletonBlock className="h-24 w-full !rounded-none" />
          <div className="p-3 space-y-1.5">
            <SkeletonBlock className="h-3 w-1/2" />
            <SkeletonBlock className="h-2.5 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}
