// Domain model. The mock layer produces these today; a real sync backend
// (bank / credit-card aggregation) will produce the same shapes later.

export type CategoryKind = "income" | "fixed" | "variable" | "savings" | "transfer";

export interface Category {
  id: string;
  name: string;
  icon: string; // lucide icon key, resolved in components/CategoryIcon
  kind: CategoryKind;
  tint: string; // decorative chip tint (UI only, never encodes data)
}

export type AccountType = "bank" | "card";
export type SyncStatus = "ok" | "syncing" | "needs_action";

export interface Account {
  id: string;
  provider: string; // e.g. "בנק הפועלים", "ישראכרט"
  type: AccountType;
  label: string; // e.g. "עו״ש", "ויזה זהב"
  mask: string; // e.g. "•••• 4471"
  balance?: number; // banks only
  status: SyncStatus;
  lastSync: string; // ISO datetime
  color: string; // provider brand-ish swatch for the account badge
}

export interface Installments {
  current: number;
  total: number;
  originalAmount: number;
}

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  merchant: string;
  note?: string;
  amount: number; // negative = money out
  accountId: string;
  categoryId: string;
  recurringId?: string;
  installments?: Installments;
  pending?: boolean;
}

export type Cadence = "monthly" | "bimonthly";

export interface Recurring {
  id: string;
  merchant: string;
  categoryId: string;
  accountId: string;
  amount: number; // signed, current amount
  previousAmount?: number; // set when the price changed recently
  dayOfMonth: number;
  cadence: Cadence;
  /** bimonthly only: charged in months where (month % 2) === parity */
  parity?: 0 | 1;
}

export interface Budget {
  categoryId: string;
  limit: number; // per cycle, positive
}

export interface Settings {
  cycleStartDay: number; // the cycle starts on the day salary lands
  monthlySavingsGoal: number;
  householdName: string;
}
