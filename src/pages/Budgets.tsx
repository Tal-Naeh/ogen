import clsx from "clsx";
import { Minus, PiggyBank, Plus, Wand2 } from "lucide-react";
import { useMemo } from "react";
import { CategoryChip } from "../components/Icon";
import { Button, Card, CardHeader, Meter, PageHeader, severityOf } from "../components/ui";
import { summarize } from "../lib/finance";
import { ils } from "../lib/format";
import { useStore } from "../lib/store";

export function Budgets() {
  const { state, today, current: c, setBudget } = useStore();

  // Average of the last three full cycles, for "suggested" budgets.
  const avg = useMemo(() => {
    const m = new Map<string, number>();
    for (let off = -3; off <= -1; off++) {
      for (const x of summarize(state, today, off).categories) m.set(x.category.id, (m.get(x.category.id) ?? 0) + x.spent / 3);
    }
    return m;
  }, [state, today]);

  const total = c.categories.reduce((a, x) => a + x.limit, 0);
  const spent = c.variableSpent;
  const income = c.incomeReceived + c.incomeUpcoming;
  const fixed = c.fixedPaid + c.fixedUpcoming;
  const room = income - fixed - c.savings - total;

  function applySuggestions() {
    for (const x of c.categories) {
      const a = avg.get(x.category.id) ?? 0;
      if (a > 0) setBudget(x.category.id, Math.ceil((a * 1.05) / 50) * 50);
    }
  }

  return (
    <div className="rise">
      <PageHeader
        title="תקציב"
        subtitle="קובעים פעם אחת, ושפע מתריע לפני שחורגים, לא אחרי"
        action={
          <Button variant="soft" onClick={applySuggestions}>
            <Wand2 size={16} /> הצעת תקציב לפי 3 חודשים
          </Button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-12">
        <div className="grid gap-5 sm:grid-cols-3 lg:col-span-12">
          <Stat label="תקציב משתנות למחזור" value={ils(total)} sub={`נוצלו ${ils(spent)} (${Math.round((spent / total) * 100)}%)`} />
          <Stat label="קבועות + חיסכון" value={ils(fixed + c.savings)} sub="משכנתא, גן, ביטוחים, מנויים והפקדה" />
          <Stat
            label="מרווח לא מתוכנן"
            value={ils(room)}
            sub={room >= 0 ? "כסף פנוי אחרי כל התקציבים. אפשר לחסוך אותו" : "התקציבים גבוהים מההכנסה הצפויה"}
            tone={room >= 0 ? "good" : "critical"}
          />
        </div>

        <Card className="lg:col-span-8">
          <CardHeader title="הוצאות משתנות" subtitle="לחצו על + / − כדי לעדכן, השינוי נשמר מיד" />
          <ul className="divide-y divide-line px-5 pb-2 pt-2 sm:px-6">
            {c.categories.map((x) => {
              const sev = severityOf(x.spent, x.limit, x.pace);
              const a = avg.get(x.category.id) ?? 0;
              return (
                <li key={x.category.id} className="py-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <CategoryChip category={x.category} size={40} />
                    <div className="min-w-[140px] flex-1">
                      <p className="text-[14.5px] font-semibold text-ink">{x.category.name}</p>
                      <p className="text-[12.5px] text-muted">
                        {x.count} תנועות · ממוצע 3 חודשים <span className="money">{ils(a)}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-1 rounded-full border border-line bg-surface-2 p-1">
                      <StepBtn label="הורדה" onClick={() => setBudget(x.category.id, Math.max(0, x.limit - 50))}>
                        <Minus size={14} />
                      </StepBtn>
                      <span className="money tnum w-[78px] text-center text-[14px] font-semibold text-ink">{ils(x.limit)}</span>
                      <StepBtn label="הוספה" onClick={() => setBudget(x.category.id, x.limit + 50)}>
                        <Plus size={14} />
                      </StepBtn>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex-1">
                      <Meter value={x.spent} max={x.limit} pace={x.pace} severity={sev} label={x.category.name} />
                    </div>
                    <span className={clsx("money tnum w-[110px] text-end text-[12.5px]", sev === "ok" ? "text-ink-2" : sev === "warning" ? "text-warning-text" : "text-critical-text")}>
                      {ils(x.spent)} נוצלו
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>

        <div className="space-y-5 lg:col-span-4">
          <Card className="p-6">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-good-soft text-good-text">
              <PiggyBank size={22} />
            </span>
            <h3 className="mt-4 text-[16px] font-semibold text-ink">חיסכון אוטומטי</h3>
            <p className="mt-1 text-[13.5px] leading-relaxed text-ink-2">
              כל חודש עוברים <span className="money font-semibold text-ink">{ils(state.settings.monthlySavingsGoal)}</span> לקופת גמל להשקעה, לפני שמתחילים להוציא.
            </p>
            <div className="mt-5 rounded-2xl bg-surface-2 p-4">
              <p className="text-[12.5px] text-muted">בקצב הזה, בעוד 5 שנים (תשואה שנתית משוערת 5%)</p>
              <p className="money mt-1 text-[24px] font-bold text-ink">{ils(fv(state.settings.monthlySavingsGoal, 0.05, 60))}</p>
            </div>
            <p className="mt-3 text-[11.5px] text-muted">הערכה בלבד, לא ייעוץ השקעות.</p>
          </Card>
          <Card className="p-6">
            <h3 className="text-[15px] font-semibold text-ink">איך מחושב ״נשאר להוציא״?</h3>
            <dl className="mt-4 space-y-2 text-[13.5px]">
              <Line label="הכנסות צפויות במחזור" v={income} />
              <Line label="פחות הוצאות קבועות" v={-fixed} />
              <Line label="פחות חיסכון" v={-c.savings} />
              <Line label="פחות משתנות עד היום" v={-c.variableSpent} />
              <div className="border-t border-line pt-2">
                <Line label="נשאר להוציא" v={c.leftToSpend} bold />
              </div>
            </dl>
          </Card>
        </div>
      </div>
    </div>
  );
}

function fv(pmt: number, annual: number, months: number) {
  const r = annual / 12;
  return pmt * ((Math.pow(1 + r, months) - 1) / r);
}

function Line({ label, v, bold }: { label: string; v: number; bold?: boolean }) {
  return (
    <div className="flex justify-between">
      <dt className={bold ? "font-semibold text-ink" : "text-ink-2"}>{label}</dt>
      <dd className={clsx("money tnum", bold ? "font-bold text-ink" : "text-ink")}>{ils(v)}</dd>
    </div>
  );
}

function StepBtn({ children, onClick, label }: { children: React.ReactNode; onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} aria-label={label} className="grid h-8 w-8 place-items-center rounded-full text-ink-2 transition hover:bg-surface hover:text-ink active:scale-95">
      {children}
    </button>
  );
}

function Stat({ label, value, sub, tone }: { label: string; value: string; sub: string; tone?: "good" | "critical" }) {
  return (
    <Card className="p-5" as="div">
      <p className="text-[13px] text-muted">{label}</p>
      <p className={clsx("money mt-1 text-[28px] font-bold tracking-tight", tone === "critical" ? "text-critical-text" : "text-ink")}>{value}</p>
      <p className="mt-1 text-[12.5px] text-ink-2">{sub}</p>
    </Card>
  );
}
