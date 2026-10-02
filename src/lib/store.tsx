import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import * as mock from "../data/mock";
import type { Budget, Settings } from "../data/types";
import { history, insights, summarize, type FinanceState } from "./finance";

// Local overrides on top of the synced data: the user's own edits.
interface Overrides {
  categoryOf: Record<string, string>; // txId -> categoryId
  merchantRule?: Record<string, string>; // merchant -> categoryId, learned from recategorizing
  verified?: string[]; // accounts the user re-verified (OTP)
  budgets?: Budget[];
  settings?: Partial<Settings>;
}

const KEY = "shefa-overrides-v1";

function load(): Overrides {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { categoryOf: {}, ...JSON.parse(raw) };
  } catch {
    /* storage unavailable */
  }
  return { categoryOf: {} };
}

function save(o: Overrides) {
  try {
    localStorage.setItem(KEY, JSON.stringify(o));
  } catch {
    /* storage unavailable */
  }
}

function useStoreValue() {
  const [overrides, setOverrides] = useState<Overrides>(load);
  useEffect(() => {
    save(overrides);
  }, [overrides]);

  const today = useMemo(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), n.getDate());
  }, []);

  const state: FinanceState = useMemo(
    () => ({
      categories: mock.categories,
      accounts: mock.accounts.map((a) =>
        overrides.verified?.includes(a.id) ? { ...a, status: "ok" as const, lastSync: new Date().toISOString() } : a,
      ),
      recurring: mock.recurring,
      transactions: mock.transactions.map((t) => {
        const c = overrides.categoryOf[t.id] ?? overrides.merchantRule?.[t.merchant];
        return c ? { ...t, categoryId: c } : t;
      }),
      budgets: overrides.budgets ?? mock.budgets,
      settings: { ...mock.settings, ...overrides.settings },
    }),
    [overrides],
  );

  const current = useMemo(() => summarize(state, today, 0), [state, today]);
  const previous = useMemo(() => summarize(state, today, -1), [state, today]);
  const hist = useMemo(() => history(state, today, 6), [state, today]);
  const tips = useMemo(() => insights(state, current, previous), [state, current, previous]);

  // Recategorizing teaches a rule for the merchant, so its other transactions follow.
  // Earlier per-transaction overrides for that merchant are dropped so the rule wins.
  const recategorize = useCallback(
    (txId: string, categoryId: string) =>
      setOverrides((o) => {
        const merchant = mock.transactions.find((t) => t.id === txId)?.merchant;
        if (!merchant) return o;
        const sameMerchant = new Set(mock.transactions.filter((t) => t.merchant === merchant).map((t) => t.id));
        const categoryOf = Object.fromEntries(Object.entries(o.categoryOf).filter(([id]) => !sameMerchant.has(id)));
        return { ...o, categoryOf, merchantRule: { ...o.merchantRule, [merchant]: categoryId } };
      }),
    [],
  );

  const verifyAccount = useCallback(
    (accountId: string) => setOverrides((o) => ({ ...o, verified: [...new Set([...(o.verified ?? []), accountId])] })),
    [],
  );

  const setBudget = useCallback(
    (categoryId: string, limit: number) =>
      setOverrides((o) => {
        const base = o.budgets ?? mock.budgets;
        const exists = base.some((b) => b.categoryId === categoryId);
        const budgets = exists
          ? base.map((b) => (b.categoryId === categoryId ? { ...b, limit } : b))
          : [...base, { categoryId, limit }];
        return { ...o, budgets };
      }),
    [],
  );

  const reset = useCallback(() => setOverrides({ categoryOf: {} }), []);

  const category = useCallback(
    // Unknown ids fall back to "misc" (still counted as spending), never to a transfer category.
    (id: string) => state.categories.find((c) => c.id === id) ?? state.categories.find((c) => c.id === "misc")!,
    [state.categories],
  );
  const account = useCallback((id: string) => state.accounts.find((a) => a.id === id)!, [state.accounts]);

  return { state, today, current, previous, history: hist, insights: tips, recategorize, verifyAccount, setBudget, reset, category, account };
}

type Store = ReturnType<typeof useStoreValue>;
const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const value = useStoreValue();
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStore outside StoreProvider");
  return v;
}

// Theme: light by default. "system" follows the OS via CSS on [data-theme="system"].
export type ThemePref = "light" | "dark" | "system";

export function useTheme(): [ThemePref, (t: ThemePref) => void] {
  const [pref, setPref] = useState<ThemePref>(() => {
    try {
      return (localStorage.getItem("shefa-theme") as ThemePref) || "light";
    } catch {
      return "light";
    }
  });
  useEffect(() => {
    document.documentElement.dataset.theme = pref;
    try {
      localStorage.setItem("shefa-theme", pref);
    } catch {
      /* storage unavailable */
    }
  }, [pref]);
  return [pref, setPref];
}
