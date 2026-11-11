import React, { useEffect, useRef } from 'react';

// Login backdrop — one idea, kept quiet: a signal that radiates from the Tether mark (the "tether" reaching out).
//  • A soft light sits behind the mark and leans toward the finger on independent X/Y springs
//    (critically damped, so it never overshoots) and settles back when released.
//  • A thin ring leaves the mark every ~5.5s, slowing as it grows and fading before it reaches the edges.
//  • Press anywhere: a ring leaves that point on pointer-DOWN (response, not release).
// Compositor-friendly canvas, paused when hidden. Reduced motion → a still frame, no rings in flight.

const TEAL = '79,209,203';
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

interface Ring { x: number; y: number; t: number; dur: number; r0: number; r1: number; a: number }
interface Spring { p: number; v: number }

export default function LiveBackdrop() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current!; const ctx = cv.getContext('2d')!;
    const reduce = !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    let W = 0, H = 0, ax = 0, ay = 0, raf = 0, last = performance.now(), running = true, nextRing = 0.8;
    const rings: Ring[] = [];
    const sx: Spring = { p: 0, v: 0 }, sy: Spring = { p: 0, v: 0 };
    const target = { x: 0, y: 0 };

    const measure = () => {
      const r = cv.getBoundingClientRect(); W = r.width; H = r.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const el = document.querySelector('[data-live-anchor]') as HTMLElement | null;
      if (el) { const b = el.getBoundingClientRect(); ax = b.left - r.left + b.width / 2; ay = b.top - r.top + b.height / 2; } else { ax = W / 2; ay = H * 0.1; }
    };

    // Apple spring: damping ratio + response (seconds). k = (2π/response)², c = 4πζ/response.
    const step = (s: Spring, to: number, dt: number, response = 0.7, damping = 1) => {
      const k = Math.pow((2 * Math.PI) / response, 2), c = (4 * Math.PI * damping) / response;
      const n = 3, h = dt / n; for (let i = 0; i < n; i++) { s.v += (-k * (s.p - to) - c * s.v) * h; s.p += s.v * h; }
    };

    const emitFromMark = () => rings.push({ x: ax, y: ay, t: 0, dur: 9, r0: 34, r1: Math.max(W, H) * 0.78, a: 0.28 });
    const emitFromTouch = (x: number, y: number) => rings.push({ x, y, t: 0, dur: 1.5, r0: 8, r1: 170, a: 0.3 });

    const draw = (dt: number, still: boolean) => {
      ctx.clearRect(0, 0, W, H);
      if (!still) { step(sx, target.x, dt); step(sy, target.y, dt); }
      // light behind the mark
      const gx = ax + sx.p, gy = ay + sy.p;
      const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, 230);
      g.addColorStop(0, `rgba(${TEAL},0.30)`); g.addColorStop(0.55, `rgba(${TEAL},0.08)`); g.addColorStop(1, `rgba(${TEAL},0)`);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      // rings
      for (let i = rings.length - 1; i >= 0; i--) {
        const r = rings[i]; if (!still) r.t += dt / r.dur;
        if (r.t >= 1) { rings.splice(i, 1); continue; }
        const e = easeOut(r.t), rad = r.r0 + (r.r1 - r.r0) * e, al = r.a * Math.pow(1 - r.t, 1.6);
        ctx.strokeStyle = `rgba(${TEAL},${al.toFixed(3)})`; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(r.x, r.y, rad, 0, Math.PI * 2); ctx.stroke();
      }
    };

    const loop = (now: number) => {
      if (!running) return;
      const dt = Math.min((now - last) / 1000, 1 / 30); last = now;
      nextRing -= dt; if (nextRing <= 0) { emitFromMark(); nextRing = 5.5; }
      draw(dt, false); raf = requestAnimationFrame(loop);
    };

    measure();
    if (reduce) { rings.push({ x: ax, y: ay, t: 0.18, dur: 9, r0: 34, r1: Math.max(W, H) * 0.78, a: 0.28 }, { x: ax, y: ay, t: 0.5, dur: 9, r0: 34, r1: Math.max(W, H) * 0.78, a: 0.28 }); draw(0, true); }
    else raf = requestAnimationFrame(loop);

    const local = (e: PointerEvent) => { const r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    const lean = (x: number, y: number) => { target.x = Math.max(-26, Math.min(26, (x - ax) * 0.12)); target.y = Math.max(-26, Math.min(26, (y - ay) * 0.06)); };
    const onDown = (e: PointerEvent) => { const p = local(e); lean(p.x, p.y); if (!reduce) emitFromTouch(p.x, p.y); };
    const onMove = (e: PointerEvent) => { if (e.pressure > 0 || e.pointerType === 'mouse') { const p = local(e); lean(p.x, p.y); } };
    const onUp = () => { target.x = 0; target.y = 0; };
    const onVis = () => { running = !document.hidden; if (running && !reduce) { last = performance.now(); raf = requestAnimationFrame(loop); } else cancelAnimationFrame(raf); };
    const ro = new ResizeObserver(() => { measure(); if (reduce) draw(0, true); });
    ro.observe(cv);
    window.addEventListener('pointerdown', onDown, { passive: true }); window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerup', onUp); window.addEventListener('pointercancel', onUp);
    document.addEventListener('visibilitychange', onVis);
    return () => { running = false; cancelAnimationFrame(raf); ro.disconnect(); window.removeEventListener('pointerdown', onDown); window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); window.removeEventListener('pointercancel', onUp); document.removeEventListener('visibilitychange', onVis); };
  }, []);

  return (
    <div className="m-live" aria-hidden="true">
      <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
    </div>
  );
}
