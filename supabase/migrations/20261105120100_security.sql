-- =====================================================================
-- Borrow Buddy · Migration 2 of 4 · Security
-- ---------------------------------------------------------------------
-- Two layers protect every table:
--   1. GRANTs: which columns each role may touch at all.
--      "anon" = visitors who aren't logged in, "authenticated" = members.
--   2. ROW LEVEL SECURITY (RLS) policies: which ROWS each person may
--      see or change, e.g. "only your own notifications".
-- Postgres enforces both on every query, whatever the website code does.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Helper: is the current user a moderator?
-- SECURITY DEFINER lets it read profiles without triggering RLS loops.
-- ---------------------------------------------------------------------
create or replace function public.is_moderator()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select p.is_moderator from public.profiles p where p.id = (select auth.uid())),
    false
  );
$$;

-- Helper: has the current user borrowed (or been approved to borrow) this
-- item? Used by the items policy. It's a function because visitors who
-- aren't logged in have no access to the borrowings table at all.
create or replace function public.has_borrowed_item(p_item_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null and exists (
    select 1 from public.borrowings b
    where b.item_id = p_item_id and b.borrower_id = (select auth.uid())
  );
$$;

-- ---------------------------------------------------------------------
-- Layer 1: GRANTs. Start from nothing, then allow only what's needed.
-- Workflow changes (requests, loans, reviews) are NOT granted here at
-- all: they go through the checked functions in migration 3.
-- ---------------------------------------------------------------------
revoke all on all tables in schema public from anon, authenticated;

-- profiles: everyone may read public profile fields; members may edit
-- only these four columns (so nobody can make themselves a moderator).
grant select on public.profiles to anon, authenticated;
grant update (display_name, bio, area, avatar_path) on public.profiles to authenticated;

-- items
grant select on public.items to anon, authenticated;
grant insert (lender_id, title, description, category, condition, area, status, max_days, instructions)
  on public.items to authenticated;
grant update (title, description, category, condition, area, status, max_days, instructions)
  on public.items to authenticated;
grant delete on public.items to authenticated;

-- item_images
grant select on public.item_images to anon, authenticated;
grant insert (item_id, storage_path, position) on public.item_images to authenticated;
grant update (position) on public.item_images to authenticated;
grant delete on public.item_images to authenticated;

-- requests and loans: members can only READ (their own, see policies)
grant select on public.borrowing_requests to authenticated;
grant select on public.borrowings to authenticated;

-- notifications: read, mark as read, delete your own
grant select, delete on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;

-- reviews: public to read; written via submit_review()
grant select on public.reviews to anon, authenticated;

-- reports: anyone may send one; status/moderator_note can't be set by senders
grant insert (reporter_id, reporter_name, reporter_email, kind, item_id, reported_user_id, reference, message)
  on public.reports to anon, authenticated;
grant select on public.reports to authenticated;
grant update (status, moderator_note) on public.reports to authenticated;

-- ---------------------------------------------------------------------
-- Layer 2: Row Level Security policies
-- Note: "(select auth.uid())" is the logged-in user's id. Wrapping it in
-- a sub-select is a Supabase performance tip (evaluated once per query).
-- ---------------------------------------------------------------------
alter table public.profiles           enable row level security;
alter table public.items              enable row level security;
alter table public.item_images        enable row level security;
alter table public.borrowing_requests enable row level security;
alter table public.borrowings         enable row level security;
alter table public.notifications      enable row level security;
alter table public.reviews            enable row level security;
alter table public.reports            enable row level security;

-- profiles ------------------------------------------------------------
create policy "Profiles are public"
  on public.profiles for select to anon, authenticated
  using (true);

create policy "Members edit their own profile"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- items ---------------------------------------------------------------
create policy "Active listings are public; owners and moderators see all of theirs"
  on public.items for select to anon, authenticated
  using (
    status = 'active'
    or lender_id = (select auth.uid())
    or (select public.is_moderator())
    -- people with a loan of a paused item can still open its page
    or public.has_borrowed_item(items.id)
  );

create policy "Members list items as themselves"
  on public.items for insert to authenticated
  with check (lender_id = (select auth.uid()));

create policy "Owners and moderators edit listings"
  on public.items for update to authenticated
  using (lender_id = (select auth.uid()) or (select public.is_moderator()))
  with check (lender_id = (select auth.uid()) or (select public.is_moderator()));

create policy "Owners delete their listings"
  on public.items for delete to authenticated
  using (lender_id = (select auth.uid()));

-- Extra rules for items that a policy can't express on its own:
--  * only moderators can set or undo "removed"
--  * a listing with a current or upcoming loan can't be deleted
create or replace function public.guard_items()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' then
    if (new.status = 'removed' or old.status = 'removed')
       and new.status is distinct from old.status
       and not public.is_moderator()
       and (select auth.uid()) is not null then
      raise exception 'Only moderators can remove or restore a listing.'
        using errcode = '42501';
    end if;
    return new;
  end if;

  -- DELETE
  if exists (
    select 1 from public.borrowings b
    where b.item_id = old.id and b.status in ('active', 'returned')
  ) then
    raise exception 'This item is on loan. Pause the listing instead, and delete it after the loan is completed.'
      using errcode = 'P0001';
  end if;
  return old;
end;
$$;

create trigger items_guard_update before update on public.items
  for each row execute function public.guard_items();
create trigger items_guard_delete before delete on public.items
  for each row execute function public.guard_items();

-- item_images -----------------------------------------------------------
create policy "Images are visible when their item is"
  on public.item_images for select to anon, authenticated
  using (exists (select 1 from public.items i where i.id = item_images.item_id));

create policy "Owners add images to their items, in their own folder"
  on public.item_images for insert to authenticated
  with check (
    exists (select 1 from public.items i where i.id = item_id and i.lender_id = (select auth.uid()))
    and storage_path like (select auth.uid())::text || '/%'
  );

create policy "Owners reorder images"
  on public.item_images for update to authenticated
  using (exists (select 1 from public.items i where i.id = item_id and i.lender_id = (select auth.uid())))
  with check (exists (select 1 from public.items i where i.id = item_id and i.lender_id = (select auth.uid())));

create policy "Owners delete images"
  on public.item_images for delete to authenticated
  using (exists (select 1 from public.items i where i.id = item_id and i.lender_id = (select auth.uid())));

-- borrowing_requests and borrowings: only the two people involved ---------
create policy "Borrower and lender see their requests"
  on public.borrowing_requests for select to authenticated
  using ((select auth.uid()) in (borrower_id, lender_id));

create policy "Borrower and lender see their loans"
  on public.borrowings for select to authenticated
  using ((select auth.uid()) in (borrower_id, lender_id));

-- notifications: strictly your own ----------------------------------------
create policy "Members see their own notifications"
  on public.notifications for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Members mark their own notifications read"
  on public.notifications for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Members delete their own notifications"
  on public.notifications for delete to authenticated
  using (user_id = (select auth.uid()));

-- reviews ---------------------------------------------------------------
create policy "Reviews are public"
  on public.reviews for select to anon, authenticated
  using (true);

-- reports ---------------------------------------------------------------
create policy "Anyone can send a report"
  on public.reports for insert to anon, authenticated
  with check (reporter_id is null or reporter_id = (select auth.uid()));

create policy "Senders see their reports; moderators see all"
  on public.reports for select to authenticated
  using (reporter_id = (select auth.uid()) or (select public.is_moderator()));

create policy "Moderators update reports"
  on public.reports for update to authenticated
  using ((select public.is_moderator()))
  with check ((select public.is_moderator()));
