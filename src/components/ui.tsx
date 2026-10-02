import clsx from "clsx";
import { CircleCheck, Info, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import type { Account } from "../data/types";
import { ils } from "../lib/format";

export function Card({ className, children, as: As = "section" }: { className?: string; children: ReactNode; as?: "section" | "div" | "article" }) {
  return (
    <As className={clsx("rounded-3xl border border-line bg-surface shadow-card", className)}>{children}</As>
  );
}

export function CardHeader({ title, subtitle, action }: { title: ReactNode; subtitle?: ReactNode; action?: ReactNode }) {
  return (
    <header className="flex items-start justify-between gap-4 px-5 pt-5 sm:px-6 sm:pt-6">
      <div className="min-w-0">
        <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
        {subtitle && <p className="mt-0.5 text-[13px] text-muted">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-[26px] font-bold tracking-tight text-ink sm:text-[30px]">{title}</h1>
        {subtitle && <p className="mt-1 text-[14px] text-ink-2">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/** Money text. Never colored by series; direction gets success ink only for income. */
export function Money({ value, cents, sign, className, tone = "auto" }: { value: number; cents?: boolean; sign?: boolean; className?: string; tone?: "auto" | "plain" }) {
  return (
    <span className={clsx("money tnum", tone === "auto" && value > 0 && "text-good-text", className)}>
      {ils(value, { cents, sign })}
    </span>
  );
}

export type Severity = "ok" | "warning" | "critical";

/** Over the limit is always flagged; "ahead of pace" only after the first week, when pace means something. */
export function severityOf(spent: number, limit: number, pace: number, dayIndex = 99): Severity {
  if (limit > 0 && spent > limit) return "critical";
  if (limit > 0 && (spent > limit * 0.9 || (dayIndex >= 6 && spent > pace * 1.15))) return "warning";
  return "ok";
}

/** Budget meter: fill carries severity, track is a lighter step of the same ramp, a tick marks today's pace. */
export function Meter({ value, max, pace, severity, label }: { value: number; max: number; pace?: number; severity: Severity; label: string }) {
  const pct = max > 0 ? Math.min(value / max, 1) : 0;
  const pacePct = max > 0 && pace !== undefined ? Math.min(pace / max, 1) : undefined;
  const fill = severity === "critical" ? "var(--critical)" : severity === "warning" ? "var(--warning)" : "var(--series-1)";
  const track = severity === "critical" ? "var(--critical-soft)" : severity === "warning" ? "var(--warning-soft)" : "var(--series-1-soft)";
  return (
    <div
      className="relative h-2 w-full overflow-visible rounded-full"
      style={{ background: track }}
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.round(value)}
    >
      <div className="absolute inset-y-0 start-0 rounded-full transition-[width] duration-700 ease-out" style={{ width: `${pct * 100}%`, background: fill }} />
      {pacePct !== undefined && pacePct > 0 && pacePct < 1 && (
        <div className="absolute -top-1 -bottom-1 w-[2px] rounded-full bg-ink/70" style={{ insetInlineStart: `calc(${pacePct * 100}% - 1px)` }} title="הקצב הצפוי להיום" />
      )}
    </div>
  );
}

export function StatusPill({ severity, children }: { severity: Severity | "info"; children: ReactNode }) {
  const map = {
    ok: { cls: "bg-good-soft text-good-text", Icon: CircleCheck },
    warning: { cls: "bg-warning-soft text-warning-text", Icon: TriangleAlert },
    critical: { cls: "bg-critical-soft text-critical-text", Icon: TriangleAlert },
    info: { cls: "bg-surface-2 text-ink-2", Icon: Info },
  }[severity];
  return (
    <span className={clsx("inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[12px] font-medium", map.cls)}>
      <map.Icon size={13} strokeWidth={2.2} aria-hidden />
      {children}
    </span>
  );
}

export function AccountBadge({ account, size = 28 }: { account: Account; size?: number }) {
  const initials = account.provider === "Max" ? "max" : account.provider.replace("בנק ", "").slice(0, 2);
  return (
    <span
      className="inline-grid shrink-0 place-items-center rounded-lg text-[11px] font-bold text-white"
      style={{ width: size, height: size, background: account.color }}
      aria-hidden
    >
      {initials}
    </span>
  );
}

export function Segmented<T extends string>({ value, onChange, options, label }: { value: T; onChange: (v: T) => void; options: { value: T; label: ReactNode }[]; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-full border border-line bg-surface-2 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={clsx(
            "rounded-full px-3 py-1.5 text-[13px] font-medium transition",
            value === o.value ? "bg-surface text-ink shadow-card" : "text-ink-2 hover:text-ink",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Button({ children, onClick, variant = "primary", className, type = "button", disabled }: { children: ReactNode; onClick?: () => void; variant?: "primary" | "ghost" | "soft"; className?: string; type?: "button" | "submit"; disabled?: boolean }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-[14px] font-semibold transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40",
        variant === "primary" && "bg-brand text-brand-ink hover:brightness-110",
        variant === "soft" && "bg-brand-soft text-brand hover:brightness-95",
        variant === "ghost" && "text-ink-2 hover:bg-surface-2 hover:text-ink",
        className,
      )}
    >
      {children}
    </button>
  );
}

/** Fixed overlays render at <body> so ancestor transforms (entrance animations) can't trap them. */
export function Portal({ children }: { children: ReactNode }) {
  return createPortal(children, document.body);
}
