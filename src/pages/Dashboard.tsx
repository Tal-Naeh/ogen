import clsx from "clsx";
import { ArrowLeft, ChevronLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { CashflowBars } from "../components/charts/CashflowBars";
import { ForecastChart } from "../components/charts/ForecastChart";
import { CategoryChip, Icon } from "../components/Icon";
import { TransactionRow } from "../components/TransactionRow";
import { Card, CardHeader, Meter, Money, severityOf, StatusPill } from "../components/ui";
import type { Insight } from "../lib/finance";
import { fmtDate, fmtDateShort, fmtWeekday, ils } from "../lib/format";
import { useStore } from "../lib/store";

export function Dashboard() {
  const { current: c, previous, history, insights } = useStore();

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
      <Hero />

      <Card className="rise lg:col-span-5" as="div">
        <CardHeader title="מה כדאי לדעת היום" subtitle={`${insights.length} תובנות חדשות`} />
        <ul className="mt-3 space-y-1 px-3 pb-3">
          {insights.slice(0, 4).map((i) => (
            <InsightRow key={i.id} insight={i} />
          ))}
        </ul>
      </Card>

      <Card className="rise lg:col-span-8">
        <CardHeader
          title="איך המחזור מתקדם"
          subtitle="הוצאות משתנות מצטברות, מול התקציב והמחזור הקודם"
          action={
            <StatusPill severity={c.projectedVariable > c.variableBudget ? "warning" : "ok"}>
              {c.projectedVariable > c.variableBudget ? "צפויה חריגה" : "בתוך התקציב"}
            </StatusPill>
          }
        />
        <div className="px-4 pb-5 pt-4 sm:px-6">
          <ForecastChart
            cycle={c.cycle}
            current={c.cumulative}
            previous={previous.cumulative}
            projectedEnd={c.projectedVariable}
            budget={c.variableBudget}
          />
        </div>
      </Card>

      <Card className="rise lg:col-span-4">
        <CardHeader
          title="צפוי עד סוף המחזור"
          subtitle={`${c.upcoming.length} חיובים והכנסות`}
          action={
            <Link to="/recurring" className="inline-flex items-center gap-0.5 text-[13px] font-medium text-brand hover:underline">
              הכל <ChevronLeft size={15} />
            </Link>
          }
        />
        <ul className="mt-2 px-3 pb-4">
          {c.upcoming.slice(0, 6).map((u) => (
            <UpcomingRow key={u.recurring.id + u.date.toISOString()} name={u.recurring.merchant} categoryId={u.recurring.categoryId} date={u.date} amount={u.recurring.amount} />
          ))}
          {c.upcoming.length === 0 && <p className="px-3 py-6 text-center text-[13px] text-muted">אין עוד חיובים צפויים במחזור הזה</p>}
        </ul>
      </Card>

      <Card className="rise lg:col-span-7">
        <CardHeader
          title="תקציב לפי קטגוריה"
          subtitle="הקו האנכי מסמן איפה ״אמורים״ להיות היום"
          action={
            <Link to="/budgets" className="inline-flex items-center gap-0.5 text-[13px] font-medium text-brand hover:underline">
              עריכה <ChevronLeft size={15} />
            </Link>
          }
        />
        <ul className="grid gap-x-6 px-5 pb-5 pt-3 sm:grid-cols-2 sm:px-6">
          {c.categories.filter((x) => x.limit > 0).slice(0, 8).map((x) => {
            const sev = severityOf(x.spent, x.limit, x.pace);
            return (
              <li key={x.category.id} className="py-3">
                <div className="mb-2 flex items-center gap-3">
                  <CategoryChip category={x.category} size={34} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-[14px] font-medium text-ink">{x.category.name}</span>
                      <span className="text-[13px] text-ink-2">
                        <Money value={-x.spent} tone="plain" className="font-semibold text-ink" />
                        <span className="text-muted"> / </span>
                        <span className="money tnum text-muted">{ils(x.limit)}</span>
                      </span>
                    </div>
                    <p className={clsx("text-[12px]", sev === "ok" ? "text-muted" : sev === "warning" ? "text-warning-text" : "text-critical-text")}>
                      {sev === "critical"
                        ? `חריגה של ${ils(x.spent - x.limit)}`
                        : sev === "warning"
                          ? `מעל הקצב ב־${ils(x.spent - x.pace)}`
                          : `נשארו ${ils(x.limit - x.spent)}`}
                    </p>
                  </div>
                </div>
                <Meter value={x.spent} max={x.limit} pace={x.pace} severity={sev} label={`${x.category.name}: ${ils(x.spent)} מתוך ${ils(x.limit)}`} />
              </li>
            );
          })}
        </ul>
      </Card>

      <Card className="rise lg:col-span-5">
        <CardHeader title="הכנסות מול הוצאות" subtitle="שישה מחזורים אחרונים · המחזור הנוכחי עד היום" />
        <div className="px-4 pb-5 pt-4 sm:px-6">
          <CashflowBars data={history} />
        </div>
      </Card>

      <RecentTransactions />
    </div>
  );
}

