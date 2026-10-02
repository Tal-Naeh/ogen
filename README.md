# עוגן (Ogen)

Hebrew-first personal finance web app: a cheaper, cleaner alternative to RiseUp.
Working name.

## Run

```sh
pnpm install
pnpm dev        # http://localhost:5173
pnpm build      # type-check + production bundle in dist/
```

## Routes

- `/` is the landing page with the waitlist and pricing test (monthly ₪9.90 / annual ₪99).
- `/app` is the product demo running on mock data.

## Waitlist

Production signups go to `api/waitlist.ts` (Vercel Function, fra1), which stores one **private**
JSON file per email in the Blob store `ogen-waitlist` (fra1). The file name is a hash of the
email, so signing up again updates the chosen plan instead of creating a duplicate. A hidden
honeypot field drops bots.

```sh
pnpm waitlist   # → waitlist.csv + counts by plan and by CTA
```

In `pnpm dev` there is no `/api`, so the form keeps signups in the browser only.
`VITE_WAITLIST_ENDPOINT` overrides the endpoint if you ever move off Vercel.

## Deploy

Deployable to Vercel as is (`vercel.json`: SPA rewrites, functions in fra1). Create a private Blob store, connect it to the project, then:

```sh
vercel deploy --prod
```

Fill in `DATA_OWNER` and `PRIVACY_CONTACT` in `src/pages/Privacy.tsx` before publishing.

## Structure

- `src/data/types.ts` is the domain model (accounts, transactions, recurring, budgets).
- `src/data/mock.ts` is a deterministic mock household (7 cycles of data). A real sync backend replaces it later.
- `src/lib/finance.ts` is the engine: salary-day cycles, "left to spend", forecasts, insights.
- `src/lib/store.tsx` holds app state plus local user edits (recategorization, budgets) in localStorage.
- `src/pages/*` contains the six screens; `src/components/charts/*` has the hand-built SVG charts (RTL time axis).

## Not built yet

- Real bank and credit-card data (licensed open-banking provider). See the regulatory notes.
- Auth, backend, persistence across devices.
- LLM-backed assistant. `pages/Assistant.tsx` is rule-based over the same data.
