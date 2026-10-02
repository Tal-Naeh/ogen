import type { Account, Budget, Category, CategoryKind, Recurring, Settings, Transaction } from "../data/types";
import { addDays, cycleFor, dayInMonth, diffDays, fromISO, inCycle, type Cycle } from "./date";

export interface FinanceState {
  categories: Category[];
  accounts: Account[];
  transactions: Transaction[];
  recurring: Recurring[];
  budgets: Budget[];
  settings: Settings;
}

export interface UpcomingItem {
  recurring: Recurring;
  date: Date;
}

export interface CategorySpend {
  category: Category;
  spent: number; // positive
  limit: number;
  pace: number; // where spending "should" be by today if spread evenly
  count: number;
}

export interface CycleSummary {
  cycle: Cycle;
  today: Date;
  dayIndex: number; // 0-based day of cycle for today
  daysLeft: number; // including today
  incomeReceived: number;
  incomeUpcoming: number;
  fixedPaid: number;
  fixedUpcoming: number;
  savings: number; // planned + done for the cycle
  variableSpent: number;
  variableBudget: number;
  leftToSpend: number;
  dailyAllowance: number;
  projectedVariable: number;
  projectedSurplus: number;
  upcoming: UpcomingItem[];
  categories: CategorySpend[];
  cumulative: number[]; // variable spend, cumulative by day, up to today
}

export const kindOf = (s: FinanceState) => {
  const m = new Map(s.categories.map((c) => [c.id, c.kind]));
  return (id: string): CategoryKind => m.get(id) ?? "variable";
};

/** Recurring occurrences falling inside a cycle (posted or not). */
export function occurrences(r: Recurring, c: Cycle): Date[] {
  const out: Date[] = [];
  for (let k = 0; k <= 1; k++) {
    const d = dayInMonth(c.start.getFullYear(), c.start.getMonth() + k, r.dayOfMonth);
    if (d < c.start || d > c.end) continue;
    if (r.cadence === "bimonthly" && d.getMonth() % 2 !== r.parity) continue;
    out.push(d);
  }
  return out;
}

