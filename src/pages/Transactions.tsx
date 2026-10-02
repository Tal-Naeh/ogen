import clsx from "clsx";
import { Check, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CategoryChip } from "../components/Icon";
import { TransactionRow } from "../components/TransactionRow";
import { AccountBadge, Card, Money, PageHeader, Portal } from "../components/ui";
import type { Transaction } from "../data/types";
import { fromISO, inCycle } from "../lib/date";
import { fmtDate, fmtWeekday, ils } from "../lib/format";
import { useStore } from "../lib/store";

type Range = "cycle" | "prev" | "all";

export function Transactions() {
  const { state, current, previous, category } = useStore();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState("");
  const [range, setRange] = useState<Range>("cycle");
  const [accountId, setAccountId] = useState<string | null>(null);
  const [open, setOpen] = useState<Transaction | null>(null);
  const catFilter = params.get("category");

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return state.transactions.filter((t) => {
      if (range === "cycle" && !inCycle(t.date, current.cycle)) return false;
      if (range === "prev" && !inCycle(t.date, previous.cycle)) return false;
      if (catFilter && t.categoryId !== catFilter) return false;
      if (accountId && t.accountId !== accountId) return false;
      if (needle && !`${t.merchant} ${category(t.categoryId).name}`.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [state.transactions, q, range, catFilter, accountId, current.cycle, previous.cycle, category]);

  const groups = useMemo(() => {
    const m = new Map<string, Transaction[]>();
    for (const t of list) m.set(t.date, [...(m.get(t.date) ?? []), t]);
    return [...m.entries()];
  }, [list]);

  const spent = list.filter((t) => t.amount < 0 && category(t.categoryId).kind !== "transfer").reduce((a, t) => a - t.amount, 0);
  const earned = list.filter((t) => t.amount > 0).reduce((a, t) => a + t.amount, 0);
  const usedCats = state.categories.filter((c) => c.kind === "variable" || c.kind === "fixed");

  return (
    <div className="rise">
      <PageHeader title="תנועות" subtitle={`${list.length} תנועות · הוצאות ${ils(spent)} · הכנסות ${ils(earned)}`} />

      <div className="sticky top-16 z-20 -mx-4 mb-4 space-y-3 bg-page/85 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex flex-wrap items-center gap-3">
          <label className="relative min-w-[220px] flex-1">
            <Search size={17} className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="חיפוש בית עסק או קטגוריה"
              className="h-11 w-full rounded-full border border-line bg-surface ps-10 pe-4 text-[14px] text-ink placeholder:text-muted focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15"
            />
          </label>
          <div className="inline-flex rounded-full border border-line bg-surface-2 p-1" role="radiogroup" aria-label="טווח זמן">
            {([["cycle", "המחזור הנוכחי"], ["prev", "המחזור הקודם"], ["all", "הכל"]] as const).map(([v, l]) => (
              <button key={v} role="radio" aria-checked={range === v} onClick={() => setRange(v)} className={clsx("rounded-full px-3.5 py-1.5 text-[13px] font-medium transition", range === v ? "bg-surface text-ink shadow-card" : "text-ink-2 hover:text-ink")}>
                {l}
              </button>
            ))}
          </div>
        </div>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
          {state.accounts.map((a) => (
            <Chip key={a.id} active={accountId === a.id} onClick={() => setAccountId(accountId === a.id ? null : a.id)}>
              <AccountBadge account={a} size={18} />
              {a.provider}
            </Chip>
          ))}
          <span className="mx-1 w-px shrink-0 bg-line" />
          {usedCats.map((c) => (
            <Chip
              key={c.id}
              active={catFilter === c.id}
              onClick={() => {
                const p = new URLSearchParams(params);
                if (catFilter === c.id) p.delete("category");
                else p.set("category", c.id);
                setParams(p, { replace: true });
              }}
            >
              {c.name}
            </Chip>
          ))}
        </div>
      </div>

      <Card className="overflow-hidden">
        {groups.length === 0 && <p className="px-6 py-16 text-center text-[14px] text-muted">לא נמצאו תנועות. נסו לשנות את הסינון.</p>}
        {groups.map(([date, txs]) => {
          const d = fromISO(date);
          const total = txs.filter((t) => category(t.categoryId).kind !== "transfer").reduce((a, t) => a + t.amount, 0);
          return (
            <div key={date} className="border-b border-line last:border-b-0">
              <div className="flex items-center justify-between px-6 pb-1 pt-4 text-[12.5px]">
                <span className="font-semibold text-ink-2">
                  {fmtWeekday(d)}, {fmtDate(d)}
                </span>
                <Money value={total} tone="plain" className="text-muted" />
              </div>
              <div className="px-3 pb-2">
                {txs.map((t) => (
                  <TransactionRow key={t.id} tx={t} onClick={() => setOpen(t)} />
                ))}
              </div>
            </div>
          );
        })}
      </Card>

      {open && <TxDrawer tx={state.transactions.find((t) => t.id === open.id)!} onClose={() => setOpen(null)} />}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={clsx(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-medium transition",
        active ? "border-brand bg-brand-soft text-brand" : "border-line bg-surface text-ink-2 hover:border-line-strong hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}

export function TxDrawer({ tx, onClose }: { tx: Transaction; onClose: () => void }) {
  const { state, category, account, recategorize } = useStore();
  const cat = category(tx.categoryId);
  const acc = account(tx.accountId);
  const options = state.categories.filter((c) => c.kind !== "transfer");

  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);

  return (
    <Portal>
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal aria-label={tx.merchant}>
      <button className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} aria-label="סגירה" />
      <div className="rise relative flex h-full w-full max-w-[420px] flex-col overflow-y-auto border-s border-line bg-surface p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <CategoryChip category={cat} size={52} />
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full text-ink-2 hover:bg-surface-2" aria-label="סגירה">
            <X size={18} />
          </button>
        </div>
        <h2 className="mt-4 text-[20px] font-bold text-ink">{tx.merchant}</h2>
        <p className="mt-1 text-[13.5px] text-ink-2">
          {fmtWeekday(fromISO(tx.date))}, {fmtDate(fromISO(tx.date))} · {acc.provider} {acc.mask}
        </p>
        <p className="mt-5 text-[38px] font-bold tracking-tight text-ink">
          <Money value={tx.amount} cents />
        </p>
        {tx.installments && (
          <div className="mt-4 rounded-2xl bg-surface-2 p-4 text-[13.5px] text-ink-2">
            תשלום {tx.installments.current} מתוך {tx.installments.total} · עסקה מקורית <span className="money font-semibold text-ink">{ils(tx.installments.originalAmount)}</span>
            <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-surface-3">
              <div className="h-full rounded-full bg-s1" style={{ width: `${(tx.installments.current / tx.installments.total) * 100}%` }} />
            </div>
          </div>
        )}

        <h3 className="mb-2 mt-7 text-[13px] font-semibold text-ink-2">קטגוריה</h3>
        <div className="grid grid-cols-2 gap-2">
          {options.map((c) => (
            <button
              key={c.id}
              onClick={() => recategorize(tx.id, c.id)}
              className={clsx(
                "flex items-center gap-2 rounded-xl border px-2.5 py-2 text-start text-[13px] font-medium transition",
                c.id === tx.categoryId ? "border-brand bg-brand-soft text-ink" : "border-line text-ink-2 hover:border-line-strong",
              )}
            >
              <CategoryChip category={c} size={26} />
              <span className="flex-1 truncate">{c.name}</span>
              {c.id === tx.categoryId && <Check size={15} className="text-brand" />}
            </button>
          ))}
        </div>
        <p className="mt-4 text-[12.5px] leading-relaxed text-muted">שינוי קטגוריה יילמד אוטומטית לתנועות הבאות מאותו בית עסק.</p>
      </div>
    </div>
    </Portal>
  );
}
