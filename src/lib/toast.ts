/** 简易 Toast — 对齐 NativeThink 轻提示 */
type Kind = 'info' | 'success' | 'error';

let root: HTMLElement | null = null;

function ensureRoot() {
  if (root && document.body.contains(root)) return root;
  root = document.getElementById('cet-toast-root');
  if (!root) {
    root = document.createElement('div');
    root.id = 'cet-toast-root';
    root.style.cssText =
      'position:fixed;left:50%;bottom:88px;transform:translateX(-50%);z-index:100;display:flex;flex-direction:column;gap:8px;align-items:center;pointer-events:none;max-width:92vw';
    document.body.appendChild(root);
  }
  return root;
}

export function toast(message: string, kind: Kind = 'info', duration = 2200) {
  const el = document.createElement('div');
  el.textContent = message;
  const colors: Record<Kind, string> = {
    info: 'bg-card text-foreground border-border',
    success: 'bg-[#ecfdf5] text-[#047857] border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30',
    error: 'bg-[#fff1f2] text-[#be123c] border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30',
  };
  el.className = `pointer-events-none rounded-2xl border px-4 py-2 text-xs font-bold shadow-lg ${colors[kind]}`;
  ensureRoot()!.appendChild(el);
  setTimeout(() => el.remove(), duration);
}
