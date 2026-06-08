# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # dev server (Vite)
npm run build     # tsc + vite build
npm run lint      # eslint
npm run preview   # preview production build
```

No test suite configured.

## Environment

Copy `.env.example` → `.env` and fill in:
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

## Architecture

**Stack:** React 19, Vite, TypeScript, Tailwind CSS v3, Radix UI primitives, TanStack Query v5, Zustand v5, Supabase (auth + DB), React Router v7, Recharts, React Hook Form + Zod.

**Layer structure:**

```
src/domain/       — pure TypeScript types only (no logic)
src/services/     — Supabase calls, one file per entity
src/hooks/        — React Query wrappers around services; mutations with toast + cache invalidation
src/stores/       — Zustand stores (auth, theme, filters, nav, hideValues)
src/lib/          — pure utilities (dateUtils, installmentUtils, invoiceUtils, supabase client)
src/components/   — ui/ (primitives) and features/<domain>/ (feature dialogs/panels)
src/pages/        — one component per route, composes feature components
supabase/migrations/ — SQL migrations applied in order
```

**Data flow:** `domain types → services → hooks → components`. Components never call services directly.

## Key Patterns

**Query keys** — all keyed by `userId` via `src/hooks/queryKeys.ts`. Always use these constants when invalidating.

**Transaction → Installments:** Creating a transaction also generates installments client-side via `generateInstallments()` (`lib/installmentUtils.ts`) and batch-inserts them. `credit_card` type generates N installments based on `total_installments`; `recurring`/`subscription` generates 12 months. Due dates for credit card installments use `card.due_day`.

**Recurring auto-extension:** `useEnsureRecurring` (called in `Layout`) checks on mount that each recurring transaction has installments at least 3 months ahead; extends by 12 months if not. Uses `createBatchSafe` (upsert with `ignoreDuplicates`) to avoid duplicates.

**Nav visibility:** `useNavStore` (persisted per-user in localStorage) controls which optional routes appear in the sidebar. Configurable from `ConfigurationsPage`. Always-visible: Dashboard, Configurações. Optional: Lançamentos, Loja de Veículos, Investimentos, Meus Bens.

**Hide values:** `useHideValuesStore` (persisted per-user) toggles monetary value visibility. All screens with monetary values must respect this — check `hideValues` from the store and render `••••` or similar when true.

**Both nav and hideValues stores** use a custom `userStorage` that keys localStorage by `userId`, so preferences are isolated per account and rehydrated via `useEffect` in `Layout` on user change.

**RLS:** Every Supabase table has Row Level Security with `user_id = auth.uid()`. All service methods pass `userId` explicitly but RLS is the authoritative guard.

**Supabase joins:** Services use PostgREST embedded selects (`transaction:transactions!inner(*, category:categories!inner(*), card:cards(*))`) to fetch related data in one query, then reshape into domain types in the hook.

## Routes

| Path | Page | Nav key |
|---|---|---|
| `/dashboard` | DashboardPage | always visible |
| `/lancamentos` | TransactionsPage | `lancamentos` |
| `/motos` | VehiclesPage | `motos` |
| `/investimentos` | InvestmentsPage | `investimentos` |
| `/bens` | AssetsPage | `bens` |
| `/configuracoes` | ConfigurationsPage | always visible |

## Database

Migrations in `supabase/migrations/`. Apply with `supabase db push` or via Supabase MCP. Core tables: `cards`, `categories`, `transactions`, `installments`, `invoices`, `vehicles`, `vehicle_sales`, `investment_snapshots`, `investment_assets`, `personal_assets`.

`installments` has a unique constraint on `(transaction_id, number)` — used by `createBatchSafe` upsert.
