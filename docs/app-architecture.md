# TeamVYS App Architecture

Recommended split for one shared backend and two clients:

```text
teamvys/
  server/
    server.js              # Express API, Stripe secrets, Supabase service role
    routes/                # Later: payments.js, camps.js, coach.js, admin.js
    services/              # Later: stripeService.js, supabaseService.js
  app/                     # Expo Router screens for mobile and web
    (coach)/               # Trainer app screens
    (admin)/               # Admin app screens
    (parent)/              # Parent logged-in web/app screens
    krouzky/               # Public web route
  components/
  hooks/
  lib/
    api-client.ts          # Frontend JSON client for the Express API
  supabase/
    schema.sql             # Database schema and seed data
```

Data flow:

1. Expo or React web calls `lib/api-client.ts`.
2. `server/server.js` validates the request and talks to Stripe/Supabase.
3. Supabase stays the single database for parents, camps, trainers, attendance, purchases, and payouts.
4. Stripe secret keys and Supabase service-role keys never go into Expo. Only the backend reads them.

Local ports:

- Expo dev server: `8081`
- Express API: `3001`
- Expo web can call `http://localhost:3001`
- Android emulator usually needs `http://10.0.2.2:3001`
- Physical phone needs your computer LAN IP, for example `http://192.168.1.20:3001`

Run locally:

```bash
npm run dev:api
npm start
```