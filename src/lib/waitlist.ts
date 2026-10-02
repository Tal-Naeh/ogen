// Waitlist signups. Production posts to the bundled Vercel Function (/api/waitlist, private
// Blob store). VITE_WAITLIST_ENDPOINT overrides it. In `pnpm dev` there is no /api, so signups
// are kept in this browser only.

export type Plan = "monthly" | "annual" | "undecided";

export interface Signup {
  email: string;
  plan: Plan;
  source: string; // which CTA on the page
  ts: string;
}

const ENDPOINT = (import.meta.env.VITE_WAITLIST_ENDPOINT as string | undefined) || (import.meta.env.PROD ? "/api/waitlist" : undefined);

export async function joinWaitlist(s: Omit<Signup, "ts">, honeypot = ""): Promise<void> {
  const body = { ...s, ts: new Date().toISOString(), company: honeypot };
  if (ENDPOINT) {
    const r = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
    });
    if (!r.ok) throw new Error(`waitlist ${r.status}`);
    return;
  }
  try {
    const list: Signup[] = JSON.parse(localStorage.getItem("ogen-waitlist") ?? "[]");
    list.push({ email: s.email, plan: s.plan, source: s.source, ts: body.ts });
    localStorage.setItem("ogen-waitlist", JSON.stringify(list));
  } catch {
    /* storage unavailable */
  }
}

export const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim());
