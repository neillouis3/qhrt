# QHRT Web App

A Next.js-based web application that provides guided mental health resources and self-paced therapeutic programs. QHRT supports users through condition selection, intake assessments, and structured therapeutic sessions powered by configurable knowledge models.

## Tech Stack

- **Runtime:** [Node.js](https://nodejs.org) 22 (`.nvmrc`; `engines.node` is `>=22`)
- **Framework:** [Next.js 16](https://nextjs.org) (App Router)
- **UI:** [React 19](https://react.dev/), [HeroUI 3](https://www.heroui.com), [Tailwind CSS 4](https://tailwindcss.com), [Hugeicons](https://hugeicons.com), [next-themes](https://github.com/pacocoursey/next-themes)
- **Language:** [TypeScript](https://www.typescriptlang.org/) 5
- **Auth & data:** [Supabase](https://supabase.com) (PostgreSQL, Auth, Row-Level Security)
- **Rate limiting:** [Upstash Redis](https://upstash.com) (optional; in-memory fallback locally)

## Prerequisites

- **Node.js 22** and **npm**
- A **Supabase** project with the database schema migrated (see `supabase/` for SQL migration files)

## Getting Started

### 1. Clone & install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env.local` and fill in your Supabase credentials:

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/public JWT key |
| `SUPABASE_SECRET_KEY` | Supabase service role key (server-side API routes) |
| `NEXT_PUBLIC_APP_ORIGIN` | *(Optional)* App origin for CSRF origin checks. Auto-derived from the request when unset. |
| `UPSTASH_REDIS_REST_URL` | *(Optional)* Upstash Redis URL for distributed rate limiting. An in-memory fallback is used when unset (single-process only). |
| `UPSTASH_REDIS_REST_TOKEN` | *(Optional)* Upstash Redis token, used with `UPSTASH_REDIS_REST_URL`. |

### 3. Set up the database

Run the SQL migration files in `supabase/` in order via the [Supabase SQL Editor](https://supabase.com/dashboard/project/_/sql):

```
supabase/000_user_roles_and_progress.sql
supabase/001_condition_library_schema.sql
supabase/002_content_layer_seed.sql
supabase/003_conversation_framework_schema.sql
supabase/004_sleep_knowledge_model_seed.sql
supabase/005_therapeutic_engine_schema.sql
supabase/006_body_composition_seed.sql
supabase/007_mood_logs_and_ratings.sql
supabase/008_diary_entries.sql
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Supabase Auth URLs (password reset)

In the [Supabase dashboard](https://supabase.com/dashboard) → **Authentication** → **URL Configuration**:

- **Site URL:** your app origin (e.g. `http://localhost:3000` locally, or the value of `NEXT_PUBLIC_APP_ORIGIN` in production).
- **Redirect URLs:** allow `{origin}/reset-password` for each environment (e.g. `http://localhost:3000/reset-password` and `https://your-domain.com/reset-password`).

Forgot-password emails use `redirectTo` = `{NEXT_PUBLIC_APP_ORIGIN or request origin}/reset-password`. If reset links fail or land on the wrong host, check these settings first.

## npm Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Build for production |
| `npm start` | Start the production server |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Auto-fix ESLint issues |
| `npm run format` | Format code with Prettier |
| `npm run format:check` | Check formatting without writing |

## Project Structure

```
├── app/                       # Next.js App Router pages & API routes
│   ├── (admin)/               # Admin dashboard, users, content, analytics
│   ├── (auth)/                # /login and /signup
│   ├── (user)/                # Home, sessions, journeys, diary, assessments, settings
│   └── api/                   # REST API routes (auth, admin, conversation, etc.)
├── components/                # Shared React components
│   ├── admin/                 # Admin-specific UI (sidebar, content tabs, search)
│   ├── conversation/          # Conversation & session UI
│   ├── therapeutic/           # Therapeutic engine UI
│   ├── LandingCta.tsx         # Client-side landing page CTA (session-aware)
│   └── ...                    # Navbar, Home, coaching audits, sessions, etc.
├── hooks/                     # Custom React hooks (useSession, useNavigationGuard)
├── lib/                       # Utilities & clients
│   ├── supabaseClient.ts      # Supabase client setup (anon + service role)
│   ├── adminAuth.ts           # Admin authentication helpers
│   ├── apiError.ts            # Safe error mapping for API responses (no message leaks)
│   ├── rateLimiter.ts         # Rate limiting (Upstash Redis or in-memory fallback)
│   ├── csrf.ts                # CSRF origin validation for mutating requests
│   ├── conversationEngine.ts  # Conversation logic
│   ├── therapeuticEngine.ts   # Therapeutic engine logic
│   └── types/                 # Shared TypeScript types (conversation, therapeutic engine)
├── proxy.ts                   # Auth/role routing proxy (middleware convention)
├── supabase/                  # Database migrations & seed data (000–008)
└── public/                    # Static assets
```

## Architecture Overview

### User Flow
1. **Landing** -> Unauthenticated users see a landing page; signed-in members go to `/home`, admins to `/dashboard`.
2. **Intake & Condition Selection** -> New users select conditions and complete an intake assessment.
3. **Sessions** -> Users engage with therapeutic sessions driven by knowledge models and the therapeutic engine.

### Admin Flow
1. **Dashboard** -> Overview stats (total users, completions, sessions).
2. **Users** -> View and manage user accounts and roles.
3. **Content** -> Manage conditions, categories, knowledge models, and therapeutic engines.
4. **Analytics** -> View usage and engagement analytics.

### Authentication
- Supabase Auth handles user sign-up, login, and session management.
- Roles (`admin`, `user`) are stored in a `user_roles` table and enforced via Row-Level Security policies.
- Server-side API routes use the Supabase service role key for admin operations.
- A routing proxy (`proxy.ts`) enforces route-level access: admin routes require the `admin` role, user routes redirect admins to the dashboard, and authenticated users are redirected away from auth pages.

## Security & Hardening

- **Rate limiting** — Auth endpoints (login, signup) and sensitive admin operations (e.g. password reset) are rate-limited via `lib/rateLimiter.ts`. Uses Upstash Redis when configured, otherwise an in-memory fallback (single-process only).
- **CSRF protection** — Mutating API requests are validated against the app origin (`lib/csrf.ts`).
- **Safe error handling** — API routes return generic error messages via `lib/apiError.ts`; full error details are logged server-side only and never exposed to clients.
- **Security headers** — Configured in `next.config.ts` for all routes.
- **Type safety** — Strict TypeScript with `noUncheckedIndexedAccess` enabled; shared domain types live in `lib/types/`.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS v4 Documentation](https://tailwindcss.com/docs)
