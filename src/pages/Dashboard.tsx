import clsx from "clsx";
import { ArrowLeft, ChevronLeft, CircleCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { BalancePath } from "../components/charts/BalancePath";
import { CashflowBars } from "../components/charts/CashflowBars";
import { CategoryChip, Icon } from "../components/Icon";
import { TransactionRow } from "../components/TransactionRow";
import { TxDrawer } from "./Transactions";
import { useState } from "react";
import { Card, CardHeader, Meter, Money, severityOf, StatusPill } from "../components/ui";
import type { Insight } from "../lib/finance";
import { daysHe, fmtDateShort, fmtMonth, ils } from "../lib/format";
import { useStore } from "../lib/store";

export function Dashboard() {
  const { current: c, history, insights, outlook } = useStore();
  const hour = new Date().getHours();
  const greet = hour < 12 ? "בוקר טוב" : hour < 17 ? "צהריים טובים" : hour < 21 ? "ערב טוב" : "לילה טוב";
  // Consecutive positive months, newest first: the habit we want people to see and keep.
  const full = history.slice(0, -1);
  let streak = 0;
  for (let i = full.length - 1; i >= 0 && full[i].net > 0; i--) streak++;
  const inRed = outlook.current < 0;

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
      <div className="rise lg:col-span-12">
        <h1 className="text-[32px] font-semibold tracking-[-0.025em] text-ink sm:text-[40px]">{greet} 👋</h1>
        <p className="mt-1 text-[16px] text-ink-2">
          {streak >= 2 ? `התזרים שלכם חיובי ${streak} חודשים ברצף. ככה בונים שקט כלכלי.` : streak === 1 ? "החודש שעבר נסגר בתזרים חיובי. ממשיכים ככה." : "כל חודש בתזרים חיובי מקרב אתכם ליציבות."}
        </p>
      </div>
      <Hero />

      <Card className="rise lg:col-span-5" as="div">
        <CardHeader title="כדאי לדעת" subtitle="מה חדש בחשבון שלכם" />
        <ul className="mt-3 space-y-1 px-3 pb-3">
          {insights.slice(0, 4).map((i) => (
            <InsightRow key={i.id} insight={i} />
          ))}
        </ul>
      </Card>

      <Card className="rise lg:col-span-8">
        <CardHeader
          title={inRed ? "המסלול שלכם החוצה מהמינוס" : "לאן היתרה הולכת"}
          subtitle={inRed ? "כשהתזרים חיובי, המינוס נסגר מעצמו. כל נקודה היא היתרה בסוף חודש." : "כל חודש בתזרים חיובי מוסיף ליתרה. כל נקודה היא היתרה בסוף חודש."}
          action={
            inRed && outlook.clearsAt ? (
              <StatusPill severity="ok">בעוד {outlook.monthsToClear === 1 ? "חודש" : `${outlook.monthsToClear} חודשים`}</StatusPill>
            ) : undefined
          }
        />
        <div className="px-4 pb-5 pt-4 sm:px-6">
          <BalancePath outlook={outlook} />
        </div>
      </Card>

      <Card className="rise lg:col-span-4">
        <CardHeader
          title="צפוי עד סוף החודש"
          subtitle={`${c.upcoming.length} חיובים והכנסות`}
          action={
            <Link to="/app/recurring" className="inline-flex items-center gap-0.5 text-[13px] font-medium text-brand hover:underline">
              הכל <ChevronLeft size={15} />
            </Link>
          }
        />
        <ul className="mt-2 px-3 pb-4">
          {c.upcoming.slice(0, 6).map((u) => (
            <UpcomingRow key={u.recurring.id + u.date.toISOString()} name={u.recurring.merchant} categoryId={u.recurring.categoryId} date={u.date} amount={u.recurring.amount} />
          ))}
          {c.upcoming.length === 0 && <p className="px-3 py-6 text-center text-[13px] text-muted">אין עוד חיובים צפויים החודש</p>}
        </ul>
      </Card>

      <Card className="rise lg:col-span-7">
        <CardHeader
          title="תקציב לפי קטגוריה"
          subtitle="הקו האנכי מסמן את הקצב הצפוי להיום"
          action={
            <Link to="/app/budgets" className="inline-flex items-center gap-0.5 text-[13px] font-medium text-brand hover:underline">
              עריכה <ChevronLeft size={15} />
            </Link>
          }
        />
        <ul className="grid gap-x-6 px-5 pb-5 pt-3 sm:grid-cols-2 sm:px-6">
          {c.categories.filter((x) => x.limit > 0).slice(0, 8).map((x) => {
            const sev = severityOf(x.spent, x.limit, x.pace, c.dayIndex);
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
        <CardHeader title="תזרים חודשי" subtitle="כמה נכנס וכמה יצא, שישה חודשים אחרונים" />
        <div className="px-4 pb-5 pt-4 sm:px-6">
          <CashflowBars data={history} />
        </div>
      </Card>

      <RecentTransactions />
    </div>
  );
}

const monthYearFmt = new Intl.DateTimeFormat("he-IL", { month: "long", year: "numeric" });

/** The cash-flow hero: what came in vs what went out this month, and where that leaves the balance. */
export function Hero() {
  const { current: c, outlook } = useStore();
  const net = c.projectedNet;
  const max = Math.max(c.projectedIn, c.projectedOut, 1);
  const rows = [
    { label: "נכנס", total: c.projectedIn, done: c.flowIn, color: "#30d158", doneLabel: "כבר נכנסו" },
    { label: "יצא", total: c.projectedOut, done: c.flowOut, color: "#ff9f0a", doneLabel: "כבר יצאו" },
  ];

  return (
    <section className="glow-card rise relative overflow-hidden rounded-[28px] border border-line p-6 shadow-card sm:p-8 lg:col-span-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[14px] font-medium text-muted">התזרים של {fmtMonth(c.cycle.start)}</p>
        <span className="rounded-full bg-surface-2 px-3 py-1 text-[12.5px] font-medium text-ink-2">עוד {daysHe(c.daysLeft)} לסוף החודש</span>
      </div>

      <p className="mt-6 text-[15px] font-medium text-ink-2">{net >= 0 ? "החודש צפוי להיסגר בפלוס" : "החודש צפוי להיסגר במינוס"}</p>
      <p className="mt-1 text-[56px] font-semibold leading-none tracking-[-0.03em] text-ink sm:text-[68px]">
        <span className="money">{ils(net, { sign: true })}</span>
      </p>
      <p className="mt-3 text-[15px] text-ink-2">תזרים צפוי לחודש כולו, כולל חיובים והכנסות שעוד לא נכנסו</p>

      {/* In vs out: solid = already happened, light = still expected this month */}
      <div className="mt-7 space-y-4">
        {rows.map((r) => (
          <div key={r.label}>
            <div className="mb-1.5 flex items-baseline justify-between gap-3">
              <span className="flex items-center gap-2 text-[14px] font-medium text-ink">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: r.color }} />
                {r.label}
              </span>
              <span className="text-[13px] text-muted">
                <span className="money tnum text-[15px] font-semibold text-ink">{ils(r.total)}</span>
                <span> · </span>
                <span className="money tnum">{ils(r.done)}</span> {r.doneLabel}
              </span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-surface-3" role="img" aria-label={`${r.label}: ${ils(r.total)} החודש, מתוכם ${ils(r.done)} ${r.doneLabel}`}>
              <div className="flex h-full gap-[2px]" style={{ width: `${(r.total / max) * 100}%` }}>
                <div className="h-full rounded-s-full" style={{ flexGrow: Math.max(r.done, 0.0001), background: r.color }} />
                <div className="h-full rounded-e-full" style={{ flexGrow: Math.max(r.total - r.done, 0.0001), background: r.color, opacity: 0.35 }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
        <p className="text-[14px] text-ink-2">
          היתרה בחשבון כרגע <span className="money tnum font-semibold text-ink">{ils(outlook.current)}</span>
        </p>
        {outlook.current < 0 && outlook.clearsAt ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-good-soft px-3 py-1.5 text-[13px] font-medium text-good-text">
            <CircleCheck size={15} strokeWidth={2.4} />
            {outlook.monthsToClear === 0 ? "יוצאים מהמינוס כבר החודש" : `בקצב הזה יוצאים מהמינוס ב${monthYearFmt.format(outlook.clearsAt)}`}
          </span>
        ) : outlook.current >= 0 ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-good-soft px-3 py-1.5 text-[13px] font-medium text-good-text">
            <CircleCheck size={15} strokeWidth={2.4} /> החשבון בפלוס
          </span>
        ) : null}
      </div>
    </section>
  );
}

const toneStyle = {
  critical: "bg-brand-soft text-brand",
  warning: "bg-warning-soft text-warning-text",
  good: "bg-good-soft text-good-text",
  info: "bg-surface-2 text-ink-2",
} as const;

function InsightRow({ insight }: { insight: Insight }) {
  return (
    <li>
      <Link to={insight.action?.to ?? "/app"} className="group flex gap-3.5 rounded-2xl p-3 transition hover:bg-surface-2">
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
  const [openId, setOpenId] = useState<string | null>(null);
  const recent = state.transactions.slice(0, 7);
  const open = openId ? state.transactions.find((t) => t.id === openId) : undefined;
  return (
    <Card className="rise lg:col-span-12">
      <CardHeader
        title="תנועות אחרונות"
        subtitle="מכל החשבונות והכרטיסים, מקוטלגות אוטומטית"
        action={
          <Link to="/app/transactions" className="inline-flex items-center gap-0.5 text-[13px] font-medium text-brand hover:underline">
            לכל התנועות <ChevronLeft size={15} />
          </Link>
        }
      />
      <div className="grid gap-x-4 px-3 pb-4 pt-2 md:grid-cols-2">
        {recent.map((t) => (
          <TransactionRow key={t.id} tx={t} compact onClick={() => setOpenId(t.id)} />
        ))}
      </div>
      {open && <TxDrawer tx={open} onClose={() => setOpenId(null)} />}
    </Card>
  );
}
