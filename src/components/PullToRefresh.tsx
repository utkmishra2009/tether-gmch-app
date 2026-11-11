import React, { useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';

const TRIGGER_PX = 46;
const MAX_PULL = 78;

/**
 * Lightweight native touch-based pull-to-refresh for a single vertical scroll area — no
 * external library. Mount this as the direct child of the screen's scrollable container
 * (the div with `overflow-y-auto`); it reads that parent's `scrollTop` to only start
 * tracking a pull when already at the top, then calls `onRefresh` once the user releases
 * past the trigger distance. Since this is a mock with no backend, `onRefresh` is expected
 * to just re-arm the screen's skeleton loading state (see useSkeletonLoading) — a real
 * fetch is unnecessary because the underlying data is already derived live on every render.
 */
export default function PullToRefresh({ onRefresh, children }: { onRefresh: () => void; children: React.ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const startY = useRef<number | null>(null);
  const dragging = useRef(false);
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const scrollParent = () => rootRef.current?.parentElement ?? null;

  const onTouchStart = (e: React.TouchEvent) => {
    const sp = scrollParent();
    if (!sp || sp.scrollTop > 2 || refreshing) { startY.current = null; dragging.current = false; return; }
    startY.current = e.touches[0].clientY;
    dragging.current = true;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (!dragging.current || startY.current == null) return;
    const dy = e.touches[0].clientY - startY.current;
    if (dy <= 0) { setPull(0); return; }
    // Resist beyond the trigger point so it feels bounded, not endless.
    setPull(Math.min(dy * 0.5, MAX_PULL));
  };
  const finish = () => {
    if (!dragging.current) return;
    dragging.current = false;
    startY.current = null;
    setPull(curr => {
      if (curr >= TRIGGER_PX && !refreshing) {
        setRefreshing(true);
        onRefresh();
        window.setTimeout(() => { setRefreshing(false); setPull(0); }, 600);
        return TRIGGER_PX + 8;
      }
      return 0;
    });
  };

  const progress = Math.min(pull / TRIGGER_PX, 1);

  return (
    <div ref={rootRef} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={finish} onTouchCancel={finish}>
      <div
        className="flex items-center justify-center overflow-hidden"
        style={{ height: pull, transition: dragging.current ? 'none' : 'height .2s ease', opacity: progress }}
      >
        <RefreshCw
          size={18}
          strokeWidth={2}
          className={refreshing ? 'text-[var(--brand-teal)] m-spin' : 'text-[var(--brand-teal)]'}
          style={refreshing ? undefined : { transform: `rotate(${progress * 300}deg)` }}
        />
      </div>
      {children}
    </div>
  );
}