function Hero() {
  const { current: c } = useStore();
  const progress = (c.dayIndex + 1) / c.cycle.days;
  const income = c.incomeReceived + c.incomeUpcoming;
  const fixed = c.fixedPaid + c.fixedUpcoming;
  const left = Math.max(0, c.leftToSpend);
  const segs = [
    { label: "קבועות", value: fixed, o: 0.3 },
    { label: "חיסכון", value: c.savings, o: 0.5 },
    { label: "משתנות עד כה", value: c.variableSpent, o: 0.72 },
    { label: "נשאר להוציא", value: left, o: 1, accent: true },
  ];
  const positive = c.leftToSpend >= 0;

  return (
    <section className="hero-card rise relative overflow-hidden rounded-3xl p-6 text-white shadow-card sm:p-8 lg:col-span-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[14px] text-white/75">
          מחזור {fmtDateShort(c.cycle.start)} – {fmtDateShort(c.cycle.end)}
        </p>
        <span className="rounded-full bg-white/10 px-3 py-1 text-[12.5px] text-white/85 backdrop-blur">
          יום {c.dayIndex + 1} מתוך {c.cycle.days}
        </span>
      </div>

      <p className="mt-6 text-[15px] font-medium text-white/80">{positive ? "נשאר לכם להוציא החודש" : "המחזור צפוי להסתיים במינוס"}</p>
      <p className="mt-1 text-[52px] font-bold leading-none tracking-tight sm:text-[64px]">
        <span className="money">{ils(c.leftToSpend)}</span>
      </p>
      <p className="mt-3 text-[15px] text-white/80">
        כלומר כ־<span className="money font-semibold text-white">{ils(Math.max(0, c.dailyAllowance))}</span> ליום, ל־{c.daysLeft} הימים שנותרו
      </p>

      {/* Where this cycle's income goes */}
      <div className="mt-8">
        <div className="flex h-3 w-full gap-[2px] overflow-hidden rounded-full" role="img" aria-label="חלוקת ההכנסה במחזור">
          {segs.map((s) => (
            <div key={s.label} className="h-full first:rounded-s-full last:rounded-e-full" style={{ flexGrow: Math.max(s.value, 0.0001), background: s.accent ? "#5ee0b8" : `rgba(255,255,255,${s.o})` }} />
          ))}
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-5">
          <div>
            <dt className="text-[12px] text-white/65">הכנסות צפויות</dt>
            <dd className="money tnum text-[15px] font-semibold">{ils(income)}</dd>
          </div>
          {segs.map((s) => (
            <div key={s.label}>
              <dt className="flex items-center gap-1.5 text-[12px] text-white/65">
                <span className="h-2 w-2 rounded-full" style={{ background: s.accent ? "#5ee0b8" : `rgba(255,255,255,${s.o})` }} />
                {s.label}
              </dt>
              <dd className="money tnum text-[15px] font-semibold">{ils(s.value)}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="mt-6 h-1 w-full overflow-hidden rounded-full bg-white/10" aria-hidden>
        <div className="h-full rounded-full bg-white/50" style={{ width: `${progress * 100}%` }} />
      </div>
      <p className="mt-2 text-[12px] text-white/60">
        המחזור הבא מתחיל ב{fmtWeekday(new Date(c.cycle.end.getTime() + 86_400_000))}, {fmtDate(new Date(c.cycle.end.getTime() + 86_400_000))} · כשהמשכורת נכנסת
      </p>
    </section>
  );
}

const toneStyle = {
  critical: "bg-critical-soft text-critical-text",
  warning: "bg-warning-soft text-warning-text",
  good: "bg-good-soft text-good-text",
  info: "bg-surface-2 text-ink-2",
} as const;

function InsightRow({ insight }: { insight: Insight }) {
  return (
    <li>
      <Link to={insight.action?.to ?? "/"} className="group flex gap-3.5 rounded-2xl p-3 transition hover:bg-surface-2">
        <span className={clsx("grid h-10 w-10 shrink-0 place-items-center rounded-xl", toneStyle[insight.tone])}>
          <Icon name={insight.icon} size={19} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] font-semibold text-ink">{insight.title}</span>
          <span className="mt-0.5 line-clamp-2 block text-[13px] leading-relaxed text-ink-2">{insight.body}</span>
        </span>
        <ArrowLeft size={16} className="mt-1 shrink-0 text-muted opacity-0 transition group-hover:opacity-100" />
      </Link>
    </li>
  );
}

function UpcomingRow({ name, categoryId, date, amount }: { name: string; categoryId: string; date: Date; amount: number }) {
  const { category } = useStore();
  return (
    <li className="flex items-center gap-3 rounded-2xl px-3 py-2.5">
      <span className="grid w-10 shrink-0 place-items-center rounded-xl bg-surface-2 py-1.5 leading-none">
        <span className="text-[16px] font-bold text-ink">{date.getDate()}</span>
        <span className="mt-0.5 text-[10.5px] text-muted">{fmtDateShort(date).split(" ").slice(1).join(" ").replace(/^ב/, "")}</span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14px] font-medium text-ink">{name}</span>
        <span className="text-[12px] text-muted">{category(categoryId).name}</span>
      </span>
      <Money value={amount} cents className="text-[14px] font-semibold" />
    </li>
  );
}

function RecentTransactions() {
  const { state } = useStore();
  const recent = state.transactions.slice(0, 7);
  return (
    <Card className="rise lg:col-span-12">
      <CardHeader
        title="תנועות אחרונות"
        subtitle="מכל החשבונות והכרטיסים, מקוטלגות אוטומטית"
        action={
          <Link to="/transactions" className="inline-flex items-center gap-0.5 text-[13px] font-medium text-brand hover:underline">
            לכל התנועות <ChevronLeft size={15} />
          </Link>
        }
      />
      <div className="grid gap-x-4 px-3 pb-4 pt-2 md:grid-cols-2">
        {recent.map((t) => (
          <TransactionRow key={t.id} tx={t} compact />
        ))}
      </div>
    </Card>
  );
}
