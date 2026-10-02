import { Check } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Logo } from "../components/Shell";
import { Card } from "../components/ui";
import { useTheme } from "../lib/store";
import { isValidEmail } from "../lib/waitlist";

// Who answers for this data. Filled in by the owner before the page is published.
export const DATA_OWNER = ""; // set before publishing the page
export const PRIVACY_CONTACT = ""; // set before publishing the page
const UPDATED = "2 באוקטובר 2026";

export function Privacy() {
  useTheme();
  const { hash } = useLocation();
  useEffect(() => {
    // In-app links to /privacy#remove don't scroll by themselves.
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ block: "start" });
    else window.scrollTo({ top: 0 });
  }, [hash]);
  return (
    <div className="min-h-dvh bg-page">
      <header className="frost sticky top-0 z-40 border-b border-line">
        <div className="mx-auto flex h-16 max-w-[800px] items-center justify-between px-4 sm:px-6">
          <Link to="/" aria-label="לדף הבית">
            <Logo />
          </Link>
          <Link to="/" className="text-[14px] font-medium text-brand hover:underline">
            חזרה לדף הבית
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[800px] px-4 pb-20 pt-10 sm:px-6">
        <h1 className="text-[32px] font-semibold tracking-[-0.025em] text-ink sm:text-[40px]">מדיניות פרטיות</h1>
        <p className="mt-2 text-[14px] text-muted">עודכן לאחרונה: {UPDATED}</p>
        <p className="mt-6 text-[17px] leading-relaxed text-ink-2">
          עוגן נמצא כרגע בשלבי פיתוח. בעמוד הזה מוסבר בפשטות איזה מידע נאסף כשנרשמים לרשימת ההמתנה, מה עושים איתו, ואיך מסירים אותו.
        </p>

        <div className="mt-10 space-y-8">
          <Section title="מי אחראי על המידע">
            בעל המאגר והאחראי על המידע: <bdi>{DATA_OWNER || "[להשלמה]"}</bdi>. לכל שאלה או בקשה בנושא פרטיות אפשר לפנות אל{" "}
            {PRIVACY_CONTACT ? (
              <a href={`mailto:${PRIVACY_CONTACT}`} className="font-medium text-brand hover:underline" dir="ltr">
                {PRIVACY_CONTACT}
              </a>
            ) : (
              "[להשלמה]"
            )}
            .
          </Section>

          <Section title="איזה מידע נאסף">
            כשנרשמים לרשימת ההמתנה נשמרים ארבעה פרטים בלבד: כתובת המייל, המסלול שבחרתם (אם בחרתם), הכפתור שדרכו נרשמתם, ומועד ההרשמה. איננו אוספים שם, מספר טלפון או מידע פיננסי כלשהו. ספק האחסון עשוי
            לרשום באופן זמני נתונים טכניים, כמו כתובת IP, לצורכי אבטחה ותפעול.
          </Section>

          <Section title="למה המידע נאסף">
            כדי לעדכן אתכם כשעוגן יושק, וכדי להבין איזה מסלול מחיר מעניין את הנרשמים. לא נשתמש במידע לשום מטרה אחרת, ולא נשלח לכם פרסומות של אחרים.
          </Section>

          <Section title="האם חובה למסור את המידע">
            לא. אין חובה חוקית למסור את כתובת המייל, וההרשמה נעשית מרצונכם. בלי כתובת מייל פשוט לא נוכל לעדכן אתכם על ההשקה.
          </Section>

          <Section title="למי המידע מועבר">
            איננו מוכרים את המידע ואיננו מעבירים אותו לאף אחד. המידע מאוחסן אצל ספק התשתית <bdi>Vercel Inc.</bdi>, בשרתים שנמצאים בפרנקפורט שבגרמניה (האיחוד האירופי). Vercel משמשת אותנו לאחסון בלבד, ואינה משתמשת במידע למטרות
            משלה.
          </Section>

          <Section title="איך המידע מאובטח">
            ההרשמה עוברת בחיבור מוצפן (HTTPS). המידע נשמר באחסון פרטי שאין אליו כתובת ציבורית, והגישה אליו מוגבלת למנהלי השירות בלבד.
          </Section>

          <Section title="כמה זמן המידע נשמר">
            עד שתבקשו להסיר אותו, ולכל היותר 12 חודשים מיום ההשקה. כתובות שלא יהיה בהן עוד צורך יימחקו.
          </Section>

          <Section title="הזכויות שלכם">
            לפי חוק הגנת הפרטיות, מותר לכם לעיין במידע שנשמר עליכם, לבקש לתקן אותו ולבקש למחוק אותו. הסרה מהרשימה אפשר לעשות מיד בטופס כאן למטה. לעיון במידע או לתיקונו, פנו אלינו בכתובת שמופיעה למעלה.
          </Section>

          <Section title="שינויים במדיניות">אם נשנה את המדיניות, נעדכן את העמוד הזה ואת תאריך העדכון שבראשו.</Section>
        </div>

        <RemoveForm />
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-[19px] font-semibold text-ink">{title}</h2>
      <p className="mt-2 text-[16px] leading-relaxed text-ink-2">{children}</p>
    </section>
  );
}

function RemoveForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error" | "invalid">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidEmail(email)) return setState("invalid");
    setState("sending");
    try {
      const r = await fetch("/api/waitlist-remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      setState(r.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  }

  return (
    <Card className="mt-12 p-6 sm:p-8" as="div">
      <h2 id="remove" className="scroll-mt-24 text-[19px] font-semibold text-ink">
        הסרה מרשימת ההמתנה
      </h2>
      {state === "done" ? (
        <p className="mt-4 flex items-center gap-2 text-[15px] text-ink-2">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-good-soft text-good-text">
            <Check size={15} strokeWidth={3} />
          </span>
          אם הכתובת הייתה ברשימה, היא נמחקה.
        </p>
      ) : (
        <form onSubmit={submit} noValidate className="mt-4">
          <p className="mb-4 text-[15px] text-ink-2">הקלידו את כתובת המייל שנרשמתם איתה, והיא תימחק מהרשימה מיד.</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="sr-only" htmlFor="remove-email">
              כתובת מייל
            </label>
            <input
              id="remove-email"
              type="email"
              dir="ltr"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (state === "invalid") setState("idle");
              }}
              placeholder="you@example.com"
              className="h-12 min-w-0 flex-1 rounded-full border border-line bg-surface px-5 text-end text-[15.5px] text-ink placeholder:text-end placeholder:text-muted focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15"
            />
            <button
              type="submit"
              disabled={state === "sending"}
              className="h-12 shrink-0 rounded-full bg-surface-2 px-6 text-[15px] font-semibold text-ink transition hover:bg-surface-3 disabled:opacity-60"
            >
              {state === "sending" ? "מוחקים…" : "הסרה מהרשימה"}
            </button>
          </div>
          {state === "invalid" && <p className="mt-2 px-4 text-[13px] text-critical-text">כתובת המייל לא נראית תקינה</p>}
          {state === "error" && <p className="mt-2 px-4 text-[13px] text-critical-text">משהו השתבש. נסו שוב בעוד רגע.</p>}
        </form>
      )}
    </Card>
  );
}
