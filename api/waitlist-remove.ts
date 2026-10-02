// Vercel Function: POST /api/waitlist-remove → deletes that email's signup, if any.
// Always answers the same way, so it can't be used to check who is on the list.
import { del } from "@vercel/blob";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

export async function POST(request: Request): Promise<Response> {
  if (Number(request.headers.get("content-length") ?? 0) > 1_024) return json(413, { error: "too large" });
  let data: Record<string, unknown>;
  try {
    data = await request.json();
  } catch {
    return json(400, { error: "invalid json" });
  }
  const email = typeof data.email === "string" ? data.email.trim().toLowerCase() : "";
  if (email.length > 254 || !EMAIL.test(email)) return json(400, { error: "invalid email" });

  // Same file name as api/waitlist.ts: first 32 hex chars of sha256(email).
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(email));
  const id = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 32);
  try {
    await del(`waitlist/${id}.json`);
  } catch {
    /* not on the list: same answer either way */
  }
  return json(200, { ok: true });
}
