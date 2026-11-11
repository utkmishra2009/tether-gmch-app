import { useEffect, useState, useCallback } from 'react';

export type ThemeChoice = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'tether-theme';
const media = () => window.matchMedia('(prefers-color-scheme: dark)');

function systemPrefersDark(): boolean {
  try { return media().matches; } catch { return false; }
}

export function getStoredThemeChoice(): ThemeChoice {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === 'light' || v === 'dark' || v === 'system') return v;
  } catch { /* ignore */ }
  return 'system';
}

function resolve(choice: ThemeChoice): 'light' | 'dark' {
  return choice === 'system' ? (systemPrefersDark() ? 'dark' : 'light') : choice;
}

function apply(choice: ThemeChoice) {
  document.documentElement.setAttribute('data-theme', resolve(choice));
}

/** Call once, synchronously, before the app renders — avoids a flash of the wrong theme. */
export function initTheme() {
  apply(getStoredThemeChoice());
}

export function useTheme() {
  const [choice, setChoiceState] = useState<ThemeChoice>(() => getStoredThemeChoice());

  useEffect(() => {
    apply(choice);
    if (choice !== 'system') return;
    const m = media();
    const onChange = () => apply('system');
    m.addEventListener?.('change', onChange);
    return () => m.removeEventListener?.('change', onChange);
  }, [choice]);

  const setChoice = useCallback((next: ThemeChoice) => {
    setChoiceState(next);
    try { localStorage.setItem(STORAGE_KEY, next); } catch { /* ignore */ }
  }, []);

  return { choice, setChoice };
}
