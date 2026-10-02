import clsx from "clsx";
import {
  ArrowLeft, BellRing, CalendarClock, Check, ChevronDown, CreditCard, Layers, Lock, MessageCircle, ShieldCheck, Sparkles, TrendingUp,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Logo } from "../components/Shell";
import { Hero as ProductHero } from "./Dashboard";
import { isValidEmail, joinWaitlist, type Plan } from "../lib/waitlist";
import { useTheme } from "../lib/store";

const PRICE_MONTHLY = 9.9;
const PRICE_ANNUAL = 99;

const providers = ["בנק הפועלים", "לאומי", "דיסקונט", "מזרחי טפחות", "הבינלאומי", "One Zero", "ישראכרט", "Max", "כאל", "אמריקן אקספרס"];

export function Landing() {
  useTheme(); // apply the saved theme on the landing page too
  const [plan, setPlan] = useState<Plan>("undecided");

  function choose(p: Plan) {
    setPlan(p);
    document.getElementById("join")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <div className="min-h-dvh overflow-x-hidden bg-page">
      <TopNav />

      {/* Hero */}
      <section className="relative">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-40 -z-0 h-[680px] bg-[radial-gradient(60%_60%_at_70%_20%,color-mix(in_oklab,var(--brand)_18%,transparent),transparent_70%),radial-gradient(40%_50%_at_15%_40%,color-mix(in_oklab,var(--series-1)_12%,transparent),transparent_70%)]" />
        <div className="relative mx-auto grid max-w-[1200px] items-center gap-12 px-4 pb-20 pt-12 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:pb-28 lg:pt-20">
          <div className="rise">
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-[13px] font-medium text-ink-2 shadow-card">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" /> בקרוב בישראל · נרשמים מקבלים חודש ראשון חינם
            </span>
            <h1 className="mt-6 text-[40px] font-semibold leading-[1.05] tracking-[-0.035em] text-ink sm:text-[56px]">
              סוף סוף יודעים
              <br />
              <span className="text-gradient">כמה באמת נשאר</span> החודש.
            </h1>
            <p className="mt-5 max-w-[540px] text-[18px] leading-relaxed text-ink-2">
              עוגן מרכז את כל חשבונות הבנק וכרטיסי האשראי במקום אחד, ומראה לכם כמה נשאר להוציא עד המשכורת הבאה. בלי אקסלים, בלי הפתעות,{" "}
              <span className="whitespace-nowrap">
                ב־<span className="money font-semibold text-ink">₪{PRICE_MONTHLY.toFixed(2)}</span> לחודש.
              </span>
            </p>
            <div className="mt-8 max-w-[520px]">
              <WaitlistForm plan={plan} source="hero" />
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13.5px] text-ink-2">
              <Link to="/app" className="inline-flex items-center gap-1 font-semibold text-brand hover:underline">
                לנסות את הדמו החי <ArrowLeft size={15} />
              </Link>
              <span className="inline-flex items-center gap-1.5"><Lock size={14} className="text-muted" /> גישת קריאה בלבד</span>
              <span className="inline-flex items-center gap-1.5"><Check size={14} className="text-muted" /> ביטול בכל רגע</span>
            </div>
          </div>

          <HeroVisual />
        </div>
      </section>

      {/* Providers strip */}
      <section className="border-y border-line bg-surface/60">
        <div className="mx-auto max-w-[1200px] px-4 py-7 sm:px-6">
          <p className="text-center text-[13px] text-muted">מתוכנן לעבוד עם הבנקים וחברות האשראי בישראל</p>
          <ul className="mt-4 flex flex-wrap justify-center gap-x-8 gap-y-3">
            {providers.map((p) => (
              <li key={p} className="text-[15px] font-semibold text-ink-2/80">{p}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-[1200px] scroll-mt-20 px-4 py-20 sm:px-6 lg:py-28">
        <SectionHead eyebrow="למה עוגן" title="כל מה שצריך כדי לסיים את החודש בפלוס" sub="לא עוד גרף יפה שמראה מה כבר קרה. עוגן מסתכל קדימה, ומתריע בזמן כדי שתספיקו לשנות." />
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Feature icon={<CalendarClock size={22} />} title="חודש שמתחיל במשכורת" body="המחזור שלכם מתחיל ביום שהמשכורת נכנסת, לא ב־1 לחודש. ככה ״נשאר להוציא״ מספר את האמת." />
          <Feature icon={<BellRing size={22} />} title="התרעה לפני חריגה, לא אחריה" body="אם אוכל בחוץ רץ מהר מהתכנון, תדעו כבר באמצע החודש, עם תחזית כמה זה יעלה עד הסוף." />
          <Feature icon={<TrendingUp size={22} />} title="ציד מנויים והתייקרויות" body="כל חיוב קבוע מזוהה אוטומטית. נטפליקס העלו מחיר? הסלולר התייקר? תראו את זה מיד, עם העלות השנתית." />
          <Feature icon={<Layers size={22} />} title="תשלומים ואשראי בלי כפילויות" body="עסקאות בתשלומים מוצגות כ״תשלום 4 מתוך 12״, וחיוב כרטיס האשראי בעו״ש לא נספר פעמיים." />
          <Feature icon={<MessageCircle size={22} />} title="עוזר שמדבר עברית" body="״אפשר להרשות לנו חופשה בדצמבר?״ שאלו בשפה פשוטה, וקבלו תשובה לפי הנתונים האמיתיים שלכם." />
          <Feature icon={<ShieldCheck size={22} />} title="פרטיות בלי אותיות קטנות" body="גישת קריאה בלבד, הצפנה מלאה, אפס פרסומות ואפס מכירת מידע. מוחקים הכל בלחיצה אחת." />
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="scroll-mt-20 bg-surface/60 py-20 lg:py-28">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
          <SectionHead eyebrow="איך זה עובד" title="שלוש דקות, ואתם מסודרים" />
          <ol className="mt-14 grid gap-5 md:grid-cols-3">
            {[
              ["מחברים חשבונות", "בוחרים בנק וכרטיסי אשראי ומאשרים גישת קריאה. אף אחד לא יכול להזיז שקל."],
              ["עוגן מסדר הכל", "כל תנועה מקוטלגת אוטומטית, חיובים קבועים מזוהים, והתקציב מוצע לפי שלושת החודשים האחרונים."],
              ["יודעים כל יום כמה נשאר", "מסך אחד עם המספר שחשוב: כמה נשאר להוציא עד המשכורת, וכמה זה ליום."],
            ].map(([t, b], i) => (
              <li key={t} className="rounded-[28px] border border-line bg-surface p-7 shadow-card">
                <span className="hero-card grid h-11 w-11 place-items-center rounded-2xl text-[18px] font-bold text-white">{i + 1}</span>
                <h3 className="mt-5 text-[18px] font-bold text-ink">{t}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{b}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <Pricing onChoose={choose} />
      <Faq />

      {/* Final CTA */}
      <section className="px-4 pb-20 sm:px-6 lg:pb-28">
        <div id="join" className="hero-card relative mx-auto max-w-[1000px] scroll-mt-24 overflow-hidden rounded-[32px] px-6 py-14 text-center text-white shadow-card sm:px-12 sm:py-16">
          <Sparkles size={28} className="mx-auto text-white" />
          <h2 className="mt-4 text-[30px] font-semibold tracking-tight sm:text-[40px]">מצטרפים עכשיו, משלמים פחות</h2>
          <p className="mx-auto mt-3 max-w-[520px] text-[16.5px] leading-relaxed text-white/80">
            נרשמים לרשימת ההמתנה ומקבלים גישה מוקדמת וחודש ראשון חינם. נעדכן רק כשנפתח, בלי ספאם.
          </p>
          <div className="mx-auto mt-8 max-w-[520px]">
            <WaitlistForm plan={plan} source="final" onDark />
          </div>
          {plan !== "undecided" && (
            <p className="mt-4 text-[13.5px] text-white/75">
              בחרתם במסלול {plan === "annual" ? "השנתי" : "החודשי"}. אפשר לשנות בהמשך.
            </p>
          )}
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-4 px-4 py-8 text-[13px] text-muted sm:px-6">
          <Logo />
          <p>© {new Date().getFullYear()} עוגן · כלי לניהול תקציב אישי, לא ייעוץ פיננסי</p>
        </div>
      </footer>
    </div>
  );
}

function TopNav() {
  const [pref, setPref] = useTheme();
  const dark = pref === "dark" || (pref === "system" && window.matchMedia?.("(prefers-color-scheme: dark)").matches);
  return (
    <header className="frost sticky top-0 z-40 border-b border-line">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-7 text-[14.5px] font-medium text-ink-2 md:flex" aria-label="ניווט">
          <a href="#features" className="hover:text-ink">יכולות</a>
          <a href="#how" className="hover:text-ink">איך זה עובד</a>
          <a href="#pricing" className="hover:text-ink">מחיר</a>
          <a href="#faq" className="hover:text-ink">שאלות</a>
        </nav>
        <div className="flex items-center gap-2">
          <button onClick={() => setPref(dark ? "light" : "dark")} className="hidden h-9 rounded-full px-3 text-[13px] font-medium text-ink-2 hover:bg-surface-2 hover:text-ink sm:block">
            {dark ? "מצב בהיר" : "מצב כהה"}
          </button>
          <Link to="/app" className="rounded-full px-3 py-2 text-[14px] font-semibold text-ink-2 hover:bg-surface-2 hover:text-ink">
            לדמו
          </Link>
          <a href="#join" className="rounded-full bg-brand px-4 py-2 text-[14px] font-semibold text-brand-ink transition hover:brightness-110">
            הצטרפות
          </a>
        </div>
      </div>
    </header>
  );
}

/** The real dashboard hero, running on the demo household, framed as a product shot. */
function HeroVisual() {
  return (
    <div className="rise relative mx-auto w-full max-w-[560px] lg:max-w-none" style={{ animationDelay: "120ms" }}>
      <div className="rounded-[30px] border border-line bg-surface/70 p-2.5 shadow-lift backdrop-blur">
        <div className="flex items-center gap-1.5 px-3 pb-2.5 pt-1" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full bg-surface-3" />
          <span className="h-2.5 w-2.5 rounded-full bg-surface-3" />
          <span className="h-2.5 w-2.5 rounded-full bg-surface-3" />
        </div>
        <div className="pointer-events-none select-none [&>section]:shadow-none" aria-hidden>
          <ProductHero />
        </div>
      </div>

      <FloatCard className="-bottom-8 start-[-12px] hidden sm:flex lg:start-[-36px]">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-warning-soft text-warning-text"><TrendingUp size={19} /></span>
        <span>
          <span className="block text-[13.5px] font-semibold text-ink">Netflix העלו את המחיר</span>
          <span className="block text-[12.5px] text-ink-2">עוד <span className="money">₪60</span> בשנה. לבדוק מסלול זול?</span>
        </span>
      </FloatCard>
      <FloatCard className="-top-6 end-[-8px] hidden sm:flex lg:end-[-28px]">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand"><CreditCard size={19} /></span>
        <span>
          <span className="block text-[13.5px] font-semibold text-ink">KSP · מחשב נייד</span>
          <span className="block text-[12.5px] text-ink-2">תשלום 4 מתוך 12</span>
        </span>
      </FloatCard>
    </div>
  );
}

function FloatCard({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={clsx("absolute z-10 items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3 shadow-card", className)} aria-hidden>
      {children}
    </div>
  );
}

function SectionHead({ eyebrow, title, sub }: { eyebrow: string; title: string; sub?: string }) {
  return (
    <div className="mx-auto max-w-[680px] text-center">
      <p className="text-[13.5px] font-semibold text-brand">{eyebrow}</p>
      <h2 className="mt-3 text-[30px] font-semibold leading-tight tracking-[-0.03em] text-ink sm:text-[40px]">{title}</h2>
      {sub && <p className="mt-4 text-[17px] leading-relaxed text-ink-2">{sub}</p>}
    </div>
  );
}

function Feature({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <article className="group rounded-[28px] border border-line bg-surface p-7 shadow-card transition hover:-translate-y-0.5 hover:border-line-strong">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-soft text-brand">{icon}</span>
      <h3 className="mt-5 text-[18px] font-bold text-ink">{title}</h3>
      <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{body}</p>
    </article>
  );
}

function Pricing({ onChoose }: { onChoose: (p: Plan) => void }) {
  const [annual, setAnnual] = useState(true);
  const perMonth = annual ? PRICE_ANNUAL / 12 : PRICE_MONTHLY;
  const included = [
    "חיבור כל הבנקים וכרטיסי האשראי",
    "״נשאר להוציא״ ותחזית יומית",
    "תקציב חכם והתרעות לפני חריגה",
    "זיהוי מנויים והתייקרויות",
    "עוזר אישי בעברית",
    "חשבון משותף לזוג, בלי תוספת",
  ];
  return (
    <section id="pricing" className="mx-auto max-w-[1200px] scroll-mt-20 px-4 py-20 sm:px-6 lg:py-28">
      <SectionHead eyebrow="מחיר" title="מסלול אחד. כל היכולות. מחיר הוגן." sub="בלי ״פרימיום״ נסתר ובלי חבילות. משלמים מעט, מקבלים הכל." />

      <div className="mt-10 flex justify-center">
        <div role="radiogroup" aria-label="תדירות תשלום" className="inline-flex rounded-full border border-line bg-surface-2 p-1">
          {[
            [false, "חודשי"],
            [true, "שנתי · חודשיים מתנה"],
          ].map(([v, l]) => (
            <button
              key={String(v)}
              role="radio"
              aria-checked={annual === v}
              onClick={() => setAnnual(v as boolean)}
              className={clsx("rounded-full px-4 py-2 text-[14px] font-semibold transition", annual === v ? "bg-surface text-ink shadow-card" : "text-ink-2 hover:text-ink")}
            >
              {l as string}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto mt-8 grid max-w-[880px] gap-5 md:grid-cols-[1.25fr_1fr]">
        <div className="relative rounded-[28px] border-2 border-brand bg-surface p-8 shadow-card">
          <span className="absolute -top-3 start-8 rounded-full bg-brand px-3 py-1 text-[12px] font-bold text-brand-ink">חודש ראשון חינם</span>
          <p className="text-[15px] font-semibold text-ink-2">עוגן</p>
          <p className="mt-2 flex items-baseline gap-2">
            <span className="money text-[52px] font-semibold leading-none tracking-tight text-ink">₪{perMonth.toFixed(2)}</span>
            <span className="text-[15px] text-muted">לחודש</span>
          </p>
          <p className="mt-2 text-[14px] text-ink-2">
            {annual ? <>חיוב שנתי של <span className="money font-semibold">₪{PRICE_ANNUAL}</span></> : "חיוב חודשי, ביטול בכל רגע"}
          </p>
          <ul className="mt-6 space-y-2.5">
            {included.map((x) => (
              <li key={x} className="flex items-center gap-2.5 text-[15px] text-ink">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-soft text-brand"><Check size={13} strokeWidth={3} /></span>
                {x}
              </li>
            ))}
          </ul>
          <button
            onClick={() => onChoose(annual ? "annual" : "monthly")}
            className="mt-8 w-full rounded-full bg-brand py-3 text-[15.5px] font-bold text-brand-ink transition hover:brightness-110 active:scale-[0.99]"
          >
            שמרו לי מקום במסלול ה{annual ? "שנתי" : "חודשי"}
          </button>
        </div>

        <div className="flex flex-col justify-center rounded-[28px] border border-line bg-surface-2 p-8">
          <p className="text-[15px] font-semibold text-ink-2">אפליקציות תקציב מוכרות</p>
          <p className="mt-2 flex items-baseline gap-2">
            <span className="money text-[40px] font-semibold leading-none tracking-tight text-muted line-through decoration-2">₪25</span>
            <span className="text-[15px] text-muted">לחודש, בערך</span>
          </p>
          <p className="mt-5 text-[15px] leading-relaxed text-ink-2">
            עם עוגן במסלול השנתי חוסכים בערך <span className="money font-bold text-ink">₪200</span> בשנה, ומקבלים חודש לפי משכורת, התרעות מוקדמות ועוזר בעברית.
          </p>
        </div>
      </div>
    </section>
  );
}

const faqs: [string, string][] = [
  ["זה בטוח לחבר את חשבון הבנק?", "עוגן מקבל גישת קריאה בלבד, כך שאי אפשר להעביר כסף או לבצע פעולות בחשבון. החיבור יתבצע דרך ממשקי הבנקאות הפתוחה המוסדרים בישראל, והמידע נשמר מוצפן."],
  ["אילו בנקים וכרטיסים נתמכים?", "המטרה היא לתמוך בכל הבנקים הגדולים ובחברות כרטיסי האשראי בישראל כבר בהשקה. נרשמים? ספרו לנו באיזה בנק אתם, וניתן לו עדיפות."],
  ["מה ההבדל בין ״נשאר להוציא״ ליתרה בבנק?", "היתרה לא יודעת מה עוד צפוי לרדת. ״נשאר להוציא״ לוקח את ההכנסות הצפויות, מוריד את כל החיובים הקבועים שעוד לא ירדו ואת החיסכון, ומראה כמה באמת פנוי עד המשכורת הבאה."],
  ["אפשר להשתמש בזוג?", "כן. חשבון אחד, שני משתמשים, אותו מחיר. כל אחד רואה את התמונה המלאה של משק הבית."],
  ["מתי זה יוצא, וכמה עולה?", `אנחנו בבנייה. המחיר בהשקה יהיה ₪${PRICE_MONTHLY.toFixed(2)} לחודש או ₪${PRICE_ANNUAL} לשנה, והנרשמים לרשימת ההמתנה יקבלו חודש ראשון חינם.`],
  ["אתם מוכרים את המידע שלי?", "לא, ולעולם לא. המודל העסקי שלנו פשוט: אתם משלמים מנוי, אנחנו עובדים בשבילכם. בלי פרסומות ובלי שותפים שמקבלים את הנתונים."],
];

function Faq() {
  return (
    <section id="faq" className="scroll-mt-20 bg-surface/60 py-20 lg:py-28">
      <div className="mx-auto max-w-[800px] px-4 sm:px-6">
        <SectionHead eyebrow="שאלות נפוצות" title="שאלתם, ענינו" />
        <div className="mt-12 space-y-3">
          {faqs.map(([q, a]) => (
            <details key={q} className="group rounded-2xl border border-line bg-surface px-6 py-5 shadow-card open:pb-6">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[16px] font-semibold text-ink [&::-webkit-details-marker]:hidden">
                {q}
                <ChevronDown size={18} className="shrink-0 text-muted transition group-open:rotate-180" />
              </summary>
              <p className="mt-3 text-[15px] leading-relaxed text-ink-2">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function WaitlistForm({ plan, source, onDark }: { plan: Plan; source: string; onDark?: boolean }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [touched, setTouched] = useState(false);
  const [company, setCompany] = useState(""); // honeypot, hidden from people
  const invalid = touched && !isValidEmail(email);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (!isValidEmail(email)) return;
    setState("sending");
    try {
      await joinWaitlist({ email: email.trim(), plan, source }, company);
      setState("done");
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <div className={clsx("flex items-center gap-3 rounded-2xl px-5 py-4 text-start", onDark ? "bg-white/10 text-white" : "border border-line bg-surface shadow-card")}>
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand text-brand-ink"><Check size={18} strokeWidth={3} /></span>
        <span>
          <span className={clsx("block text-[15px] font-semibold", onDark ? "text-white" : "text-ink")}>אתם ברשימה!</span>
          <span className={clsx("block text-[13.5px]", onDark ? "text-white/75" : "text-ink-2")}>נשלח מייל ל־{email.trim()} כשנפתח. החודש הראשון עלינו.</span>
        </span>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate>
      <div className={clsx("flex flex-col gap-2 rounded-[22px] p-1.5 sm:flex-row sm:rounded-full", onDark ? "bg-white/10" : "border border-line bg-surface shadow-card", invalid && "ring-2 ring-critical/60")}>
        <input
          type="text"
          name="company"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          className="absolute -start-[9999px] h-px w-px opacity-0"
        />
        <label className="sr-only" htmlFor={`email-${source}`}>כתובת מייל</label>
        <input
          id={`email-${source}`}
          type="email"
          dir="ltr"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => email && setTouched(true)}
          placeholder="you@example.com"
          aria-invalid={invalid}
          className={clsx(
            "h-12 min-w-0 flex-1 rounded-full bg-transparent px-5 text-end text-[15.5px] placeholder:text-end focus:outline-none",
            onDark ? "text-white placeholder:text-white/50" : "text-ink placeholder:text-muted",
          )}
        />
        <button
          type="submit"
          disabled={state === "sending"}
          className={clsx(
            "h-12 shrink-0 rounded-full px-6 text-[15px] font-bold transition hover:brightness-110 active:scale-[0.98] disabled:opacity-60",
            onDark ? "bg-white text-[#1d1d1f]" : "bg-brand text-brand-ink",
          )}
        >
          {state === "sending" ? "שולחים…" : "הצטרפו לרשימת ההמתנה"}
        </button>
      </div>
      <p className={clsx("mt-2.5 px-4 text-start text-[12px]", onDark ? "text-white/60" : "text-muted")}>
        נשתמש במייל רק כדי לעדכן על ההשקה. לא נעביר אותו לאף אחד, ואפשר להסיר בכל רגע.
      </p>
      {invalid && <p className={clsx("mt-2 px-4 text-start text-[13px]", onDark ? "text-[#ffb4b4]" : "text-critical-text")}>נראה שהמייל לא תקין</p>}
      {state === "error" && <p className={clsx("mt-2 px-4 text-start text-[13px]", onDark ? "text-[#ffb4b4]" : "text-critical-text")}>משהו השתבש. נסו שוב בעוד רגע.</p>}
    </form>
  );
}
