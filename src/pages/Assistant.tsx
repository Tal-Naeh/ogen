import clsx from "clsx";
import { ArrowUp, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Card, Portal } from "../components/ui";
import { toISO } from "../lib/date";
import { summarize } from "../lib/finance";
import { ils } from "../lib/format";
import { useStore } from "../lib/store";

interface Msg {
  role: "user" | "assistant";
  text: string;
  bullets?: string[];
}

const suggestions = [
  "כמה הוצאנו על אוכל בחוץ החודש?",
  "איפה הוצאנו יותר מהחודש שעבר?",
  "אפשר להרשות לנו חופשה של ₪6,000 בדצמבר?",
  "אילו מנויים אפשר לבטל?",
];

// Rule-based answers over the user's own data. Swap for an LLM with tool calls later.
function useAnswer() {
  const { state, today, current, previous } = useStore();
  return (q: string): Msg => {
    const cats = state.categories;
    const by = (s: typeof current, id: string) => s.categories.find((c) => c.category.id === id)?.spent ?? 0;

    if (/מנוי|לבטל/.test(q)) {
      const subs = state.recurring.filter((r) => r.categoryId === "subscriptions").sort((a, b) => a.amount - b.amount);
      const total = subs.reduce((a, r) => a + Math.abs(r.amount) * 12, 0);
      return {
        role: "assistant",
        text: `יש לכם ${subs.length} מנויים שעולים יחד ${ils(total)} בשנה. אלה המועמדים הבולטים לבדיקה:`,
        bullets: subs.slice(0, 4).map((r) => `${r.merchant}: ${ils(Math.abs(r.amount), { cents: true })} לחודש (${ils(Math.abs(r.amount) * 12)} בשנה)${r.previousAmount ? ", התייקר לאחרונה" : ""}`),
      };
    }
    if (/חופשה|להרשות|לחסוך/.test(q)) {
      const amount = Number((q.match(/[\d,]+/)?.[0] ?? "6000").replace(/,/g, "")) || 6000;
      const avgSurplus = [-1, -2, -3].map((o) => summarize(state, today, o).leftToSpend).reduce((a, b) => a + b, 0) / 3;
      const months = 2;
      const ok = avgSurplus * months + Math.max(0, current.projectedSurplus) >= amount;
      return {
        role: "assistant",
        text: ok
          ? `כן, נראה שזה אפשרי. בשלושת המחזורים האחרונים נשארו לכם בממוצע ${ils(avgSurplus)} בסוף כל מחזור, והמחזור הנוכחי צפוי להסתיים עם עודף של ${ils(current.projectedSurplus)}.`
          : `זה יהיה צפוף. בממוצע נשארים לכם ${ils(avgSurplus)} בסוף מחזור, אז עד דצמבר תצברו בערך ${ils(avgSurplus * months)}.`,
        bullets: [
          `הפרישו ${ils(Math.ceil(amount / (months + 1) / 50) * 50)} מכל מחזור עד דצמבר`,
          `צמצום אוכל בחוץ לרמה של החודש שעבר יפנה עוד כ־${ils(Math.max(0, by(current, "dining") - by(previous, "dining")))}`,
        ],
      };
    }
    if (/יותר|השוואה|עלה/.test(q)) {
      const deltas = current.categories
        .map((x) => {
          const prevPace = (by(previous, x.category.id) * (current.dayIndex + 1)) / previous.cycle.days;
          return { name: x.category.name, d: x.spent - prevPace };
        })
        .filter((x) => x.d > 50)
        .sort((a, b) => b.d - a.d);
      return {
        role: "assistant",
        text: deltas.length ? "בהשוואה לאותה נקודה במחזור הקודם, אלה הקטגוריות שעלו:" : "אתם מוציאים פחות או באותו קצב כמו במחזור הקודם בכל הקטגוריות. כל הכבוד!",
        bullets: deltas.slice(0, 4).map((x) => `${x.name}: ${ils(x.d)} יותר`),
      };
    }
    const cat = cats.find((c) => q.includes(c.name) || (c.id === "dining" && /אוכל|מסעד|וולט|wolt/i.test(q)) || (c.id === "groceries" && /סופר|קניות אוכל/.test(q)));
    if (cat) {
      const txs = state.transactions.filter((t) => t.categoryId === cat.id && t.date >= toISO(current.cycle.start));
      const top = new Map<string, number>();
      for (const t of txs) top.set(t.merchant, (top.get(t.merchant) ?? 0) - t.amount);
      const now = by(current, cat.id);
      const prev = by(previous, cat.id);
      return {
        role: "assistant",
        text: `במחזור הנוכחי הוצאתם ${ils(now)} על ${cat.name}, ב־${txs.length} תנועות. במחזור הקודם, כולו, זה היה ${ils(prev)}.`,
        bullets: [...top.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([m, v]) => `${m}: ${ils(v)}`),
      };
    }
    return {
      role: "assistant",
      text: `כרגע נשארו לכם ${ils(current.leftToSpend)} להוציא עד סוף המחזור, כ־${ils(current.dailyAllowance)} ליום. אפשר לשאול אותי על קטגוריה, מנויים, השוואה לחודש קודם או תכנון הוצאה גדולה.`,
    };
  };
}

