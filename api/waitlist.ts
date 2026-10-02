// Vercel Function: POST /api/waitlist → one private JSON blob per email.
// The file name is a hash of the email, so re-signing up updates the plan instead of duplicating.
import { put } from "@vercel/blob";

const PLANS = new Set(["monthly", "annual", "undecided"]);
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

export async function POST(request: Request): Promise<Response> {
  if (Number(request.headers.get("content-length") ?? 0) > 2_048) return json(413, { error: "too large" });

  let data: Record<string, unknown>;
  try {
    data = await request.json();
  } catch {
    return json(400, { error: "invalid json" });
  }

  // Honeypot: real visitors never fill the hidden "company" field. Pretend success for bots.
  if (typeof data.company === "string" && data.company.length > 0) return json(200, { ok: true });

  const email = typeof data.email === "string" ? data.email.trim().toLowerCase() : "";
  const plan = typeof data.plan === "string" && PLANS.has(data.plan) ? data.plan : "undecided";
  const source = typeof data.source === "string" ? data.source.slice(0, 32) : "unknown";
  if (email.length > 254 || !EMAIL.test(email)) return json(400, { error: "invalid email" });

  // Web Crypto (global in the runtime): no Node-only APIs, so no @types/node needed at build time.
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(email));
  const id = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 32);
  await put(`waitlist/${id}.json`, JSON.stringify({ email, plan, source, ts: new Date().toISOString() }), {
    access: "private",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
  });
  return json(200, { ok: true });
}
