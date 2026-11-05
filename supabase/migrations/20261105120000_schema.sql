-- =====================================================================
-- Borrow Buddy · Migration 1 of 4 · Tables
-- ---------------------------------------------------------------------
-- Creates the 8 tables, their relationships (foreign keys), rules that
-- keep data valid (constraints), and indexes that make searches fast.
-- Security rules come in migration 2; workflow logic in migration 3.
-- =====================================================================

-- btree_gist lets one constraint compare both an item id (=) and a date
-- range (overlaps). We use it to stop double-booking an item.
create extension if not exists btree_gist with schema extensions;

-- ---------------------------------------------------------------------
-- Enum types: fixed lists of allowed values (must match src/lib/constants.ts)
-- ---------------------------------------------------------------------
create type public.item_category as enum (
  'electronics', 'books', 'tools', 'sports_outdoors', 'kitchen',
  'home_garden', 'clothing', 'toys_games', 'other'
);

create type public.item_condition as enum ('new', 'like_new', 'good', 'fair');

-- A listing's own status, set by the lender (or a moderator).
-- "On loan" is not stored here; it's worked out from active borrowings.
create type public.listing_status as enum ('active', 'paused', 'removed');

-- A request's life: pending -> approved | rejected | cancelled
create type public.request_status as enum ('pending', 'approved', 'rejected', 'cancelled');

-- A loan's life: active -> returned -> completed (or cancelled before pickup)
create type public.borrowing_status as enum ('active', 'returned', 'completed', 'cancelled');

create type public.notification_type as enum (
  'request_received', 'request_approved', 'request_rejected', 'request_cancelled',
  'borrowing_reminder', 'item_returned', 'borrowing_completed', 'review_received'
);

create type public.report_kind as enum ('question', 'item', 'user', 'bug', 'safety');
create type public.report_status as enum ('open', 'reviewing', 'resolved');

-- ---------------------------------------------------------------------
-- Shared trigger: keeps updated_at current on every UPDATE
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- 1. profiles: public information about each member.
--    One row per Supabase Auth user. Email and password stay in Supabase
--    Auth (auth.users), which is never readable by the public.
-- ---------------------------------------------------------------------
create table public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  display_name  text not null check (char_length(display_name) between 2 and 60),
  bio           text check (char_length(bio) <= 500),
  area          text check (char_length(area) <= 60),   -- general area only
  avatar_path   text,                                   -- path in the "avatars" bucket
  is_moderator  boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- Create a profile automatically when someone signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  name text := coalesce(
    nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
    nullif(split_part(new.email, '@', 1), ''),
    'Member'
  );
