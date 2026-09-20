export type Theme = 'light' | 'dark';

const KEY = 'cetthink_theme';

export function getStoredTheme(): Theme {
  try {
    const v = localStorage.getItem(KEY);
    if (v === 'dark' || v === 'light') return v;
  } catch {
    /* ignore */
  }
  return 'light';
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', theme === 'dark' ? '#0f1716' : '#f4faf8');
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    /* ignore */
  }
}
