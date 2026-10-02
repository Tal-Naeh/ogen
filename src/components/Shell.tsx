import clsx from "clsx";
import { ArrowLeftRight, Bell, CalendarClock, LayoutDashboard, Monitor, Moon, Sparkles, Sun, Target, Wallet } from "lucide-react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useEffect, useId } from "react";
import { useStore, useTheme, type ThemePref } from "../lib/store";
import { relativeTime } from "../lib/format";

const nav = [
  { to: "/app", label: "סקירה", Icon: LayoutDashboard, end: true },
  { to: "/app/transactions", label: "תנועות", Icon: ArrowLeftRight },
  { to: "/app/budgets", label: "תקציב", Icon: Target },
  { to: "/app/recurring", label: "קבועים", Icon: CalendarClock },
  { to: "/app/accounts", label: "חשבונות", Icon: Wallet },
  { to: "/app/assistant", label: "העוזר", Icon: Sparkles },
];

export function Logo({ className }: { className?: string }) {
  const gid = useId();
  return (
    <span className={clsx("inline-flex items-center gap-2.5", className)}>
      <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#0a84ff" />
            <stop offset="1" stopColor="#5e5ce6" />
          </linearGradient>
        </defs>
        <rect width="32" height="32" rx="9" fill={`url(#${gid})`} />
        <circle cx="16" cy="8.6" r="2.5" fill="none" stroke="#fff" strokeWidth="2.3" />
        <path d="M16 11.1V24.6M11.6 14.6h8.8M8.6 18.6c.6 3.9 3.6 6 7.4 6s6.8-2.1 7.4-6M8.6 18.6l-1.4 1.6M23.4 18.6l1.4 1.6" fill="none" stroke="#fff" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="text-[20px] font-bold tracking-tight text-ink">עוגן</span>
    </span>
  );
}

function ThemeToggle() {
  const [pref, setPref] = useTheme();
  const opts: { v: ThemePref; Icon: typeof Sun; label: string }[] = [
    { v: "light", Icon: Sun, label: "בהיר" },
    { v: "system", Icon: Monitor, label: "לפי המערכת" },
    { v: "dark", Icon: Moon, label: "כהה" },
  ];
  return (
    <div role="radiogroup" aria-label="ערכת צבעים" className="inline-flex rounded-full border border-line bg-surface-2 p-0.5">
      {opts.map(({ v, Icon, label }) => (
        <button
          key={v}
          role="radio"
          aria-checked={pref === v}
          aria-label={label}
          title={label}
          onClick={() => setPref(v)}
          className={clsx("grid h-7 w-7 place-items-center rounded-full transition", pref === v ? "bg-surface text-ink shadow-card" : "text-muted hover:text-ink")}
        >
          <Icon size={14} />
        </button>
      ))}
    </div>
  );
}

export function Shell() {
  const { state } = useStore();
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);
  const lastSync = state.accounts.reduce((a, b) => (a.lastSync > b.lastSync ? a : b)).lastSync;

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[248px_1fr]">
      {/* Sidebar (sits on the right in RTL) */}
      <aside className="sticky top-0 hidden h-dvh flex-col border-e border-line bg-surface/70 px-4 py-6 backdrop-blur-xl lg:flex">
        <Logo className="px-2" />
        <nav className="mt-8 flex flex-col gap-1" aria-label="ניווט ראשי">
          {nav.map(({ to, label, Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                clsx(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14.5px] font-medium transition",
                  isActive ? "bg-brand text-white shadow-card" : "text-ink-2 hover:bg-surface-2 hover:text-ink",
                )
              }
            >
              <Icon size={18} strokeWidth={2} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto rounded-2xl border border-line bg-surface p-4">
          <p className="text-[13px] font-semibold text-ink">עוגן פרימיום</p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-ink-2">כל הפיצ׳רים ב־₪9.90 לחודש. בלי הפתעות.</p>
          <p className="mt-3 text-[11.5px] text-muted">סונכרן {relativeTime(lastSync)}</p>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="frost sticky top-0 z-30 border-b border-line">
          <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
            <Logo className="lg:hidden" />
            <p className="hidden text-[14px] text-ink-2 lg:block">
              שלום, <span className="font-semibold text-ink">{state.settings.householdName}</span>
            </p>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <button className="relative grid h-9 w-9 place-items-center rounded-full text-ink-2 hover:bg-surface-2 hover:text-ink" aria-label="התראות">
                <Bell size={18} />
                <span className="absolute end-2 top-2 h-2 w-2 rounded-full bg-brand ring-2 ring-page" />
              </button>
              <span className="grid h-9 w-9 place-items-center rounded-full bg-surface-3 text-[13px] font-bold text-ink-2" aria-hidden>
                ד״ל
              </span>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1240px] px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-12 lg:pt-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden" aria-label="ניווט ראשי">
        <div className="mx-auto grid max-w-md grid-cols-6">
          {nav.map(({ to, label, Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                clsx("flex flex-col items-center gap-1 py-2.5 text-[10.5px] font-medium", isActive ? "text-brand" : "text-muted")
              }
            >
              <Icon size={20} strokeWidth={2} />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
