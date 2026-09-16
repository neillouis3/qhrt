# QHRT

Quantum Healing Therapy is a free, self-paced web app. It gives people a private place to notice how mind, body, and emotion show up together — through guided sessions, short practices, and a diary — without a waiting room or someone else’s timetable.

QHRT is educational and supportive. It is not a clinic, a diagnosis, a medical device, or a crisis line. If someone is in danger they should use local emergency services.

---

## Why it exists

A lot of people will not (or cannot) start with a therapist. They still need a calm way to look at sleep, tension, mood, and the stories they tell themselves.

QHRT’s job is to meet them where they are:

- Clear, guided work they can pause and resume
- No commute, no waiting room
- No pressure to finish on a schedule
- Information kept private and used only to run the product for them

The public mission is the same as the internal one: keep the sessions clear, the product quiet, and the data protected under Canadian privacy law (including PIPEDA).

---

## Who it is for

- People who want structured self-help they can do alone, in small pieces
- People who already have care and want something to practice between appointments
- Internally: content editors and admins who maintain programs, not a social network or a therapist marketplace

It is not for emergencies, not for treating a condition in the clinical sense, and not for dumping a social feed into someone’s healing time.

---

## How a person uses it

1. **Sign up** with email. Optional onboarding so the app knows what they are working with.
2. **Home** is the return point: a greeting, a light check-in, and ways into the rest of the app.
3. **Assessments** are structured questionnaires tied to a topic (sleep is the first full path).
4. **Sessions** are guided conversations: one prompt at a time, they can go back, they can stop.
5. **Journeys** are longer, phase-based programs (the therapeutic engine): a path through a domain rather than a single questionnaire.
6. **Diary** is theirs — notes, mood, a calendar of what they completed.
7. **Breathe** is a full-screen exercise they can do without the rest of the chrome.
8. **Settings** is name, appearance, sign out.

They own what they write. We store it so we can show it back to them. We do not sell it.

---

## What is in the product today

| Area | What it is |
| --- | --- |
| Public site | Landing, About, Contact, Privacy, Terms |
| Account | Sign up, log in, session, log out |
| Home | Greeting, check-in, focus areas, quick actions |
| Sessions | Start, resume, complete, delete guided conversations |
| Journeys | Multi-phase programs with an overview, then the work |
| Assessments | Condition-linked questionnaires |
| Diary | Daily notes, mood, history of completed work |
| Breathe | Timed inhale / exhale, no navbar |
| Admin | Users, content (models, prompts, journeys), analytics |

Content is meant to be curated in admin, not hardcoded in the UI. Sleep is the first knowledge model in the seed data. More programs are a product problem, not just a code problem.

---

## How it is built

| Layer | What we use |
| --- | --- |
| Runtime | Node.js 22 (see `.nvmrc`; `engines.node` is `>=22`) |
| App | Next.js 16 (App Router), React 19, TypeScript 5 |
| UI | HeroUI 3, Tailwind CSS 4, Hugeicons, Geist, next-themes (light/dark) |
| Auth & data | Supabase — Postgres, Auth, Row-Level Security |
| Rate limits | Upstash Redis when configured; in-memory fallback locally |
| Tooling | ESLint 9, Prettier, npm |

- **Who sees what:** members stay in the user app (`/home` and friends). Admins get `/dashboard`, users, content, analytics. Routing is enforced in `proxy.ts`.
- **Auth pages:** `/login` and `/signup` (not `/auth/...`).
- **Sessions vs journeys:** two engines. Conversations follow a knowledge model (prompts, dimensions, branching). Journeys follow a therapeutic protocol (phases, observations, completion rules).

If you are writing tasks, prefer user-visible behavior over stack trivia. Install and env details live in the repo README.

---

## Privacy and trust

We collect email, the name they give us, sign-in session, intake, session answers, diary, and progress they choose to save.

We use that to run the account and the product. Hosting and database providers store it so the app can run.

They can change their name in Settings, change password, download their data, delete their account, and delete sessions they do not want kept. Forgot password is available from the login page.

Always say, in product and in docs: **QHRT is not emergency care.**

---

## Team

- **Jack Ryan** — first intern; started the project
- **Neil Louise Castillon** — intern and lead on the web app

QHRT lives in this HQ space as the application + the task board. The public site is the product; this page is the internal brief.

---

## How we decide what to build next

The linked **QHRT Tasks** board is the backlog. Bias toward:

- A clear next step on Home (not five equal tools)
- More than one finished program people can complete
- Short practices for days they will not start a full session
- Trust features (password reset, export, delete) when we ask people to write private things
- Calm UI. If a feature makes the app louder, it is probably wrong for QHRT

Do not turn this into a social product. If we ever show “you are not the only one,” keep it anonymous and optional.

---

## One-line pitch

QHRT is a private, free, self-paced program for noticing mind, body, and emotion — guided sessions you can put down and pick up, not a replacement for care.
