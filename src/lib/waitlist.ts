// Waitlist signups. Set VITE_WAITLIST_ENDPOINT to any endpoint accepting a JSON POST
// (Formspree, a Google Apps Script web app, your own API…). Without it, signups are kept
// in this browser only, so the page works locally but collects nothing real.

export type Plan = "monthly" | "annual" | "undecided";

export interface Signup {
  email: string;
  plan: Plan;
  source: string; // which CTA on the page
  ts: string;
}

const ENDPOINT = import.meta.env.VITE_WAITLIST_ENDPOINT as string | undefined;

export async function joinWaitlist(s: Omit<Signup, "ts">): Promise<void> {
  const body: Signup = { ...s, ts: new Date().toISOString() };
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
    const list: Signup[] = JSON.parse(localStorage.getItem("shefa-waitlist") ?? "[]");
    list.push(body);
    localStorage.setItem("shefa-waitlist", JSON.stringify(list));
  } catch {
    /* storage unavailable */
  }
}

export const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim());
