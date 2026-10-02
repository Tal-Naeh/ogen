import type { Account, Budget, Category, CategoryKind, Recurring, Settings, Transaction } from "../data/types";
import { ils } from "./format";
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
  savingsDone: number;
  variableSpent: number;
  variableBudget: number;
  leftToSpend: number;
  dailyAllowance: number;
  projectedVariable: number;
  projectedSurplus: number;
  upcoming: UpcomingItem[];
  categories: CategorySpend[];
  cumulative: number[]; // variable spend, cumulative by day, up to today
  // Monthly cash flow (תזרים): everything that came in minus everything that went out.
  flowIn: number; // so far
  flowOut: number; // so far
  projectedIn: number; // whole month, incl. expected
  projectedOut: number;
  projectedNet: number;
  netCumulative: number[]; // actual net flow, cumulative by day, up to today
  netProjection: number[]; // expected cumulative net from today to month end (index 0 = today)
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

  // Project remaining variable spend: early in the month a couple of days say little, so lean
  // on the budget; trust the actual pace more as days accumulate (up to 65% after ~10 days).
  const pacePerDay = variableSpent / elapsed;
  const budgetPerDay = variableBudget / cycle.days;
  const wPace = 0.65 * Math.min(1, elapsed / 10);
  const blended = isCurrent ? wPace * pacePerDay + (1 - wPace) * budgetPerDay : 0;
  const remainingDays = isCurrent ? daysLeft - 1 : 0;
  const projectedVariable = variableSpent + blended * remainingDays;
  const projectedSurplus = leftToSpend - blended * remainingDays;

  // Cash-flow path: actual per day so far, then expected — recurring items on their dates
  // (salary jumps up, mortgage steps down) plus the variable pace per day.
  const netDaily = new Array(elapsed).fill(0);
  for (const t of txs) {
    if (kind(t.categoryId) === "transfer") continue;
    const i = diffDays(fromISO(t.date), cycle.start);
    if (i >= 0 && i < elapsed) netDaily[i] += t.amount;
  }
  const netCumulative: number[] = [];
  netDaily.reduce((acc, v) => (netCumulative.push(acc + v), acc + v), 0);
  const netProjection: number[] = [];
  if (isCurrent) {
    let cum = netCumulative[dayIndex] ?? 0;
    netProjection.push(cum);
    for (let i = dayIndex + 1; i < cycle.days; i++) {
      cum -= blended;
      for (const u of upcoming) {
        const ui = diffDays(u.date, cycle.start);
        if (ui === i || (ui === dayIndex && i === dayIndex + 1)) cum += u.recurring.amount;
      }
      netProjection.push(cum);
    }
  }
  const flowIn = incomeReceived;
  const flowOut = fixedPaid + savingsDone + variableSpent;
  const projectedIn = incomeReceived + incomeUpcoming;
  const projectedOut = fixedPaid + fixedUpcoming + savings + projectedVariable;

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
    savingsDone,
    variableSpent,
    variableBudget,
    leftToSpend,
    dailyAllowance: leftToSpend / daysLeft,
    projectedVariable,
    projectedSurplus,
    upcoming,
    categories,
    cumulative,
    flowIn,
    flowOut,
    projectedIn,
    projectedOut,
    projectedNet: projectedIn - projectedOut,
    netCumulative,
    netProjection,
  };
}

export interface HistoryPoint {
  cycle: Cycle;
  income: number;
  expenses: number; // fixed + variable
  savings: number;
  net: number; // income − expenses − savings: the month's cash flow
}

export function history(s: FinanceState, today: Date, cycles = 6): HistoryPoint[] {
  const out: HistoryPoint[] = [];
  for (let off = -(cycles - 1); off <= 0; off++) {
    const x = summarize(s, today, off);
    out.push({
      cycle: x.cycle,
      income: x.incomeReceived,
      expenses: x.fixedPaid + x.variableSpent,
      savings: x.savingsDone,
      net: x.incomeReceived - x.fixedPaid - x.variableSpent - x.savingsDone,
    });
  }
  return out;
}

