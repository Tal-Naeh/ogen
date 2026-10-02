// Calendar-date helpers working on local "YYYY-MM-DD" strings (no timezones).

export function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function fromISO(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/** Same day-of-month in another month, clamped (31 Jan + 1 → 28/29 Feb). */
export function dayInMonth(year: number, month: number, day: number): Date {
  const y = year + Math.floor(month / 12);
  const m = ((month % 12) + 12) % 12;
  return new Date(y, m, Math.min(day, daysInMonth(y, m)));
}

export function diffDays(a: Date, b: Date): number {
  const ms = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime() -
    new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime();
  return Math.round(ms / 86_400_000);
}

export interface Cycle {
  start: Date;
  end: Date; // inclusive
  days: number;
}

/** The financial cycle (salary day → day before next salary) containing `today`. */
export function cycleFor(today: Date, startDay: number, offset = 0): Cycle {
  const y = today.getFullYear();
  let m = today.getMonth();
  // Compare against the clamped start (salary day 31 → Feb 28), not the raw day number.
  if (today < dayInMonth(y, m, startDay)) m -= 1;
  m += offset;
  const start = dayInMonth(y, m, startDay);
  const end = addDays(dayInMonth(y, m + 1, startDay), -1);
  return { start, end, days: diffDays(end, start) + 1 };
}

export function inCycle(iso: string, c: Cycle): boolean {
  const d = fromISO(iso);
  return d >= c.start && d <= c.end;
}
