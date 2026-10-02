const ils0 = new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS", maximumFractionDigits: 0 });
const ils2 = new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS", minimumFractionDigits: 2, maximumFractionDigits: 2 });
const num0 = new Intl.NumberFormat("he-IL", { maximumFractionDigits: 0 });
const num1 = new Intl.NumberFormat("he-IL", { maximumFractionDigits: 1 });

/** "₪1,234" — whole shekels unless `cents` is set. Sign is kept. */
export function ils(n: number, opts: { cents?: boolean; sign?: boolean } = {}): string {
  const f = opts.cents && !Number.isInteger(n) ? ils2 : ils0;
  const s = f.format(Math.abs(n)).replace(/‏/g, "");
  if (n < 0) return `−${s}`;
  if (opts.sign && n > 0) return `+${s}`;
  return s;
}

/** Compact axis ticks: 1.2K-style but Hebrew-friendly ("₪1.2K"). */
export function ilsCompact(n: number): string {
  if (Math.abs(n) >= 1000) return `₪${num1.format(Math.round(n / 100) / 10)}K`;
  return `₪${num0.format(n)}`;
}

export function pct(n: number): string {
  return `${Math.round(n * 100)}%`;
}

const dayMonth = new Intl.DateTimeFormat("he-IL", { day: "numeric", month: "long" });
const dayMonthShort = new Intl.DateTimeFormat("he-IL", { day: "numeric", month: "short" });
const weekday = new Intl.DateTimeFormat("he-IL", { weekday: "long" });
const monthName = new Intl.DateTimeFormat("he-IL", { month: "long" });

export const fmtDate = (d: Date) => dayMonth.format(d);
export const fmtDateShort = (d: Date) => dayMonthShort.format(d);
export const fmtWeekday = (d: Date) => weekday.format(d);
export const fmtMonth = (d: Date) => monthName.format(d);

export function relativeTime(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 1) return "עכשיו";
  if (mins < 60) return `לפני ${mins} דק׳`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return hrs === 1 ? "לפני שעה" : `לפני ${hrs} שעות`;
  const days = Math.round(hrs / 24);
  return days === 1 ? "אתמול" : `לפני ${days} ימים`;
}