export function summarize(s: FinanceState, today: Date, offset = 0): CycleSummary {
  const cycle = cycleFor(today, s.settings.cycleStartDay, offset);
  const isCurrent = offset === 0;
  const asOf = isCurrent ? today : cycle.end;
  const kind = kindOf(s);
  const txs = s.transactions.filter((t) => inCycle(t.date, cycle));

  let incomeReceived = 0, fixedPaid = 0, savingsDone = 0, variableSpent = 0;
  for (const t of txs) {
    const k = kind(t.categoryId);
    if (k === "income") incomeReceived += t.amount;
    else if (k === "fixed") fixedPaid += -t.amount;
    else if (k === "savings") savingsDone += -t.amount;
    else if (k === "variable") variableSpent += -t.amount;
  }

  // A recurring occurrence counts as posted if a charge for it landed within a few days
  // (banks often post a day or two late). Unposted ones from today onward are still expected.
  const postedDates = new Map<string, Date[]>();
  for (const t of txs) {
    if (!t.recurringId) continue;
    postedDates.set(t.recurringId, [...(postedDates.get(t.recurringId) ?? []), fromISO(t.date)]);
  }
  const upcoming: UpcomingItem[] = [];
  for (const r of s.recurring) {
    for (const d of occurrences(r, cycle)) {
      const posted = (postedDates.get(r.id) ?? []).some((p) => Math.abs(diffDays(p, d)) <= 4);
      if (!posted && d >= asOf) upcoming.push({ recurring: r, date: d });
    }
  }
  upcoming.sort((a, b) => a.date.getTime() - b.date.getTime());

  let incomeUpcoming = 0, fixedUpcoming = 0, savingsUpcoming = 0;
  for (const u of upcoming) {
    const k = kind(u.recurring.categoryId);
    if (k === "income") incomeUpcoming += u.recurring.amount;
    else if (k === "savings") savingsUpcoming += -u.recurring.amount;
    else fixedUpcoming += -u.recurring.amount;
  }

  const dayIndex = Math.min(diffDays(asOf, cycle.start), cycle.days - 1);
  const daysLeft = cycle.days - dayIndex;
  const elapsed = dayIndex + 1;

  const daily = new Array(elapsed).fill(0);
  for (const t of txs) {
    if (kind(t.categoryId) !== "variable") continue;
    const i = diffDays(fromISO(t.date), cycle.start);
    if (i >= 0 && i < elapsed) daily[i] += -t.amount;
  }
  const cumulative: number[] = [];
  daily.reduce((acc, v) => (cumulative.push(acc + v), acc + v), 0);

  const variableBudget = s.budgets.reduce((a, b) => a + b.limit, 0);
  const savings = savingsDone + savingsUpcoming;
  const leftToSpend = incomeReceived + incomeUpcoming - fixedPaid - fixedUpcoming - savings - variableSpent;

  // Project remaining variable spend from this cycle's pace, damped toward budget pace.
  const pacePerDay = variableSpent / elapsed;
  const budgetPerDay = variableBudget / cycle.days;
  const blended = isCurrent ? 0.65 * pacePerDay + 0.35 * budgetPerDay : 0;
  const remainingDays = isCurrent ? daysLeft - 1 : 0;
  const projectedVariable = variableSpent + blended * remainingDays;
  const projectedSurplus = leftToSpend - blended * remainingDays;

  const byCat = new Map<string, { spent: number; count: number }>();
  for (const t of txs) {
    if (kind(t.categoryId) !== "variable") continue;
    const e = byCat.get(t.categoryId) ?? { spent: 0, count: 0 };
    e.spent += -t.amount;
    e.count += 1;
    byCat.set(t.categoryId, e);
  }
  const categories: CategorySpend[] = s.categories
    .filter((c) => c.kind === "variable")
    .map((c) => {
      const limit = s.budgets.find((b) => b.categoryId === c.id)?.limit ?? 0;
      const e = byCat.get(c.id) ?? { spent: 0, count: 0 };
      return { category: c, spent: e.spent, count: e.count, limit, pace: (limit * elapsed) / cycle.days };
    })
    .sort((a, b) => b.spent - a.spent);

  return {
    cycle,
    today: asOf,
    dayIndex,
    daysLeft,
    incomeReceived,
    incomeUpcoming,
    fixedPaid,
    fixedUpcoming,
    savings,
    variableSpent,
    variableBudget,
    leftToSpend,
    dailyAllowance: leftToSpend / daysLeft,
    projectedVariable,
    projectedSurplus,
    upcoming,
    categories,
    cumulative,
  };
}

export interface HistoryPoint {
  cycle: Cycle;
  income: number;
  expenses: number; // fixed + variable
  savings: number;
}

export function history(s: FinanceState, today: Date, cycles = 6): HistoryPoint[] {
  const out: HistoryPoint[] = [];
  for (let off = -(cycles - 1); off <= 0; off++) {
    const x = summarize(s, today, off);
    out.push({
      cycle: x.cycle,
      income: x.incomeReceived,
      expenses: x.fixedPaid + x.variableSpent,
      savings: x.savings,
    });
  }
  return out;
}

export type Tone = "good" | "warning" | "critical" | "info";

export interface Insight {
  id: string;
  tone: Tone;
  icon: string;
  title: string;
  body: string;
  action?: { label: string; to: string };
}

