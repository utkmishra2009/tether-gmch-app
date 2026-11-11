import { useEffect, useState, useCallback } from 'react';

const STORAGE_KEY = 'tether-a11y';

export function getStoredA11y(): boolean {
  try { return localStorage.getItem(STORAGE_KEY) === '1'; } catch { return false; }
}

function apply(on: boolean) {
  if (on) document.documentElement.setAttribute('data-a11y', 'true');
  else document.documentElement.removeAttribute('data-a11y');
}

/** Call once, synchronously, before the app renders. */
export function initA11y() {
  apply(getStoredA11y());
}

export function useA11yMode() {
  const [on, setOnState] = useState<boolean>(() => getStoredA11y());

  useEffect(() => { apply(on); }, [on]);

  const setOn = useCallback((next: boolean) => {
    setOnState(next);
    try { localStorage.setItem(STORAGE_KEY, next ? '1' : '0'); } catch { /* ignore */ }
  }, []);

  return { on, setOn };
}
