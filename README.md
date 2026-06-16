# BetterReviews

A **photo-first local recommendation app** that helps people discover places
their friends — and people with similar taste — would actually recommend.

The core contribution is intentionally lightweight:

> Take/upload a photo → pick the place → answer **"Would you recommend this to a
> friend?"** → optionally tap a few reasons.

No long reviews. No public star ratings. The primary signal is a simple
**yes / maybe / no**, surfaced through a placeholder **match score** (the
foundation for a Netflix-style personalized score later).

The initial wedge is **restaurants in Munich**, but the data model is generic
enough for other local businesses.

---

## Architecture

A TypeScript monorepo using **npm workspaces**:

```txt
BetterReviews/
  apps/
    web/        # Vite + React + React Router client (web / mobile web)
    server/     # Express + pg + Zod API
  packages/
    shared/     # Shared TS types + the isolated v0 match-score function
  docker-compose.yml
  render.yaml
  .env.example
```

- **`packages/shared`** is the single source of truth for entity types,
  enumerated values, and `calculateMatchScore()`. Both apps import it.
- **`apps/server`** is a thin Express app: route → service → SQL via a `pg`
  pool. Request validation is Zod; errors flow through one error middleware.
- **`apps/web`** is a small React app — no heavy UI framework, just components,
  a fetch client, and responsive CSS.

| Layer    | Choice                                             |
| -------- | -------------------------------------------------- |
| Server   | Node, Express, TypeScript, `pg`, Zod, CORS, dotenv |
| Database | PostgreSQL (Docker locally, Supabase hosted)       |
| Client   | Vite, React, TypeScript, React Router              |
| Dev/Prod | Docker Compose locally, Render for deploy          |

---

## Quick start (Docker — recommended)

Requires Docker + Docker Compose.

```bash
cp .env.example .env
docker compose up --build
```

Then open:

- Web client → http://localhost:5173
- API health → http://localhost:4000/health

The server container applies the schema migration **and** the seed data
(idempotently) on startup, so a few Munich places appear immediately.

Stop and wipe the database volume with `docker compose down -v`.

---

## Quick start (without Docker)

Requires Node ≥ 20 and a local PostgreSQL you can point `DATABASE_URL` at.

```bash
npm install                 # installs all workspaces

# Configure env (see the .env.example files):
cp apps/server/.env.example apps/server/.env
cp apps/web/.env.example     apps/web/.env.local
# edit apps/server/.env so DATABASE_URL points at your Postgres

npm run db:reset            # runs migrations, then seeds
npm run dev                 # shared (watch) + server + web together
```

- Web → http://localhost:5173
- API → http://localhost:4000

`npm run dev` runs the shared package in watch mode and both apps via
`concurrently`. (A one-time `predev` build of `shared` runs automatically.)

### Useful scripts (run from the repo root)

| Command             | What it does                                        |
| ------------------- | --------------------------------------------------- |
| `npm run dev`       | Run shared + server + web in watch mode             |
| `npm run build`     | Build shared → server → web                         |
| `npm run typecheck` | Type-check every workspace                          |
| `npm run migrate`   | Apply pending SQL migrations                        |
| `npm run seed`      | Apply seed data (idempotent)                        |
| `npm run db:reset`  | `migrate` then `seed`                               |

---

## Environment variables

Examples live in `.env.example` (root, for Docker), `apps/server/.env.example`,
and `apps/web/.env.example`. Highlights:

| Variable                    | Where  | Purpose                                            |
| --------------------------- | ------ | -------------------------------------------------- |
| `DATABASE_URL`              | server | Postgres connection string                         |
| `PORT`                      | server | API port (default 4000)                            |
| `MOCK_USER_ID`              | server | **Local-only** mock auth user (the seeded user)    |
| `CORS_ORIGINS`              | server | Comma-separated allowed origins                    |
| `SUPABASE_URL` / keys       | both   | Hosted Supabase (auth/storage) — optional locally  |
| `VITE_API_BASE_URL`         | web    | Base URL the client calls                          |
| `VITE_MOCK_USER_ID`         | web    | Sent as `x-mock-user-id` so saves/recs are owned   |

**Never commit real secrets.** `.env` files are git-ignored.

---

## Database & migrations

- Schema: `apps/server/migrations/001_init_schema.sql` — applied in filename
  order by a tiny runner (`src/db/migrate.ts`) that records applied files in a
  `schema_migrations` table. Migrations use `CREATE … IF NOT EXISTS` and
  `CHECK` constraints (not enum types) so they re-run cleanly.
- Seed: `apps/server/seeds/001_seed.sql` — a test user, a second user, six
  Munich places, the predefined reason tags, plus sample recommendations and
  photos. Every insert is `ON CONFLICT DO NOTHING`, so seeding is idempotent.

