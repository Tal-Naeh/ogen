// Export waitlist signups from the private Blob store to waitlist.csv (and a plan summary).
// Usage: pnpm waitlist   (pulls a fresh token with `vercel env pull`, deletes it afterwards)
// waitlist.csv holds personal data: it is written owner-only (0600) and is gitignored.
import { get, list } from "@vercel/blob";
import { chmodSync, writeFileSync } from "node:fs";

const rows = [];
let cursor;
do {
  const page = await list({ prefix: "waitlist/", cursor });
  for (const b of page.blobs) {
    const r = await get(b.pathname, { access: "private", useCache: false });
    if (r) rows.push(JSON.parse(await new Response(r.stream).text()));
  }
  cursor = page.cursor;
} while (cursor);

rows.sort((a, b) => a.ts.localeCompare(b.ts));
const esc = (v) => `"${String(v).replace(/"/g, '""')}"`;
writeFileSync("waitlist.csv", ["email,plan,source,signed_up_at", ...rows.map((r) => [r.email, r.plan, r.source, r.ts].map(esc).join(","))].join("\n") + "\n", { mode: 0o600 });
chmodSync("waitlist.csv", 0o600); // mode only applies on create; enforce it for an existing file too

const by = (k) => rows.reduce((m, r) => ((m[r[k]] = (m[r[k]] ?? 0) + 1), m), {});
console.log(`${rows.length} signups → waitlist.csv`);
console.log("by plan:  ", by("plan"));
console.log("by source:", by("source"));
