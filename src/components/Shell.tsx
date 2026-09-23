import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Home,
  BookOpen,
  RefreshCw,
  Headphones,
  FileText,
  Target,
  BookX,
  PenLine,
  Sparkles,
  Mic,
  Settings,
  BarChart3,
  MoreHorizontal,
  X,
  Puzzle,
  Heart,
  Menu,
} from 'lucide-react';
import { cn } from '../lib/cn';
import { rememberVisit } from '../lib/page-memory';
import GlobalWordSearch from './GlobalWordSearch';

type IconT = typeof Home;

const NAV: { to: string; label: string; short: string; icon: IconT; group: 'main' | 'more' }[] = [
  { to: '/', label: '首页仪表盘', short: '首页', icon: Home, group: 'main' },
  { to: '/vocab', label: '背单词', short: '背词', icon: BookOpen, group: 'main' },
  { to: '/review', label: '智能复习', short: '复习', icon: RefreshCw, group: 'main' },
  { to: '/listening', label: '听力精听', short: '听力', icon: Headphones, group: 'main' },
  { to: '/reading', label: '阅读理解', short: '阅读', icon: FileText, group: 'more' },
  { to: '/dictation', label: '听写训练', short: '听写', icon: Mic, group: 'more' },
  { to: '/grammar', label: '语法专项', short: '语法', icon: Puzzle, group: 'more' },
  { to: '/exam', label: '模拟考试', short: '模考', icon: Target, group: 'more' },
  { to: '/errors', label: '错题本', short: '错题', icon: BookX, group: 'more' },
  { to: '/favorites', label: '我的收藏', short: '收藏', icon: Heart, group: 'more' },
  { to: '/writing', label: '写作翻译', short: '写作', icon: PenLine, group: 'more' },
  { to: '/skills', label: '词根拓展', short: '拓展', icon: Sparkles, group: 'more' },
  { to: '/progress', label: '学习记录', short: '记录', icon: BarChart3, group: 'more' },
  { to: '/settings', label: '设置', short: '设置', icon: Settings, group: 'more' },
];

const PRIMARY = NAV.filter((n) => n.group === 'main');
const MORE = NAV.filter((n) => n.group === 'more');