Add a migration by dropping a new `NNN_name.sql` file in `migrations/` and
running `npm run migrate`.

---

## API overview

Base URL: `http://localhost:4000`

| Method | Path                          | Notes                                            |
| ------ | ----------------------------- | ------------------------------------------------ |
| GET    | `/health`                     | Server + DB health                               |
| GET    | `/places`                     | Discover list. Query: `city`, `category`, `search` |
| POST   | `/places`                     | Create a place                                   |
| GET    | `/places/:id`                 | Place detail + aggregate signal, photos, reasons |
| GET    | `/places/:id/recommendations` | Recommendations for a place                      |
| POST   | `/recommendations`            | Create/update your recommendation (auth)         |
| POST   | `/photos`                     | Store photo metadata (auth)                      |
| GET    | `/reason-tags`                | Predefined reason tags                           |
| POST   | `/places/:id/save`            | Save a place (auth)                              |
| DELETE | `/places/:id/save`            | Unsave a place (auth)                            |
| GET    | `/me/saves`                   | Your saved places (auth)                         |

`POST /recommendations` body:

```json
{
  "placeId": "11111111-1111-1111-1111-111111110001",
  "recommendationValue": "yes",
  "visibility": "friends",
  "reasonTagIds": ["22222222-2222-2222-2222-222222220001"]
}
```

### The match score (v0)

`calculateMatchScore()` (in `packages/shared`) is a deliberately simple
placeholder: `yes = 1`, `maybe = 0.4`, `no = 0`, averaged and ×100.

```json
{ "matchScore": 82, "label": "Recommended by people like you", "sampleSize": 9 }
```

It is **isolated on purpose** so it can be replaced with a real personalized
scorer (friend weighting, people-like-you similarity, KNN, taste profiles, …)
without touching the API or client.

---

## Authentication

- **Long term:** Supabase Auth. The server has a place to verify Supabase JWTs
  (`apps/server/src/middleware/auth.ts`) and a lazy Supabase client
  (`src/lib/supabase.ts`).
- **For now (local dev only):** mock auth. A request is treated as the user in
  the `x-mock-user-id` header, falling back to the `MOCK_USER_ID` env var. The
  web client sends `VITE_MOCK_USER_ID`. Mock auth is **disabled when
  `NODE_ENV=production`** — leave `MOCK_USER_ID` unset there.

---

## Deployment

### Render

`render.yaml` is a blueprint that provisions:

1. **`betterreviews-server`** — Node web service. `DATABASE_URL` is wired from
   the managed database; migrations run on each deploy; health check at
   `/health`. Set `CORS_ORIGINS` (your web URL) and any Supabase keys in the
   dashboard.
2. **`betterreviews-db`** — managed PostgreSQL.
3. **`betterreviews-web`** — static site from `apps/web/dist`. Set
   `VITE_API_BASE_URL` to the deployed API URL (Vite inlines it at build time)
   and a SPA rewrite to `index.html` is included.

You can also deploy the client to any static host (Netlify, Vercel,
Cloudflare Pages): `npm run build -w @betterreviews/web` → publish
`apps/web/dist`.

### Supabase

To use hosted Supabase instead of local Docker Postgres:

1. Create a Supabase project.
2. Copy the Postgres **connection string** → `DATABASE_URL` (migrations run
   against it just like local Postgres).
3. Add `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
4. **Auth (future):** wire JWT verification in `middleware/auth.ts`.
5. **Storage (future):** replace the URL-only photo flow with signed uploads —
   see the TODOs in `services/photoService.ts` and `lib/supabase.ts`.

---

## What is stubbed / mocked

- **Auth** — mock user header; no real Supabase JWT verification yet.
- **Photo upload** — metadata only (image URL or storage path). No binary
  upload / Supabase Storage pipeline yet.
- **Visibility** — `private` recommendations are hidden from others, but
  `friends` is not yet filtered by a real follow graph.
- **Match score** — aggregate-only placeholder, not personalized.

## Next steps

- Verify Supabase Auth JWTs and drop mock auth.
- Real photo uploads via Supabase Storage (signed URLs).
- Friend-graph-aware visibility and a "people like you" signal feeding the
  score.
- Map view + geo search using the stored lat/long.
- Tests (service + API), and CI.

## Non-goals for this first pass

Native iOS/Android apps, ML recommendations / KNN clustering, business
dashboards, paid features, review-dispute workflows, external scraping
(Google Maps / TripAdvisor / Reddit), and advanced moderation are intentionally
out of scope. TODOs mark where they'd hook in.
