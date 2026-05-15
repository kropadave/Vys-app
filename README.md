# TeamVYS

Parkourová komunita s mobilní aplikací (Expo) a webem (Next.js). Jedna sdílená Supabase databáze.

## Struktura repa

```
Vys-app/
├── web/              Next.js 15 — public web + platby (rodič, admin)
│   └── Stripe Checkout, Supabase Auth, server actions
├── mobile/           Expo — mobilní app (účastník, trenér)
│   └── NFC docházka, skill tree, QR triky — bez plateb
├── shared/           Sdílený TypeScript kód (content, brand tokens, types)
├── server/           Express API (Stripe + Supabase service role) — používá mobile
├── supabase/         DB schéma + migrace + Edge functions
└── docs/             Dokumentace architektury
```

## Kdo se kde přihlašuje

| Role         | Web (Next.js)         | Mobile (Expo)             |
|--------------|------------------------|----------------------------|
| **Rodič**    | ✅ rezervace + platby Stripe  | ❌ pouze pohled na děti |
| **Admin**    | ✅ správa produktů, financí   | ❌                       |
| **Účastník** | ❌                            | ✅ skill tree, XP, triky |
| **Trenér**   | ❌                            | ✅ docházka, QR, svěřenci |

Důvod rozdělení: **App Store / Play Store** berou 30 % poplatek z in-app digital purchases. Stripe v EU bere ~1,4 % + 5 Kč. Platby tedy běží jen přes web.

## Rychlý start

```bash
# Instalace dependencies pro všechny projekty
npm run install:all

# Spustit web (Next.js, port 3000)
npm run web

# Spustit mobile (Expo, port 8081)
npm run mobile

# Spustit Express API (port 3001)
npm run server
```

## Sdílená databáze

Obě klientské aplikace (web i mobile) používají stejný Supabase projekt:

- **Web** se připojuje přímo přes `@supabase/ssr` (server components) a `@supabase/supabase-js` (client).
- **Mobile** se připojuje přes `@supabase/supabase-js` + `AsyncStorage` pro session.
- **Server** (`server/`) používá `SUPABASE_SERVICE_ROLE_KEY` pro admin operace (Stripe webhooks, payouts).

Schema migrace jsou v `supabase/migrations/`. Edge functions v `supabase/functions/`.

## Environmenty

`.env` soubory:
- `.env` — root (sdílené env vars)
- `web/.env.local` — Next.js public + server vars
- `mobile/.env` — Expo `EXPO_PUBLIC_*` proměnné
- `server/.env` — Stripe secret + Supabase service role

Vzorové soubory: `.env.example` (root), `web/.env.example`, `mobile/.env.example`, `server/.env.example`.
