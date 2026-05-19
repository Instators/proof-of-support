# Proof-of-Support — Changes Applied

This document summarises every fix made to the original zip.

## ⚠️ Before you run anything

1. **Rotate your Supabase keys NOW.** Your previous `SUPABASE_SERVICE_ROLE_KEY`
   and `NEXT_PUBLIC_SUPABASE_ANON_KEY` were inside the zip you shared. The
   service role key bypasses every Row Level Security policy. Treat them as
   compromised:
   - Supabase Dashboard → Project Settings → API → Reset both keys.
2. **Re-create `.env.local`** locally by copying `.env.example` and filling in
   the new keys. `.env.local` was deliberately removed from this zip and is now
   correctly listed in `.gitignore`.
3. **Re-run the SQL schema.** The `badges` table changed (see below), so drop
   the old `badges` and `user_badges` tables and re-run `schema.sql`, or apply
   the schema fresh to a new Supabase project.
4. **Install fresh.** `package.json` changed and `package-lock.json` was
   regenerated:
   ```bash
   npm install
   npm run dev
   ```

## Critical fixes

| # | Issue | Fix |
|---|---|---|
| 1 | `.env.local` with real keys was in the zip | Deleted. Rotate your keys. |
| 2 | `.gitignore` was UTF-16 encoded, so git ignored none of it | Recreated as UTF-8 |
| 3 | Duplicate `Season` identifier — `next build` failed with TS2300 | Renamed interface to `SeasonRecord` in `lib/types.ts` |
| 4 | Garbage `{app/{api/{contributions,...}/` folder from a broken `mkdir` brace expansion | Deleted |
| 5 | `lib/supabase.ts` created an admin client at module top-level, crashing every client component on load | Split into `lib/supabase.ts` (anon, browser-safe) and `lib/supabase-admin.ts` (server-only) |
| 6 | `useUser.ts` imported `supabase` but never used it (triggered the crash above) | Removed the import |
| 7 | Admin API routes had **no authentication** — anyone could approve/reject contributions | Added ed25519 signature verification in `lib/admin-auth.ts`. Client signs `POS_ADMIN:<timestamp>` once per session (cached for 1h in `sessionStorage`); server verifies via `tweetnacl` + `bs58` |
| 8 | Badge awarding was broken: code used string IDs (`'genesis'`, `'signal-5'`) but schema declared `badge_id` as `UUID` → `invalid input syntax for type uuid` on every insert | Changed `badges.id` to `TEXT` (slug as primary key) and updated `user_badges.badge_id` to match |
| 9 | Rank query in `GET /api/user/[wallet]` was inside `Promise.all([...])` and referenced `userRes.data` before the promise resolved → everyone's rank computed against `total_points > 0` | Awaited the user query first, then `Promise.all` for the rest |
| 10 | Points awarded at submission, not on approval. Users could spam and still bank points until rejected | Moved `incrementUserPoints` / `updateStreak` / `checkAndAwardBadges` to the admin PATCH route when status transitions to `approved`. Approved-then-rejected deducts. Helpers extracted to `lib/rewards.ts` |

## Quality fixes

| # | Issue | Fix |
|---|---|---|
| 11 | `@solana/wallet-adapter-backpack` is officially deprecated | Removed from `package.json` and `WalletProvider.tsx`. Backpack now connects automatically via the Solana Wallet Standard |
| 12 | `WalletProvider.tsx` hardcoded `clusterApiUrl('devnet')` despite `NEXT_PUBLIC_SOLANA_NETWORK` existing in env | Reads the env var, falls back to devnet |
| 13 | `Buffer.from(sig).toString('base64')` used in a `'use client'` file | Replaced with browser-native `btoa(...)` |
| 14 | Upvotes were UI-only — no API endpoint, no persistence | Added `POST /api/contributions/[id]/upvote`, an `increment_contribution_upvotes` SQL RPC, and wired the button to call it with optimistic rollback on failure |
| 15 | `tailwind.config.ts` used CommonJS (`module.exports`) but had a `.ts` extension; also listed `pages/**/*` which doesn't exist | Renamed to `tailwind.config.js`, removed `pages/`, added `providers/` and `hooks/` |
| 16 | No `public/` folder | Created with `robots.txt` |
| 17 | `.single()` used where 0 rows is expected (duplicate-link check, username conflict check) | Switched to `.maybeSingle()` |
| 18 | `@types/react@18.3` + transitive `@types/react@19` from `react-native` (pulled in by `@solana-mobile/wallet-adapter-mobile`) caused `ConnectionProvider cannot be used as a JSX component` TS error | Pinned `@types/react` to `18.2.79` and added `overrides` in `package.json` to force the same version across all transitive deps |
| 19 | `.env.example` didn't document the server-side `ADMIN_WALLET` env var needed for the new admin auth | Updated with `ADMIN_WALLET` + comments explaining why it's separate from `NEXT_PUBLIC_ADMIN_WALLET` |

## New files

```
lib/supabase-admin.ts        Server-only Supabase admin client
lib/admin-auth.ts            Ed25519 signature verification for admin API
lib/rewards.ts               Server helpers: incrementUserPoints, updateStreak, checkAndAwardBadges
hooks/useAdminAuth.ts        Client-side: signs admin session, wraps fetch with auth headers
app/api/contributions/[id]/upvote/route.ts   Upvote endpoint
public/robots.txt
CHANGES.md                   This file
```

## Modified files

```
.env.example                 Documents ADMIN_WALLET (server)
.gitignore                   Now UTF-8, lists all env files
package.json                 Removed backpack, added tweetnacl + bs58 + server-only, pinned React types
package-lock.json            Regenerated
schema.sql                   badges.id is TEXT (slug as PK); added increment_contribution_upvotes RPC
tailwind.config.js           Renamed from .ts, cleaned content array
lib/types.ts                 Renamed second Season → SeasonRecord
lib/supabase.ts              Anon-only browser client now
hooks/useUser.ts             Removed unused supabase import
providers/WalletProvider.tsx Removed Backpack, reads network from env
app/page.tsx                 Canvas null narrowing fixed for closures
app/submit/page.tsx          Buffer → btoa
app/admin/page.tsx           Uses adminFetch from useAdminAuth
app/api/contributions/route.ts          Points no longer awarded on submit, .maybeSingle()
app/api/user/[wallet]/route.ts          Rank bug fixed, .maybeSingle()
app/api/admin/stats/route.ts            Requires admin auth
app/api/admin/contributions/route.ts    Requires admin auth
app/api/admin/contributions/[id]/route.ts   Requires admin auth, points awarded here
components/ContributionCard.tsx         Upvote button now persists
```

## Removed files / dirs

```
.env.local                          (secrets — DO NOT re-commit)
{app/{api/{contributions,...}/      (garbage from broken brace expansion)
```

## Verification

Before zipping I ran:

```
tsc --noEmit       # zero errors
next build         # 14 routes compiled successfully, no warnings
```
