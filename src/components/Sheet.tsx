import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

// Fluid bottom sheet. Behaviour over animation: the sheet is a spring-driven object that follows
// the finger 1:1, hands the release velocity to the spring, projects momentum to decide where it
// lands, rubber-bands at the top edge, and can be grabbed again at any instant mid-flight
// (every spring starts from the sheet's *current* on-screen position, never its target).

const reduced = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
// Exponential-decay projection (same form as scroll deceleration): where would this flick come to rest?
const project = (v: number, d = 0.998) => ((v / 1000) * d) / (1 - d);
const rubberband = (over: number, dim: number, c = 0.55) => (over * dim * c) / (dim + c * Math.abs(over));

export default function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title?: string; children: React.ReactNode }) {
  const [mounted, setMounted] = useState(open);
  const sheetRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const pos = useRef(0);
  const raf = useRef(0);
  const height = useRef(600);
  const shown = useRef(false);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const drag = useRef<{ startY: number; startPos: number; hist: { t: number; y: number }[] } | null>(null);

  const apply = (v: number) => {
    pos.current = v;
    if (sheetRef.current) sheetRef.current.style.transform = `translate3d(0,${v}px,0)`;
    if (backdropRef.current) backdropRef.current.style.opacity = String(Math.max(0, 1 - Math.max(0, v) / height.current));
  };

  // Critically-damped (1.0) by default; ~0.8 only when a flick carried momentum.
  const springTo = (target: number, velocity: number, damping: number, response: number, done?: () => void) => {
    cancelAnimationFrame(raf.current);
    if (reduced()) { apply(target); done?.(); return; }
    const k = Math.pow((2 * Math.PI) / response, 2);
    const c = (4 * Math.PI * damping) / response;
    let p = pos.current, v = velocity, last = performance.now();
    const step = (now: number) => {
      const dt = Math.min((now - last) / 1000, 1 / 30); last = now;
      const n = 4, h = dt / n;
      for (let i = 0; i < n; i++) { v += (-k * (p - target) - c * v) * h; p += v * h; }
      apply(p);
      if (Math.abs(p - target) < 0.4 && Math.abs(v) < 8) { apply(target); done?.(); return; }
      raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
  };

  useEffect(() => { if (open) setMounted(true); }, [open]);

  useLayoutEffect(() => {
    if (!mounted || !sheetRef.current) return;
    height.current = sheetRef.current.offsetHeight;
    if (open) {
      if (!shown.current) { shown.current = true; apply(height.current); } // start fully off-screen
      springTo(0, 0, 1, 0.34);
    } else {
      springTo(height.current, 0, 1, 0.3, () => { shown.current = false; setMounted(false); });
    }
    return () => cancelAnimationFrame(raf.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mounted]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeRef.current(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    cancelAnimationFrame(raf.current); // grab it mid-flight: no waiting for the animation to finish
    e.currentTarget.setPointerCapture(e.pointerId);
    height.current = sheetRef.current?.offsetHeight || height.current;
    drag.current = { startY: e.clientY, startPos: pos.current, hist: [{ t: e.timeStamp, y: e.clientY }] };
  };
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current; if (!d) return;
    let p = d.startPos + (e.clientY - d.startY); // keeps the offset from where it was grabbed
    if (p < 0) p = -rubberband(-p, 140);          // soft top boundary
    d.hist.push({ t: e.timeStamp, y: e.clientY });
    while (d.hist.length > 2 && e.timeStamp - d.hist[0].t > 100) d.hist.shift();
    apply(p);
  };
  const onUp = () => {
    const d = drag.current; if (!d) return; drag.current = null;
    const a = d.hist[0], b = d.hist[d.hist.length - 1];
    const v = b.t - a.t > 8 ? ((b.y - a.y) / (b.t - a.t)) * 1000 : 0; // px/s at release
    const projected = pos.current + project(v);
    if (projected > height.current * 0.5) springTo(height.current, v, 1, 0.3, () => closeRef.current());
    else springTo(0, v, Math.abs(v) > 300 ? 0.8 : 1, 0.3);
  };

  if (!mounted) return null;
  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center" style={{ pointerEvents: open ? 'auto' : 'none' }} onClick={() => closeRef.current()}>
      <div ref={backdropRef} className="absolute inset-0" style={{ background: 'rgba(15,23,32,0.45)', opacity: 0 }} />
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-full max-w-[430px] bg-white rounded-t-[26px] m-sheet-surface"
        style={{ maxHeight: '86vh', willChange: 'transform' }}
        onClick={e => e.stopPropagation()}
      >
        <div onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} style={{ touchAction: 'none', cursor: 'grab' }}>
          <div className="flex justify-center pt-2.5 pb-1"><div className="w-9 h-1.5 rounded-full bg-slate-200" /></div>
          {title && <div className="px-5 pt-1 pb-3 m-heading text-slate-800 border-b border-slate-100">{title}</div>}
        </div>
        <div className="overflow-y-auto px-5 py-4 m-safe-bottom" style={{ maxHeight: 'calc(86vh - 60px)' }}>
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