begin
  -- Names must be 2–60 characters: pad very short ones, cut long ones.
  if char_length(name) < 2 then
    name := rpad(name, 2, '_');
  end if;

  insert into public.profiles (id, display_name, area)
  values (
    new.id,
    left(name, 60),
    nullif(left(trim(new.raw_user_meta_data ->> 'area'), 60), '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- 2. items: things people lend
-- ---------------------------------------------------------------------
create table public.items (
  id            uuid primary key default gen_random_uuid(),
  lender_id     uuid not null references public.profiles (id) on delete cascade,
  title         text not null check (char_length(title) between 3 and 100),
  description   text not null check (char_length(description) between 10 and 2000),
  category      public.item_category not null,
  condition     public.item_condition not null,
  area          text not null check (char_length(area) between 2 and 60),
  status        public.listing_status not null default 'active',
  max_days      integer check (max_days between 1 and 365),
  instructions  text check (char_length(instructions) <= 1000),
  is_sample     boolean not null default false,
  -- Full-text search column, updated automatically by Postgres.
  search        tsvector generated always as (
                  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
                  setweight(to_tsvector('english', coalesce(description, '')), 'B')
                ) stored,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index items_lender_idx   on public.items (lender_id);
create index items_browse_idx   on public.items (status, category, created_at desc);
create index items_area_idx     on public.items (area);
create index items_search_idx   on public.items using gin (search);

create trigger items_updated_at before update on public.items
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 3. item_images: photos for each item (files live in Storage)
-- ---------------------------------------------------------------------
create table public.item_images (
  id            uuid primary key default gen_random_uuid(),
  item_id       uuid not null references public.items (id) on delete cascade,
  storage_path  text not null unique,           -- e.g. "<user id>/<item id>/<file>.jpg"
  position      smallint not null default 0 check (position between 0 and 9),
  created_at    timestamptz not null default now()
);

create index item_images_item_idx on public.item_images (item_id, position);

-- ---------------------------------------------------------------------
-- 4. borrowing_requests: "can I borrow this from <date> to <date>?"
-- ---------------------------------------------------------------------
create table public.borrowing_requests (
  id            uuid primary key default gen_random_uuid(),
  item_id       uuid not null references public.items (id) on delete cascade,
  borrower_id   uuid not null references public.profiles (id) on delete cascade,
  lender_id     uuid not null references public.profiles (id) on delete cascade,
  start_date    date not null,
  end_date      date not null,
  message       text check (char_length(message) <= 1000),
  status        public.request_status not null default 'pending',
  decided_at    timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint request_dates_valid check (end_date >= start_date),
  constraint request_not_own_item check (borrower_id <> lender_id)
);

create index requests_borrower_idx on public.borrowing_requests (borrower_id, created_at desc);
create index requests_lender_idx   on public.borrowing_requests (lender_id, status, created_at desc);
create index requests_item_idx     on public.borrowing_requests (item_id, status);

-- A borrower can't have two pending requests for the same item at once.
create unique index requests_one_pending_per_item
  on public.borrowing_requests (item_id, borrower_id) where status = 'pending';

create trigger requests_updated_at before update on public.borrowing_requests
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 5. borrowings: an approved request becomes a loan
-- ---------------------------------------------------------------------
create table public.borrowings (
  id                     uuid primary key default gen_random_uuid(),
  request_id             uuid not null unique references public.borrowing_requests (id) on delete cascade,
  item_id                uuid not null references public.items (id) on delete cascade,
  borrower_id            uuid not null references public.profiles (id) on delete cascade,
  lender_id              uuid not null references public.profiles (id) on delete cascade,
  start_date             date not null,
  end_date               date not null,
  status                 public.borrowing_status not null default 'active',
  pickup_details         text check (char_length(pickup_details) <= 1000), -- visible to both parties only
  returned_at            timestamptz,
  lender_confirmed_at    timestamptz,
  borrower_confirmed_at  timestamptz,
  reminder_sent_at       timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  constraint borrowing_dates_valid check (end_date >= start_date),
  -- THE double-booking guard: two active loans of the same item can never
  -- have overlapping dates. Postgres itself refuses, even if app code has a bug.
  constraint borrowings_no_overlap exclude using gist (
    item_id with =,
    daterange(start_date, end_date, '[]') with &&
  ) where (status = 'active')
);

create index borrowings_borrower_idx on public.borrowings (borrower_id, status);
create index borrowings_lender_idx   on public.borrowings (lender_id, status);
create index borrowings_due_idx      on public.borrowings (end_date) where status = 'active';

create trigger borrowings_updated_at before update on public.borrowings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 6. notifications: in-app messages for one user
-- ---------------------------------------------------------------------
create table public.notifications (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles (id) on delete cascade,
  type          public.notification_type not null,
  title         text not null,
  body          text,
  link          text,             -- where clicking it takes you, e.g. /dashboard/requests
  read_at       timestamptz,
  created_at    timestamptz not null default now()
);

create index notifications_user_idx on public.notifications (user_id, created_at desc);
create index notifications_unread_idx on public.notifications (user_id) where read_at is null;

-- ---------------------------------------------------------------------
-- 7. reviews: after a completed loan, each side can review the other once
-- ---------------------------------------------------------------------
create table public.reviews (
  id            uuid primary key default gen_random_uuid(),
  borrowing_id  uuid not null references public.borrowings (id) on delete cascade,
  reviewer_id   uuid not null references public.profiles (id) on delete cascade,
  reviewee_id   uuid not null references public.profiles (id) on delete cascade,
  rating        smallint not null check (rating between 1 and 5),
  comment       text check (char_length(comment) <= 1000),
  created_at    timestamptz not null default now(),
  constraint review_once unique (borrowing_id, reviewer_id),
  constraint review_not_self check (reviewer_id <> reviewee_id)
);

create index reviews_reviewee_idx on public.reviews (reviewee_id, created_at desc);

-- ---------------------------------------------------------------------
-- 8. reports: contact messages and reports about items/members
-- ---------------------------------------------------------------------
create table public.reports (
  id               uuid primary key default gen_random_uuid(),
  reporter_id      uuid references public.profiles (id) on delete set null, -- null if not logged in
  reporter_name    text not null check (char_length(reporter_name) between 2 and 80),
  reporter_email   text not null check (char_length(reporter_email) between 3 and 200),
  kind             public.report_kind not null,
  item_id          uuid references public.items (id) on delete set null,
  reported_user_id uuid references public.profiles (id) on delete set null,
  reference        text check (char_length(reference) <= 200),
  message          text not null check (char_length(message) between 10 and 2000),
  status           public.report_status not null default 'open',
  moderator_note   text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index reports_status_idx on public.reports (status, created_at desc);

create trigger reports_updated_at before update on public.reports
  for each row execute function public.set_updated_at();
