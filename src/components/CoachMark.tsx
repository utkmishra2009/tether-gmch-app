import React, { useState } from 'react';
import { Lightbulb, X } from 'lucide-react';

/** Tracks whether a first-visit coach-mark has been dismissed (or already shown once). */
export function useCoachMark(key: string) {
  const storageKey = `tether-coach-${key}`;
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(storageKey) === '1'; } catch { return true; }
  });
  const dismiss = () => {
    try { localStorage.setItem(storageKey, '1'); } catch { /* ignore */ }
    setDismissed(true);
  };
  return [dismissed, dismiss] as const;
}

export function CoachMark({ show, onDismiss, text }: { show: boolean; onDismiss: () => void; text: string }) {
  if (!show) return null;
  return (
    <div className="mb-3 m-rise">
      <div className="rounded-2xl px-3.5 py-3 flex items-start gap-2.5" style={{ background: 'var(--grad-navy)', boxShadow: 'var(--shadow-raised)' }}>
        <Lightbulb size={16} className="text-amber-300 shrink-0 mt-0.5" strokeWidth={1.9} />
        <p className="flex-1 text-[12.5px] text-white/90 leading-relaxed">{text}</p>
        <button onClick={onDismiss} className="text-white/60 shrink-0 m-tap" aria-label="Dismiss tip"><X size={16} /></button>
      </div>
    </div>
  );
}
