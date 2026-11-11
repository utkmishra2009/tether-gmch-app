import React from 'react';

// Circular progress ring. The arc animates with a spring-like ease; `done` swaps to the success
// colour and fires the one-shot celebratory pulse (suppressed under reduced motion via CSS).
export default function ProgressRing({ value, size = 64, stroke = 7, done = false, children }: { value: number; size?: number; stroke?: number; done?: boolean; children?: React.ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  return (
    <div className={`relative shrink-0 ${done ? 'm-success-ring' : ''}`} style={{ width: size, height: size }} role="img" aria-label={`${Math.round(v * 100)} percent complete`}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border-subtle, #e5eaee)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={done ? '#10b981' : 'var(--brand-teal)'} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - v)}
          style={{ transition: 'stroke-dashoffset .8s cubic-bezier(.22,.8,.32,1), stroke .3s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}