export function Assistant() {
  const answer = useAnswer();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs, typing]);

  function ask(q: string) {
    if (!q.trim() || typing) return;
    setMsgs((m) => [...m, { role: "user", text: q }]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      setMsgs((m) => [...m, answer(q)]);
      setTyping(false);
    }, 650);
  }

  return (
    <div className="rise mx-auto flex max-w-[760px] flex-col">
      {msgs.length === 0 && (
        <div className="pb-8 pt-6 text-center sm:pt-12">
          <span className="hero-card mx-auto grid h-14 w-14 place-items-center rounded-2xl text-white shadow-card">
            <Sparkles size={26} />
          </span>
          <h1 className="mt-5 text-[28px] font-bold tracking-tight text-ink">מה תרצו לדעת על הכסף שלכם?</h1>
          <p className="mt-2 text-[14.5px] text-ink-2">העוזר רואה את כל התנועות, התקציבים והחיובים הקבועים, ועונה בעברית פשוטה.</p>
          <div className="mt-8 grid gap-2.5 sm:grid-cols-2">
            {suggestions.map((s) => (
              <button key={s} onClick={() => ask(s)} className="rounded-2xl border border-line bg-surface p-4 text-start text-[14px] font-medium text-ink shadow-card transition hover:-translate-y-0.5 hover:border-line-strong">
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4 pb-36">
        {msgs.map((m, i) => (
          <div key={i} className={clsx("flex", m.role === "user" ? "justify-start" : "justify-end")}>
            {m.role === "user" ? (
              <p className="max-w-[85%] rounded-3xl rounded-ss-md bg-brand px-4 py-2.5 text-[14.5px] text-brand-ink">{m.text}</p>
            ) : (
              <Card className="rise max-w-[90%] rounded-ee-md px-5 py-4" as="div">
                <p className="text-[14.5px] leading-relaxed text-ink">{m.text}</p>
                {m.bullets && m.bullets.length > 0 && (
                  <ul className="mt-3 space-y-1.5">
                    {m.bullets.map((b) => (
                      <li key={b} className="flex gap-2 text-[14px] text-ink-2">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                        {b}
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            )}
          </div>
        ))}
        {typing && (
          <div className="flex justify-end">
            <Card className="flex gap-1.5 rounded-ee-md px-5 py-4" as="div">
              {[0, 1, 2].map((d) => (
                <span key={d} className="h-2 w-2 animate-bounce rounded-full bg-muted" style={{ animationDelay: `${d * 120}ms` }} />
              ))}
            </Card>
          </div>
        )}
        <div ref={end} />
      </div>

      <Portal>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
        className="fixed inset-x-0 bottom-[68px] z-30 px-4 lg:bottom-6 lg:start-[248px]"
      >
        <div className="mx-auto flex max-w-[760px] items-center gap-2 rounded-full border border-line bg-surface p-1.5 shadow-card">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="שאלו כל דבר, למשל: כמה הוצאנו על דלק?"
            className="h-11 flex-1 bg-transparent px-4 text-[14.5px] text-ink placeholder:text-muted focus:outline-none"
            aria-label="שאלה לעוזר"
          />
          <button type="submit" disabled={!input.trim()} aria-label="שליחה" className="grid h-11 w-11 place-items-center rounded-full bg-brand text-brand-ink transition disabled:opacity-40">
            <ArrowUp size={19} />
          </button>
        </div>
      </form>
      </Portal>
    </div>
  );
}
