import clsx from "clsx";
import type { Transaction } from "../data/types";
import { useStore } from "../lib/store";
import { CategoryChip } from "./Icon";
import { AccountBadge, Money } from "./ui";

export function TransactionRow({ tx, onClick, compact }: { tx: Transaction; onClick?: () => void; compact?: boolean }) {
  const { category, account } = useStore();
  const cat = category(tx.categoryId);
  const acc = account(tx.accountId);
  const excluded = cat.kind === "transfer";
  return (
    <button
      onClick={onClick}
      className={clsx(
        "group flex w-full items-center gap-3.5 rounded-2xl px-3 py-2.5 text-start transition hover:bg-surface-2 focus-visible:bg-surface-2 focus-visible:outline-none",
        excluded && "opacity-60",
      )}
    >
      <CategoryChip category={cat} size={compact ? 36 : 40} />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-[14.5px] font-medium text-ink">{tx.merchant}</span>
          {tx.pending && <span className="shrink-0 rounded-full bg-surface-3 px-1.5 py-px text-[10.5px] font-medium text-ink-2">ממתין</span>}
        </span>
        <span className="mt-0.5 flex items-center gap-1.5 overflow-hidden whitespace-nowrap text-[12.5px] text-muted">
          <span>{cat.name}</span>
          {tx.installments && (
            <>
              <span aria-hidden>·</span>
              <span>
                תשלום {tx.installments.current} מתוך {tx.installments.total}
              </span>
            </>
          )}
          {excluded && (
            <>
              <span aria-hidden>·</span>
              <span>לא נספר כהוצאה</span>
            </>
          )}
          {!compact && (
            <span className="hidden min-w-0 items-center gap-1.5 sm:inline-flex">
              <span aria-hidden>·</span>
              <span className="truncate">
                {acc.provider} {acc.type === "card" ? acc.mask.replace("•••• ", "") : ""}
              </span>
            </span>
          )}
        </span>
      </span>
      {!compact && <AccountBadge account={acc} size={22} />}
      <Money value={tx.amount} cents className="shrink-0 text-[14.5px] font-semibold" />
    </button>
  );
}
