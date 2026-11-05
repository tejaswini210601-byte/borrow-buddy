# Borrow Buddy

**Borrow more. Buy less. Share better.**

Borrow Buddy is a community borrowing and lending platform. People list things they rarely use, neighbours find them, request to borrow them for specific dates, and both sides track the item until it's returned.

> 🚧 **Status:** Phases 1–3 complete (foundation, public pages, database). See [Roadmap](#roadmap).

---

## Tech stack

| Layer | Tool | Why |
| --- | --- | --- |
| Framework | [Next.js 16](https://nextjs.org) (App Router) + TypeScript | Frontend and backend in one project; TypeScript catches mistakes before the code runs |
| Styling | Tailwind CSS 4 + shadcn/ui-style components (Radix UI) | Fast, consistent styling; Radix handles accessibility (keyboard, screen readers) |
| Icons | Lucide | Clean, consistent icon set |
| Database | PostgreSQL via [Supabase](https://supabase.com) | Real relational database with built-in security rules (RLS) |
| Auth | Supabase Auth | Email + password sign-up, login, password reset |
| Images | Supabase Storage | Item and profile photos |
| Validation | Zod | Checks all form data on the server |
| Hosting | [Vercel](https://vercel.com) | Made by the Next.js team; free tier |

## How it fits together

```
Browser ──► Next.js on Vercel ──► Supabase
            │                     ├─ Postgres database (+ Row Level Security)
            │                     ├─ Auth (logins)
            │                     └─ Storage (photos)
            └─ src/proxy.ts runs first on every request:
               refreshes the login session, guards private pages
```

Most pages are **Server Components**: they run on the server, read the database directly, and send finished HTML to the browser. Forms use **Server Actions**, functions that run on the server when a form is submitted, so secret logic and validation never live in the browser.

## Project structure

```
borrow-buddy/
├── src/
│   ├── app/                  # Pages. Each folder = a URL (app/explore → /explore)
│   │   ├── layout.tsx        # Wraps every page (fonts, toasts, skip link)
│   │   ├── page.tsx          # Home page
│   │   └── globals.css       # Design tokens: brand colours, fonts, type scale
│   ├── components/
│   │   ├── ui/               # Generic building blocks (Button, Input, Dialog…)
│   │   ├── brand/            # Logo and the LendingTag motif
│   │   └── shared/           # Empty and error states
│   ├── lib/
│   │   ├── supabase/         # Database connection helpers (browser, server, proxy)
│   │   ├── constants.ts      # Categories, conditions, request statuses
│   │   └── utils.ts          # Small helpers (cn for class names)
│   └── proxy.ts              # Runs before each request (session + route guard)
├── supabase/
│   ├── migrations/           # Database schema, security and workflow as SQL
│   ├── setup.sql             # All migrations in one file (for the SQL Editor)
│   └── tests/                # Database security tests (npm run test:db)
├── .env.example              # Template for your secret settings
└── components.json           # shadcn/ui config (lets `npx shadcn add` work)
```

## Getting started (local development)

**Requirements:** [Node.js 20.9+](https://nodejs.org) and Git.

```bash
git clone https://github.com/tejaswini210601-byte/borrow-buddy.git
cd borrow-buddy
npm install
cp .env.example .env.local   # then fill in your Supabase values (below)
npm run dev
```

Open http://localhost:3000.

The public pages work before Supabase is set up. Login and data features need the steps below.

### Environment variables

| Variable | Where to find it |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase dashboard → Project Settings → Data API → Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Project Settings → API Keys → Publishable key (`sb_publishable_…`) |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` locally; your Vercel URL in production |

`.env.local` is git-ignored, so it never reaches GitHub. Never put the Supabase **secret / service_role** key in this app.

### Supabase setup & database migrations

1. Create a free project at [supabase.com](https://supabase.com) (region: **North EU (Stockholm)**).
2. **Create the database:** open **SQL Editor → New query**, paste the whole of [`supabase/setup.sql`](supabase/setup.sql) and click **Run**. This creates all tables, security rules, workflow functions and photo buckets.
3. **Auth settings:** **Authentication → URL Configuration**
   - *Site URL:* your live site, e.g. `https://borrow-buddy.vercel.app`
   - *Redirect URLs:* add `http://localhost:3000/**` and `https://*.vercel.app/**`
4. Copy the **Project URL** and **Publishable key** into `.env.local` (locally) and into **Vercel → Project → Settings → Environment Variables** (live site), then redeploy.
5. *Optional:* daily "due back tomorrow" reminders. Enable the `pg_cron` extension, then run [`supabase/optional/schedule_reminders.sql`](supabase/optional/schedule_reminders.sql).

**How the database is organised** (`supabase/migrations/`, run in order):

| Migration | What it does |
| --- | --- |
| `…_schema.sql` | 8 tables (`profiles`, `items`, `item_images`, `borrowing_requests`, `borrowings`, `notifications`, `reviews`, `reports`), constraints, indexes, auto-created profiles on sign-up |
| `…_security.sql` | Column grants and Row Level Security policies for every table |
| `…_workflow.sql` | Borrowing workflow functions (request → approve/reject → return → complete → review) and notifications |
| `…_storage.sql` | Photo buckets; members can only upload into their own folder |

Key safety rules, enforced by Postgres itself:
- An item can never be lent twice for overlapping dates (exclusion constraint).
- Requests, loans and reviews can only be changed through the workflow functions, which check who is calling.
- People see only their own requests, loans, notifications and reports. Email addresses stay in Supabase Auth and are never public.
- Members can't make themselves moderators or mark listings as samples.

After changing a migration, run `npm run db:bundle` to regenerate `supabase/setup.sql`.

### Testing the database

```bash
npm run test:db
```

Runs every migration on an in-memory Postgres ([PGlite](https://pglite.dev)) and runs 61 checks as different users: visitors, borrowers, lenders and moderators. It covers both what each person may do and what must be refused.

### Deployment (Vercel)

_Added in Phase 7._

## Useful commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server with live reload |
| `npm run build` | Production build (also type-checks) |
| `npm run start` | Run the production build locally |
| `npm run lint` | Check code style and common mistakes |
| `npm run test:db` | Test database security rules and the borrowing workflow |
| `npm run db:bundle` | Rebuild `supabase/setup.sql` from the migrations |

## Roadmap

- [x] **Phase 1:** Project foundation, design system, Supabase helpers
- [x] **Phase 2:** Homepage, Explore, item details, About, Contact
- [x] **Phase 3:** Database schema, migrations, Row Level Security, storage
- [ ] **Phase 4:** Profiles, listings, search and filters, borrowing workflow
- [ ] **Phase 5:** Dashboard, notifications, history
- [ ] **Phase 6:** Testing, accessibility and performance checks
- [ ] **Phase 7:** Deployment to Vercel

Not in v1: payments, deposits, insurance, identity verification.
