import type { Account, Budget, Category, Recurring, Settings, Transaction } from "./types";
import { addDays, cycleFor, dayInMonth, diffDays, fromISO, toISO } from "../lib/date";

// A realistic, deterministic Israeli household: two salaries, a mortgage,
// one kid in gan, a bank account and two credit cards.

export const categories: Category[] = [
  { id: "salary", name: "משכורת", icon: "briefcase", kind: "income", tint: "#30d158" },
  { id: "allowance", name: "קצבאות", icon: "landmark", kind: "income", tint: "#30d158" },
  { id: "housing", name: "דיור", icon: "home", kind: "fixed", tint: "#5e5ce6" },
  { id: "utilities", name: "חשבונות הבית", icon: "zap", kind: "fixed", tint: "#ff9f0a" },
  { id: "telecom", name: "תקשורת", icon: "wifi", kind: "fixed", tint: "#0a84ff" },
  { id: "insurance", name: "ביטוחים", icon: "shield", kind: "fixed", tint: "#64d2ff" },
  { id: "education", name: "חינוך וגנים", icon: "school", kind: "fixed", tint: "#ff375f" },
  { id: "subscriptions", name: "מנויים", icon: "repeat", kind: "fixed", tint: "#bf5af2" },
  { id: "installments", name: "תשלומים", icon: "layers", kind: "fixed", tint: "#8e8e93" },
  { id: "groceries", name: "סופר", icon: "cart", kind: "variable", tint: "#30d158" },
  { id: "dining", name: "אוכל בחוץ", icon: "utensils", kind: "variable", tint: "#ff9f0a" },
  { id: "transport", name: "דלק ותחבורה", icon: "fuel", kind: "variable", tint: "#0a84ff" },
  { id: "shopping", name: "קניות", icon: "bag", kind: "variable", tint: "#ff375f" },
  { id: "health", name: "בריאות ופארם", icon: "heart", kind: "variable", tint: "#ff453a" },
  { id: "kids", name: "ילדים", icon: "baby", kind: "variable", tint: "#ffb800" },
  { id: "leisure", name: "פנאי ובילויים", icon: "ticket", kind: "variable", tint: "#5e5ce6" },
  { id: "home", name: "לבית", icon: "sofa", kind: "variable", tint: "#00c7be" },
  { id: "misc", name: "שונות", icon: "dots", kind: "variable", tint: "#8e8e93" },
  { id: "savings", name: "חיסכון", icon: "piggy", kind: "savings", tint: "#30d158" },
  { id: "card_payment", name: "חיוב כרטיס אשראי", icon: "card", kind: "transfer", tint: "#8e8e93" },
];

const now = new Date();
const minutesAgo = (m: number) => new Date(now.getTime() - m * 60_000).toISOString();

export const accounts: Account[] = [
  {
    id: "hapoalim",
    provider: "בנק הפועלים",
    type: "bank",
    label: "חשבון עו״ש משותף",
    mask: "12-532-48213",
    balance: 14_830,
    status: "ok",
    lastSync: minutesAgo(14),
    color: "#e2001a",
  },
  {
    id: "isracard",
    provider: "ישראכרט",
    type: "card",
    label: "מאסטרקארד",
    mask: "•••• 4471",
    status: "ok",
    lastSync: minutesAgo(14),
    color: "#00a0df",
  },
  {
    id: "max",
    provider: "Max",
    type: "card",
    label: "ויזה",
    mask: "•••• 9082",
    status: "needs_action",
    lastSync: minutesAgo(60 * 26),
    color: "#ff4f8b",
  },
];

