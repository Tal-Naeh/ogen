# שפע (Shefa)

Hebrew-first personal finance web app: a cheaper, cleaner alternative to RiseUp.
Working name.

## Run

```sh
pnpm install
pnpm dev        # http://localhost:5173
pnpm build      # type-check + production bundle in dist/
```

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
