import clsx from "clsx";
import { BellRing, TrendingUp } from "lucide-react";
import { useState } from "react";
import { CategoryChip } from "../components/Icon";
import { AccountBadge, Card, CardHeader, Money, PageHeader, Segmented } from "../components/ui";
import type { Recurring as R } from "../data/types";
import { diffDays } from "../lib/date";
import { nextDate } from "../lib/finance";
import { fmtDate, ils } from "../lib/format";
import { useStore } from "../lib/store";

type Group = "all" | "subscriptions" | "bills" | "income";

export function Recurring() {
  const { state, today, category } = useStore();
  const [group, setGroup] = useState<Group>("all");
  const [flagged, setFlagged] = useState<Set<string>>(new Set());

  const monthly = (r: R) => Math.abs(r.amount) / (r.cadence === "bimonthly" ? 2 : 1);
  const outflows = state.recurring.filter((r) => r.amount < 0);
  const subs = outflows.filter((r) => r.categoryId === "subscriptions");
  const totalMonthly = outflows.reduce((a, r) => a + monthly(r), 0);
  const subsYear = subs.reduce((a, r) => a + monthly(r) * 12, 0);
  const increases = state.recurring.filter((r) => r.previousAmount !== undefined && Math.abs(r.amount) > Math.abs(r.previousAmount));

  const items = state.recurring
    .filter((r) => {
      if (group === "subscriptions") return r.categoryId === "subscriptions";
      if (group === "income") return r.amount > 0;
      if (group === "bills") return r.amount < 0 && r.categoryId !== "subscriptions";
      return true;
    })
    .map((r) => ({ r, next: nextDate(r, today) }))
    .sort((a, b) => a.next.getTime() - b.next.getTime());

  return (
    <div className="rise">
      <PageHeader title="קבועים ומנויים" subtitle="כל מה שיורד ונכנס כל חודש, מזוהה אוטומטית מהתנועות" />

      <div className="mb-5 grid gap-5 sm:grid-cols-3">
        <Card className="p-5" as="div">
          <p className="text-[13px] text-muted">הוצאות קבועות בחודש</p>
          <p className="money mt-1 text-[28px] font-bold tracking-tight text-ink">{ils(totalMonthly)}</p>
          <p className="mt-1 text-[12.5px] text-ink-2">{outflows.length} חיובים קבועים</p>
        </Card>
        <Card className="p-5" as="div">
          <p className="text-[13px] text-muted">מנויים בשנה</p>
          <p className="money mt-1 text-[28px] font-bold tracking-tight text-ink">{ils(subsYear)}</p>
          <p className="mt-1 text-[12.5px] text-ink-2">{subs.length} מנויים פעילים</p>
        </Card>
        <Card className="p-5" as="div">
          <p className="text-[13px] text-muted">התייקרויות שזוהו</p>
          <p className="mt-1 text-[28px] font-bold tracking-tight text-ink">{increases.length}</p>
          <p className="mt-1 text-[12.5px] text-ink-2">
            עוד <span className="money">{ils(increases.reduce((a, r) => a + (Math.abs(r.amount) - Math.abs(r.previousAmount!)) * (r.cadence === "monthly" ? 12 : 6), 0))}</span> בשנה
          </p>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="לוח החיובים"
          subtitle="ממוין לפי החיוב הבא"
          action={
            <Segmented<Group>
              label="סינון"
              value={group}
              onChange={setGroup}
              options={[
                { value: "all", label: "הכל" },
                { value: "subscriptions", label: "מנויים" },
                { value: "bills", label: "חשבונות" },
                { value: "income", label: "הכנסות" },
              ]}
            />
          }
        />
        <ul className="mt-3 px-3 pb-3">
          {items.map(({ r, next }) => {
            const inDays = diffDays(next, today);
            const up = r.previousAmount !== undefined && Math.abs(r.amount) > Math.abs(r.previousAmount);
            const isFlagged = flagged.has(r.id);
            return (
              <li key={r.id} className="flex flex-wrap items-center gap-3.5 rounded-2xl px-3 py-3 transition hover:bg-surface-2">
                <CategoryChip category={category(r.categoryId)} />
                <div className="min-w-[160px] flex-1">
                  <p className="flex flex-wrap items-center gap-2 text-[14.5px] font-medium text-ink">
                    {r.merchant}
                    {up && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-warning-soft px-2 py-px text-[11.5px] font-semibold text-warning-text">
                        <TrendingUp size={12} /> התייקר מ־<span className="money">{ils(Math.abs(r.previousAmount!), { cents: true })}</span>
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-[12.5px] text-muted">
                    <AccountBadge account={state.accounts.find((a) => a.id === r.accountId)!} size={16} />
                    {r.cadence === "monthly" ? "חודשי" : "דו־חודשי"} · ב־{r.dayOfMonth} לחודש
                  </p>
                </div>
                <div className="text-end">
                  <Money value={r.amount} cents className="text-[14.5px] font-semibold" />
                  <p className={clsx("text-[12px]", inDays <= 3 ? "font-semibold text-ink-2" : "text-muted")}>
                    {inDays === 0 ? "היום" : inDays === 1 ? "מחר" : `בעוד ${inDays} ימים`} · {fmtDate(next)}
                  </p>
                </div>
                {r.categoryId === "subscriptions" && (
                  <button
                    onClick={() =>
                      setFlagged((s) => {
                        const n = new Set(s);
                        if (n.has(r.id)) n.delete(r.id);
                        else n.add(r.id);
                        return n;
                      })
                    }
                    aria-pressed={isFlagged}
                    className={clsx(
                      "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12.5px] font-medium transition",
                      isFlagged ? "border-brand bg-brand-soft text-brand" : "border-line text-ink-2 hover:border-line-strong",
                    )}
                  >
                    <BellRing size={13} /> {isFlagged ? "נזכיר לבטל" : "לא בשימוש?"}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}