export const recurring: Recurring[] = [
  { id: "r-salary-1", merchant: "משכורת · אקמה טכנולוגיות", categoryId: "salary", accountId: "hapoalim", amount: 18_420, dayOfMonth: 10, cadence: "monthly" },
  { id: "r-salary-2", merchant: "משכורת · עיריית רמת גן", categoryId: "salary", accountId: "hapoalim", amount: 11_860, dayOfMonth: 9, cadence: "monthly" },
  { id: "r-btl", merchant: "ביטוח לאומי · קצבת ילדים", categoryId: "allowance", accountId: "hapoalim", amount: 173, dayOfMonth: 20, cadence: "monthly" },
  { id: "r-mortgage", merchant: "לאומי למשכנתאות", categoryId: "housing", accountId: "hapoalim", amount: -6_180, dayOfMonth: 1, cadence: "monthly" },
  { id: "r-arnona", merchant: "ארנונה · עיריית תל אביב", categoryId: "utilities", accountId: "hapoalim", amount: -742, dayOfMonth: 15, cadence: "monthly" },
  { id: "r-iec", merchant: "חברת החשמל", categoryId: "utilities", accountId: "hapoalim", amount: -612, previousAmount: -548, dayOfMonth: 22, cadence: "bimonthly", parity: 0 },
  { id: "r-water", merchant: "מי אביבים", categoryId: "utilities", accountId: "hapoalim", amount: -214, dayOfMonth: 18, cadence: "bimonthly", parity: 1 },
  { id: "r-gan", merchant: "גן שקד · שכר לימוד", categoryId: "education", accountId: "hapoalim", amount: -2_450, dayOfMonth: 1, cadence: "monthly" },
  { id: "r-harel", merchant: "הראל ביטוח · משכנתא ודירה", categoryId: "insurance", accountId: "hapoalim", amount: -412, dayOfMonth: 5, cadence: "monthly" },
  { id: "r-migdal", merchant: "מגדל · ביטוח בריאות", categoryId: "insurance", accountId: "hapoalim", amount: -186, dayOfMonth: 5, cadence: "monthly" },
  { id: "r-savings", merchant: "הפקדה · קופת גמל להשקעה", categoryId: "savings", accountId: "hapoalim", amount: -1_500, dayOfMonth: 11, cadence: "monthly" },
  { id: "r-partner", merchant: "פרטנר תקשורת", categoryId: "telecom", accountId: "isracard", amount: -159, previousAmount: -139, dayOfMonth: 12, cadence: "monthly" },
  { id: "r-bezeq", merchant: "בזק בינלאומי · סיבים", categoryId: "telecom", accountId: "isracard", amount: -99, dayOfMonth: 12, cadence: "monthly" },
  { id: "r-holmes", merchant: "הולמס פלייס", categoryId: "subscriptions", accountId: "isracard", amount: -289, dayOfMonth: 3, cadence: "monthly" },
  { id: "r-netflix", merchant: "Netflix", categoryId: "subscriptions", accountId: "max", amount: -59.9, previousAmount: -54.9, dayOfMonth: 14, cadence: "monthly" },
  { id: "r-spotify", merchant: "Spotify", categoryId: "subscriptions", accountId: "max", amount: -23.9, dayOfMonth: 20, cadence: "monthly" },
  { id: "r-disney", merchant: "Disney+", categoryId: "subscriptions", accountId: "max", amount: -39.9, dayOfMonth: 7, cadence: "monthly" },
  { id: "r-icloud", merchant: "Apple iCloud+", categoryId: "subscriptions", accountId: "max", amount: -11.9, dayOfMonth: 25, cadence: "monthly" },
  { id: "r-chatgpt", merchant: "OpenAI ChatGPT", categoryId: "subscriptions", accountId: "isracard", amount: -74, dayOfMonth: 17, cadence: "monthly" },
];

export const budgets: Budget[] = [
  { categoryId: "groceries", limit: 3_400 },
  { categoryId: "dining", limit: 1_200 },
  { categoryId: "transport", limit: 950 },
  { categoryId: "shopping", limit: 1_000 },
  { categoryId: "health", limit: 450 },
  { categoryId: "kids", limit: 700 },
  { categoryId: "leisure", limit: 700 },
  { categoryId: "home", limit: 500 },
  { categoryId: "misc", limit: 350 },
];

export const settings: Settings = {
  cycleStartDay: 10,
  monthlySavingsGoal: 1_500,
  householdName: "משפחת לוי",
};

// ---------------------------------------------------------------------------
// Transaction generator

function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Spend {
  categoryId: string;
  merchants: string[];
  min: number;
  max: number;
  perCycle: number;
}

const spends: Spend[] = [
  { categoryId: "groceries", merchants: ["שופרסל דיל", "רמי לוי שיווק השקמה", "יוחננוף", "ויקטורי", "AM:PM", "טיב טעם", "שוק הכרמל · ירקות"], min: 70, max: 640, perCycle: 11 },
  { categoryId: "dining", merchants: ["Wolt", "תן ביס", "קפה לנדוור", "ארומה", "בורגר סאלון", "אגאדיר", "מסעדת הסלון", "פיצה האט"], min: 34, max: 340, perCycle: 10 },
  { categoryId: "transport", merchants: ["פז", "סונול", "דלק", "דור אלון", "פנגו · חניה", "רב-קו"], min: 30, max: 360, perCycle: 6 },
  { categoryId: "shopping", merchants: ["זארה", "קסטרו", "Terminal X", "Amazon", "AliExpress", "פוקס"], min: 60, max: 620, perCycle: 3 },
  { categoryId: "health", merchants: ["סופר-פארם", "Be פארם", "מכבי · השתתפות עצמית"], min: 25, max: 240, perCycle: 3 },
  { categoryId: "kids", merchants: ["שילב", "ToysRus", "חוג כדורגל", "סטימצקי"], min: 40, max: 320, perCycle: 2 },
  { categoryId: "leisure", merchants: ["סינמה סיטי", "לאן · כרטיסים", "יס פלאנט", "פארק הירקון · השכרות"], min: 50, max: 420, perCycle: 2 },
  { categoryId: "home", merchants: ["ACE", "הום סנטר", "איקאה", "KSP"], min: 40, max: 480, perCycle: 1.5 },
  { categoryId: "misc", merchants: ["העברה ב-bit", "דואר ישראל", "PayBox"], min: 20, max: 180, perCycle: 2 },
];