export function insights(s: FinanceState, cur: CycleSummary, prev: CycleSummary): Insight[] {
  const out: Insight[] = [];
  const ilsN = (n: number) => `₪${Math.round(n).toLocaleString("he-IL")}`;

  const hot = cur.categories
    .filter((c) => c.limit > 0 && c.spent > c.pace * 1.15 && c.spent > 150)
    .sort((a, b) => b.spent / b.pace - a.spent / a.pace)[0];
  if (hot) {
    const projected = (hot.spent / (cur.dayIndex + 1)) * cur.cycle.days;
    out.push({
      id: "hot-category",
      tone: projected > hot.limit ? "warning" : "info",
      icon: hot.category.icon,
      title: `שווה להאט קצת ב${hot.category.name}`,
      body: `הוצאתם ${ilsN(hot.spent)} עד היום. בקצב הזה תגיעו לכ־${ilsN(projected)} עד סוף המחזור, מול תקציב של ${ilsN(hot.limit)}.`,
      action: { label: "לפירוט ההוצאות", to: `/app/transactions?category=${hot.category.id}` },
    });
  }

  for (const r of s.recurring.filter((r) => r.previousAmount !== undefined)) {
    const diff = Math.abs(r.amount) - Math.abs(r.previousAmount!);
    if (diff <= 0) continue;
    const yearly = diff * (r.cadence === "monthly" ? 12 : 6);
    out.push({
      id: `price-${r.id}`,
      tone: "warning",
      icon: "trending",
      title: `${r.merchant.split(" · ")[0]} העלו את המחיר`,
      body: `מ־${ilsN(Math.abs(r.previousAmount!))} ל־${ilsN(Math.abs(r.amount))}. זה ${ilsN(yearly)} נוספים בשנה, שווה לבדוק אם אפשר מסלול זול יותר.`,
      action: { label: "לכל החיובים הקבועים", to: "/app/recurring" },
    });
  }

  const subs = s.recurring.filter((r) => r.categoryId === "subscriptions");
  const subsYear = subs.reduce((a, r) => a + Math.abs(r.amount) * 12, 0);
  out.push({
    id: "subs-total",
    tone: "info",
    icon: "repeat",
    title: `${subs.length} מנויים פעילים, ${ilsN(subsYear)} בשנה`,
    body: "בדקנו את כל המנויים שלכם במקום אחד. סמנו את מה שלא בשימוש ונזכיר לכם לבטל לפני החיוב הבא.",
    action: { label: "לסקירת המנויים", to: "/app/recurring" },
  });

  if (cur.projectedSurplus > 0) {
    const delta = cur.projectedSurplus - prev.leftToSpend;
    const elapsed = (cur.dayIndex + 1) / cur.cycle.days;
    const driver = cur.categories
      .map((x) => ({ name: x.category.name, d: x.spent - (prev.categories.find((p) => p.category.id === x.category.id)?.spent ?? 0) * elapsed }))
      .sort((a, b) => b.d - a.d)[0];
    out.push({
      id: "surplus",
      tone: "good",
      icon: "sparkles",
      title: `צפוי עודף של ${ilsN(cur.projectedSurplus)} בסוף המחזור`,
      body:
        delta >= 0
          ? `${ilsN(delta)} יותר מהמחזור הקודם. רוצים להעביר חלק לחיסכון כבר עכשיו, לפני שזה "נעלם"?`
          : `${ilsN(-delta)} פחות מהמחזור הקודם${driver && driver.d > 0 ? `, בעיקר בגלל ${driver.name}` : ""}. עדיין בפלוס.`,
      action: { label: "להגדרת יעד חיסכון", to: "/app/budgets" },
    });
  }

  for (const a of s.accounts.filter((a) => a.status === "needs_action")) {
    out.push({
      id: `sync-${a.id}`,
      tone: "critical",
      icon: "alert",
      title: `${a.provider} צריך אימות קצר`,
      body: "הכרטיס ביקש קוד חד־פעמי. זה לוקח כמה שניות, ואז נמשיך לעדכן את התנועות ממנו.",
      action: { label: "לאימות", to: "/app/accounts" },
    });
  }

  const order: Record<Tone, number> = { good: 0, critical: 1, warning: 2, info: 3 };
  return out.sort((a, b) => order[a.tone] - order[b.tone]);
}

/** Next charge date for a recurring item from `today` (inclusive). */
export function nextDate(r: Recurring, today: Date): Date {
  for (let k = 0; k < 3; k++) {
    const d = dayInMonth(today.getFullYear(), today.getMonth() + k, r.dayOfMonth);
    if (d < today) continue;
    if (r.cadence === "bimonthly" && d.getMonth() % 2 !== r.parity) continue;
    return d;
  }
  return addDays(today, 30);
}