export interface BalancePoint {
  month: Date; // first day of the month the point closes
  balance: number; // bank balance at month end
  projected: boolean;
}

export interface BalanceOutlook {
  current: number; // bank balance now (negative = overdraft)
  avgFlow: number; // average monthly net flow, last 3 full months
  points: BalancePoint[]; // past month-ends, this month's expected end, then projection
  clearsAt?: Date; // month the overdraft is expected to close
  monthsToClear?: number;
}

/**
 * The cash-flow mindset in one picture: past month-end balances reconstructed from each
 * month's net flow, then projected forward at the recent average until the overdraft clears.
 */
export function balanceOutlook(s: FinanceState, cur: CycleSummary, hist: HistoryPoint[]): BalanceOutlook {
  const current = s.accounts.filter((a) => a.type === "bank").reduce((a, b) => a + (b.balance ?? 0), 0);
  const full = hist.slice(0, -1);
  const recent = full.slice(-3);
  const avgFlow = recent.length ? recent.reduce((a, h) => a + h.net, 0) / recent.length : 0;

  // Walk back: balance at the end of last month = now − what flowed this month so far, etc.
  const netSoFar = cur.flowIn - cur.flowOut;
  const past: BalancePoint[] = [];
  let b = current - netSoFar;
  for (let i = full.length - 1; i >= 0; i--) {
    past.unshift({ month: full[i].cycle.start, balance: b, projected: false });
    b -= full[i].net;
  }
  const endOfThisMonth = current + (cur.projectedNet - netSoFar);
  const points: BalancePoint[] = [...past, { month: cur.cycle.start, balance: endOfThisMonth, projected: true }];

  let clearsAt: Date | undefined;
  let monthsToClear: number | undefined;
  let bal = endOfThisMonth;
  const horizon = current < 0 && avgFlow > 0 ? Math.min(36, Math.ceil(-endOfThisMonth / avgFlow) + 2) : 6;
  for (let k = 1; k <= horizon; k++) {
    bal += avgFlow;
    const month = dayInMonth(cur.cycle.start.getFullYear(), cur.cycle.start.getMonth() + k, 1);
    points.push({ month, balance: bal, projected: true });
    if (current < 0 && clearsAt === undefined && bal >= 0) {
      clearsAt = month;
      monthsToClear = k;
    }
  }
  if (current < 0 && endOfThisMonth >= 0) {
    clearsAt = cur.cycle.start;
    monthsToClear = 0;
  }
  return { current, avgFlow, points, clearsAt, monthsToClear };
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

export function insights(s: FinanceState, cur: CycleSummary, prev: CycleSummary, outlook?: BalanceOutlook): Insight[] {
  const out: Insight[] = [];
  const monthYear = new Intl.DateTimeFormat("he-IL", { month: "long", year: "numeric" });

  if (outlook && outlook.current < 0 && outlook.avgFlow > 0 && outlook.clearsAt) {
    out.push({
      id: "overdraft-clears",
      tone: "good",
      icon: "sparkles",
      title: outlook.monthsToClear === 0 ? "יוצאים מהמינוס כבר החודש" : `בעוד ${outlook.monthsToClear === 1 ? "חודש" : `${outlook.monthsToClear} חודשים`} תצאו מהמינוס`,
      body: `התזרים שלכם חיובי, בממוצע ${ils(outlook.avgFlow, { sign: true })} בחודש. בקצב הזה המינוס ייסגר ב${monthYear.format(outlook.clearsAt)}, בלי צעדים דרסטיים.`,
      action: { label: "למסלול היתרה", to: "/app" },
    });
  } else if (outlook && outlook.current < 0 && outlook.avgFlow <= 0) {
    out.push({
      id: "overdraft-growing",
      tone: "warning",
      icon: "trending",
      title: "המינוס לא קטן כרגע",
      body: `בחודשים האחרונים יצא יותר ממה שנכנס, בממוצע ${ils(-outlook.avgFlow)} בחודש. גם שיפור קטן בתזרים יתחיל לסגור את המינוס.`,
      action: { label: "לתקציב", to: "/app/budgets" },
    });
  } else if (outlook && outlook.current >= 0 && outlook.avgFlow > 0) {
    out.push({
      id: "positive-growing",
      tone: "good",
      icon: "sparkles",
      title: "החשבון בפלוס, והיתרה ממשיכה לגדול",
      body: `בכל חודש נשארים לכם בממוצע ${ils(outlook.avgFlow)}. בקצב הזה, בעוד שנה יהיו לכם כ־${ils(outlook.avgFlow * 12)} נוספים.`,
    });
  }
  const ilsN = (n: number) => ils(n);

  // Pace says little in the first week (one big grocery run looks like a trend), so wait.
  const hot = cur.categories
    .filter((c) => cur.dayIndex >= 6 && c.limit > 0 && c.spent > c.pace * 1.15 && c.spent > 150)
    .sort((a, b) => b.spent / b.pace - a.spent / a.pace)[0];
  if (hot) {
    const projected = (hot.spent / (cur.dayIndex + 1)) * cur.cycle.days;
    out.push({
      id: "hot-category",
      tone: projected > hot.limit ? "warning" : "info",
      icon: hot.category.icon,
      title: `ההוצאות על ${hot.category.name} רצות מהר מהתכנון`,
      body: `עד היום הוצאתם ${ilsN(hot.spent)}. בקצב הזה תגיעו לכ־${ilsN(projected)} בסוף החודש, והתקציב הוא ${ilsN(hot.limit)}.`,
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
      title: `המחיר של ${r.merchant.split(" · ")[0]} עלה`,
      body: `מ־${ils(Math.abs(r.previousAmount!), { cents: true })} ל־${ils(Math.abs(r.amount), { cents: true })}, כלומר ${ilsN(yearly)} יותר בשנה. אולי יש מסלול זול יותר.`,
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
    body: "ריכזנו את כל המנויים במקום אחד. סמנו מה לא בשימוש, ונזכיר לכם לבטל לפני החיוב הבא.",
    action: { label: "לסקירת המנויים", to: "/app/recurring" },
  });

  if (cur.projectedSurplus > 0 && !(outlook && outlook.current < 0)) {
    const delta = cur.projectedSurplus - prev.leftToSpend;
    const elapsed = (cur.dayIndex + 1) / cur.cycle.days;
    const driver = cur.categories
      .map((x) => ({ name: x.category.name, d: x.spent - (prev.categories.find((p) => p.category.id === x.category.id)?.spent ?? 0) * elapsed }))
      .sort((a, b) => b.d - a.d)[0];
    out.push({
      id: "surplus",
      tone: "good",
      icon: "sparkles",
      title: `החודש צפוי להיסגר בתזרים חיובי של ${ilsN(cur.projectedSurplus)}`,
      body:
        delta >= 0
          ? `${ilsN(delta)} יותר מהחודש הקודם. רוצים להעביר חלק לחיסכון כבר עכשיו, לפני שהכסף ״נעלם״?`
          : `${ilsN(-delta)} פחות מהחודש הקודם${driver && driver.d > 0 ? `, בעיקר בגלל ${driver.name}` : ""}. עדיין בפלוס.`,
      action: { label: "להגדרת יעד חיסכון", to: "/app/budgets" },
    });
  }

  for (const a of s.accounts.filter((a) => a.status === "needs_action")) {
    out.push({
      id: `sync-${a.id}`,
      tone: "critical",
      icon: "alert",
      title: `החיבור ל־${a.provider} דורש אימות`,
      body: "חברת האשראי ביקשה קוד חד־פעמי. זה לוקח כמה שניות, ואחר כך התנועות יתעדכנו שוב.",
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