function SideNav({ collapsed = false, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) {
  const { pathname } = useLocation();
  return (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-2">
      {NAV.map(({ to, label, icon: Icon }) => {
        const active = to === '/' ? pathname === '/' : pathname.startsWith(to);
        return (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            title={collapsed ? label : undefined}
            className={cn(
              'flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-bold transition-colors',
              active
                ? 'bg-primary text-white shadow-md shadow-emerald-200/40 dark:shadow-emerald-900/30'
                : 'text-foreground/65 hover:bg-muted hover:text-foreground',
              collapsed && 'justify-center px-0',
            )}
          >
            <Icon className="size-5 shrink-0" />
            {!collapsed && <span className="truncate">{label}</span>}
          </NavLink>
        );
      })}
    </nav>
  );
}

export default function Shell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const current = useMemo(
    () => NAV.find((n) => (n.to === '/' ? pathname === '/' : pathname.startsWith(n.to))),
    [pathname],
  );
  const title = current?.label || 'CetThink';
  const moreActive = MORE.some((n) => pathname.startsWith(n.to));

  useEffect(() => {
    if (current && current.to !== '/') rememberVisit(current.to, current.label);
  }, [current, pathname]);

  useEffect(() => {
    setMoreOpen(false);
    setDrawerOpen(false);
  }, [pathname]);

  return (
    <div className="flex min-h-[100dvh] bg-background text-foreground">
      {/* 桌面/平板：侧边栏（NativeThink 风格） */}
      <aside className="hidden shrink-0 flex-col border-r border-border/70 bg-card/80 backdrop-blur-md lg:flex lg:w-60">
        <div className="safe-top flex items-center gap-3 border-b border-border/70 px-4 py-4">
          <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#00B894] to-emerald-500 text-white shadow-md shadow-emerald-200/40 dark:shadow-emerald-900/30">
            <span className="text-[11px] font-black">四六</span>
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-black tracking-tight">
              Cet<span className="text-ink-teal">Think</span>
            </div>
            <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              四六级备考
            </div>
          </div>
        </div>
        <SideNav />
      </aside>

      {/* 主列 */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="safe-top sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-xl">
          <div className="mx-auto flex h-14 max-w-3xl items-center gap-3 px-4 lg:max-w-4xl">
            <button
              type="button"
              aria-label="打开菜单"
              className="grid size-10 shrink-0 place-items-center rounded-2xl border border-border/60 bg-card lg:hidden"
              onClick={() => setDrawerOpen(true)}
            >
              <Menu className="size-4" />
            </button>
            <div className="grid size-9 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#00B894] to-emerald-500 text-white shadow-md shadow-emerald-200/40 dark:shadow-emerald-900/30 lg:hidden">
              <span className="text-[11px] font-black">四六</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-black tracking-tight">
                CetThink <span className="text-ink-teal">· {title}</span>
              </div>
              <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                四六级备考
              </div>
            </div>
            <GlobalWordSearch />
          </div>
        </header>

        <main
          key={pathname}
          className="page-enter scroll-y mx-auto w-full max-w-3xl flex-1 px-4 pb-28 pt-4 lg:max-w-4xl lg:pb-10 lg:pl-6"
        >
          {children}
        </main>
      </div>

      {/* 手机：底部 Tab */}
      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/95 backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex h-16 max-w-3xl items-stretch">
          {PRIMARY.map(({ to, short, icon: Icon }) => {
            const active = to === '/' ? pathname === '/' : pathname.startsWith(to);
            return (
              <NavLink
                key={to}
                to={to}
                className={cn(
                  'relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-bold transition-colors',
                  active ? 'text-ink-teal' : 'text-foreground/55',
                )}
              >
                {active && <span className="absolute top-0 h-0.5 w-8 rounded-b-full bg-[#00B894]" />}
                <Icon
                  className={cn('size-5', active && 'drop-shadow-[0_0_6px_rgba(0,184,148,0.4)]')}
                  strokeWidth={active ? 2.5 : 2}
                />
                <span className={active ? 'font-black' : undefined}>{short}</span>
              </NavLink>
            );
          })}
          <button
            type="button"
            onClick={() => setMoreOpen((v) => !v)}
            className={cn(
              'relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-bold transition-colors',
              moreActive || moreOpen ? 'text-ink-teal' : 'text-foreground/55',
            )}
          >
            {(moreActive || moreOpen) && <span className="absolute top-0 h-0.5 w-8 rounded-b-full bg-[#00B894]" />}
            <MoreHorizontal className="size-5" />
            <span className={moreActive || moreOpen ? 'font-black' : undefined}>更多</span>
          </button>
        </div>
      </nav>

      {/* 手机抽屉：完整侧栏 */}
      {(drawerOpen || moreOpen) && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label="关闭"
            className="absolute inset-0 bg-black/40"
            onClick={() => {
              setDrawerOpen(false);
              setMoreOpen(false);
            }}
          />
          <div
            className={cn(
              'safe-bottom absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-hidden rounded-t-3xl border-t border-border/60 bg-card shadow-2xl',
              // 抽屉（☰）从 top-0 铺满整屏，必须自带 safe-top：状态栏是透明的
              // （styles.xml: statusBarColor=transparent + targetSdk 36 强制 edge-to-edge），
              // 少了它「CetThink 菜单」标题行与 ✕ 会落进状态栏带里 —— 即「顶部被遮住」。
              // 底部弹出的「全部模块」是 max-h-[85vh] 底部面板、顶端不贴屏，故不需要。
              drawerOpen &&
                'safe-top bottom-auto right-auto top-0 h-full max-h-none w-[280px] rounded-none rounded-r-3xl border-r border-t-0',
            )}
          >
            <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
              <div className="text-sm font-black">{drawerOpen ? 'CetThink 菜单' : '全部模块'}</div>
              <button
                type="button"
                onClick={() => {
                  setDrawerOpen(false);
                  setMoreOpen(false);
                }}
                className="grid size-8 place-items-center rounded-2xl bg-muted"
                aria-label="关闭"
              >
                <X className="size-4" />
              </button>
            </div>
            {drawerOpen ? (
              <SideNav
                onNavigate={() => {
                  setDrawerOpen(false);
                  setMoreOpen(false);
                }}
              />
            ) : (
              <div className="grid max-h-[70vh] grid-cols-4 gap-2 overflow-y-auto p-4">
                {MORE.map(({ to, label, icon: Icon }) => {
                  const active = pathname.startsWith(to);
                  return (
                    <NavLink
                      key={to}
                      to={to}
                      className={cn(
                        'flex flex-col items-center gap-1.5 rounded-2xl border p-3 text-center',
                        active
                          ? 'border-primary/40 bg-primary-soft text-ink-teal'
                          : 'border-border/60 bg-background',
                      )}
                    >
                      <Icon className="size-5" />
                      <span className="text-[10px] font-bold leading-tight">{label}</span>
                    </NavLink>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