const CARD_IDS = ["isracard", "max"];

function round(n: number) {
  return Math.round(n * 10) / 10;
}

function generate(): Transaction[] {
  const rand = rng(20261002);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const txs: Transaction[] = [];
  let seq = 0;
  const id = () => `t${++seq}`;
  const push = (t: Omit<Transaction, "id">) => {
    if (fromISO(t.date) <= today || t.pending) txs.push({ id: id(), ...t });
  };

  const CYCLES_BACK = 6;
  for (let off = -CYCLES_BACK; off <= 0; off++) {
    const cyc = cycleFor(today, settings.cycleStartDay, off);
    const lastDay = off === 0 ? today : cyc.end;
    const span = diffDays(lastDay, cyc.start) + 1;

    // Recurring items whose charge date falls inside this cycle.
    for (const r of recurring) {
      for (let k = 0; k <= 1; k++) {
        const d = dayInMonth(cyc.start.getFullYear(), cyc.start.getMonth() + k, r.dayOfMonth);
        if (d < cyc.start || d > cyc.end || d > today) continue;
        if (r.cadence === "bimonthly" && d.getMonth() % 2 !== r.parity) continue;
        // Price changes apply from the current cycle onward.
        const amount = r.previousAmount !== undefined && off < (r.id === "r-partner" ? -1 : 0) ? r.previousAmount : r.amount;
        const jitter = r.categoryId === "salary" && off !== 0 ? Math.round((rand() - 0.5) * 400) : 0;
        push({ date: toISO(d), merchant: r.merchant, amount: amount + jitter, accountId: r.accountId, categoryId: r.categoryId, recurringId: r.id });
      }
    }

    // A 12-installment laptop purchase that started three cycles ago.
    if (off >= -3) {
      const d = dayInMonth(cyc.start.getFullYear(), cyc.start.getMonth(), 12);
      if (d <= today) {
        push({
          date: toISO(d),
          merchant: "KSP · מחשב נייד",
          amount: -390,
          accountId: "isracard",
          categoryId: "installments",
          installments: { current: off + 4, total: 12, originalAmount: 4_680 },
        });
      }
    }

    // Day-to-day spending, a little heavier around weekends and holidays.
    for (const s of spends) {
      const pace = off === 0 && s.categoryId === "dining" ? 1.35 : 1; // this cycle: eating out is running hot
      const count = Math.round(((s.perCycle * span) / cyc.days) * pace * (0.85 + rand() * 0.3));
      for (let i = 0; i < count; i++) {
        const d = addDays(cyc.start, Math.floor(rand() * span));
        const amt = s.min + Math.pow(rand(), 1.6) * (s.max - s.min);
        push({
          date: toISO(d),
          merchant: s.merchants[Math.floor(rand() * s.merchants.length)],
          amount: -round(amt),
          accountId: CARD_IDS[rand() < 0.62 ? 0 : 1],
          categoryId: s.categoryId,
        });
      }
    }

    // Monthly card settlements hit the bank account; they're internal transfers,
    // excluded from spending so nothing is counted twice.
    const prev = cycleFor(today, settings.cycleStartDay, off - 1);
    for (const [cardId, day, name] of [["isracard", 10, "ישראכרט"], ["max", 2, "מקס איט פיננסים"]] as const) {
      const d = dayInMonth(cyc.start.getFullYear(), cyc.start.getMonth() + (day < settings.cycleStartDay ? 1 : 0), day);
      if (d > today) continue;
      const total = txs
        .filter((t) => t.accountId === cardId && fromISO(t.date) >= prev.start && fromISO(t.date) <= prev.end)
        .reduce((a, t) => a + t.amount, 0);
      if (total < 0) {
        push({ date: toISO(d), merchant: `חיוב ${name}`, amount: Math.round(total), accountId: "hapoalim", categoryId: "card_payment" });
      }
    }
  }

  // Two pending card authorisations from today.
  push({ date: toISO(today), merchant: "Wolt", amount: -126.4, accountId: "isracard", categoryId: "dining", pending: true });
  push({ date: toISO(today), merchant: "שופרסל אונליין", amount: -482.7, accountId: "isracard", categoryId: "groceries", pending: true });

  return txs.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

export const transactions: Transaction[] = generate();
