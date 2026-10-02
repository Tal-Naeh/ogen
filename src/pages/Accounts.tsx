import clsx from "clsx";
import { Lock, Plus, RefreshCw, ShieldCheck, Smartphone, X } from "lucide-react";
import { useState } from "react";
import { AccountBadge, Button, Card, CardHeader, PageHeader, Portal, StatusPill } from "../components/ui";
import type { Account } from "../data/types";
import { ils, relativeTime } from "../lib/format";
import { useStore } from "../lib/store";

const providers = [
  ["בנק הפועלים", "#e2001a"], ["בנק לאומי", "#0060a9"], ["דיסקונט", "#0a9b4b"], ["מזרחי טפחות", "#f58220"],
  ["הבינלאומי", "#003d7c"], ["בנק ירושלים", "#7a1e48"], ["One Zero", "#111111"], ["בנק יהב", "#00857c"],
  ["ישראכרט", "#00a0df"], ["Max", "#ff4f8b"], ["כאל", "#1f3a93"], ["אמריקן אקספרס", "#2e77bb"],
] as const;

export function Accounts() {
  const { state } = useStore();
  const [verify, setVerify] = useState<Account | null>(null);
  const [connect, setConnect] = useState(false);
  const banks = state.accounts.filter((a) => a.type === "bank");
  const cards = state.accounts.filter((a) => a.type === "card");
  const balance = banks.reduce((a, b) => a + (b.balance ?? 0), 0);

  return (
    <div className="rise">
      <PageHeader
        title="חשבונות וכרטיסים"
        subtitle={`יתרה בעו״ש: ${ils(balance)} · ${state.accounts.length} חשבונות מחוברים`}
        action={
          <Button onClick={() => setConnect(true)}>
            <Plus size={16} /> חיבור חשבון
          </Button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-12">
        <div className="space-y-5 lg:col-span-8">
          <AccountGroup title="חשבונות בנק" list={banks} onVerify={setVerify} />
          <AccountGroup title="כרטיסי אשראי" list={cards} onVerify={setVerify} />
        </div>
        <Card className="h-fit p-6 lg:col-span-4">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-soft text-brand">
            <ShieldCheck size={22} />
          </span>
          <h3 className="mt-4 text-[16px] font-semibold text-ink">הכסף שלכם, הפרטיות שלכם</h3>
          <ul className="mt-3 space-y-2.5 text-[13.5px] leading-relaxed text-ink-2">
            <li className="flex gap-2"><Lock size={15} className="mt-1 shrink-0 text-muted" /> גישת קריאה בלבד. אי אפשר להעביר כסף או לבצע פעולות.</li>
            <li className="flex gap-2"><Lock size={15} className="mt-1 shrink-0 text-muted" /> חיבור דרך ממשקי הבנקאות הפתוחה המוסדרים בישראל.</li>
            <li className="flex gap-2"><Lock size={15} className="mt-1 shrink-0 text-muted" /> המידע מוצפן, לא נמכר ולא משמש לפרסום. אפשר למחוק הכל בלחיצה.</li>
          </ul>
        </Card>
      </div>

      {verify && <OtpDialog account={verify} onClose={() => setVerify(null)} />}
      {connect && <ConnectDialog onClose={() => setConnect(false)} />}
    </div>
  );
}

function AccountGroup({ title, list, onVerify }: { title: string; list: Account[]; onVerify: (a: Account) => void }) {
  return (
    <Card>
      <CardHeader title={title} />
      <ul className="mt-2 px-3 pb-3">
        {list.map((a) => (
          <li key={a.id} className="flex flex-wrap items-center gap-4 rounded-2xl px-3 py-3.5 transition hover:bg-surface-2">
            <AccountBadge account={a} size={44} />
            <div className="min-w-[150px] flex-1">
              <p className="text-[15px] font-semibold text-ink">{a.provider}</p>
              <p className="text-[12.5px] text-muted">
                {a.label} · <span className="money">{a.mask}</span>
              </p>
            </div>
            <div className="text-end">
              {a.balance !== undefined && <p className="money tnum text-[16px] font-bold text-ink">{ils(a.balance)}</p>}
              <p className="text-[12px] text-muted">סונכרן {relativeTime(a.lastSync)}</p>
            </div>
            {a.status === "needs_action" ? (
              <button onClick={() => onVerify(a)} className="inline-flex items-center gap-1.5 rounded-full bg-critical-soft px-3 py-1.5 text-[12.5px] font-semibold text-critical-text transition hover:brightness-95">
                <Smartphone size={14} /> נדרש אימות
              </button>
            ) : (
              <StatusPill severity="ok">מחובר</StatusPill>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <Portal>
    <div className="fixed inset-0 z-50 grid place-items-center p-4" role="dialog" aria-modal aria-label={title}>
      <button className="absolute inset-0 bg-black/35 backdrop-blur-[2px]" onClick={onClose} aria-label="סגירה" />
      <div className="rise relative w-full max-w-[440px] rounded-3xl border border-line bg-surface p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[18px] font-bold text-ink">{title}</h2>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full text-ink-2 hover:bg-surface-2" aria-label="סגירה">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
    </Portal>
  );
}

function OtpDialog({ account, onClose }: { account: Account; onClose: () => void }) {
  const { verifyAccount } = useStore();
  const [code, setCode] = useState("");
  const [done, setDone] = useState(false);
  return (
    <Modal title={`אימות ${account.provider}`} onClose={onClose}>
      {done ? (
        <div className="py-6 text-center">
          <RefreshCw size={28} className="mx-auto animate-spin text-brand" />
          <p className="mt-4 text-[15px] font-semibold text-ink">מסנכרנים תנועות…</p>
          <p className="mt-1 text-[13px] text-ink-2">זה לוקח בדרך כלל פחות מדקה. אפשר לסגור את החלון.</p>
          <Button
            className="mt-5"
            onClick={() => {
              verifyAccount(account.id);
              onClose();
            }}
          >
            סגירה
          </Button>
        </div>
      ) : (
        <>
          <p className="text-[13.5px] leading-relaxed text-ink-2">שלחנו קוד חד־פעמי לטלפון המחובר לכרטיס {account.mask}. הקוד תקף ל־5 דקות.</p>
          <input
            autoFocus
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            className="money mt-5 h-14 w-full rounded-2xl border border-line bg-surface-2 text-center text-[26px] font-bold tracking-[0.5em] text-ink focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15"
            placeholder="••••••"
            aria-label="קוד אימות"
          />
          <Button className="mt-5 w-full" disabled={code.length !== 6} onClick={() => setDone(true)}>
            אימות וסנכרון
          </Button>
        </>
      )}
    </Modal>
  );
}

function ConnectDialog({ onClose }: { onClose: () => void }) {
  const [pick, setPick] = useState<string | null>(null);
  return (
    <Modal title="חיבור חשבון חדש" onClose={onClose}>
      <p className="text-[13.5px] text-ink-2">בחרו בנק או חברת כרטיסי אשראי:</p>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {providers.map(([name, color]) => (
          <button
            key={name}
            onClick={() => setPick(name)}
            className={clsx(
              "flex flex-col items-center gap-2 rounded-2xl border p-3 text-[12.5px] font-medium transition",
              pick === name ? "border-brand bg-brand-soft text-ink" : "border-line text-ink-2 hover:border-line-strong",
            )}
          >
            <span className="h-8 w-8 rounded-lg" style={{ background: color }} aria-hidden />
            {name}
          </button>
        ))}
      </div>
      <Button className="mt-5 w-full" onClick={onClose}>
        {pick ? `המשך ל${/^[\u0590-\u05FF]/.test(pick) ? "" : "־"}${pick}` : "בחרו בנק או כרטיס"}
      </Button>
    </Modal>
  );
}
