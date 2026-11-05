-- =====================================================================
-- Borrow Buddy · Migration 3 of 4 · Borrowing workflow
-- ---------------------------------------------------------------------
-- Every step of a loan is a database function ("RPC") that the website
-- calls, e.g. supabase.rpc('approve_request', {...}). Each one:
--   * checks WHO is calling (only the lender can approve, etc.)
--   * checks the current STATE (you can't approve a cancelled request)
--   * makes all its changes at once (a transaction) and sends notifications
-- They run as SECURITY DEFINER (with the database's own rights), which is
-- why they check permissions themselves, very carefully, at the top.
-- Error messages are written for people, because the app shows them.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Internal helper: create a notification. Not callable by members.
-- ---------------------------------------------------------------------
create or replace function public.notify(
  p_user_id uuid,
  p_type public.notification_type,
  p_title text,
  p_body text default null,
  p_link text default null
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.notifications (user_id, type, title, body, link)
  values (p_user_id, p_type, p_title, p_body, p_link);
$$;

-- Small helper: the logged-in user, or an error if nobody is logged in.
create or replace function public.require_user()
returns uuid
language plpgsql
stable
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
begin
  if uid is null then
    raise exception 'Log in to do this.' using errcode = '42501';
  end if;
  return uid;
end;
$$;

-- ---------------------------------------------------------------------
-- Step 1 · Borrower sends a request
-- ---------------------------------------------------------------------
create or replace function public.create_borrow_request(
  p_item_id uuid,
  p_start_date date,
  p_end_date date,
  p_message text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := public.require_user();
  v_item public.items;
  v_request_id uuid;
  v_days integer := p_end_date - p_start_date + 1;
begin
  select * into v_item from public.items where id = p_item_id;

  if v_item.id is null or v_item.status <> 'active' then
    raise exception 'This item isn''t available to borrow right now.';
  end if;
  if v_item.lender_id = uid then
    raise exception 'You can''t borrow your own item.';
  end if;
  if p_start_date is null or p_end_date is null or p_end_date < p_start_date then
    raise exception 'Choose a return date on or after the start date.';
  end if;
  if p_start_date < current_date then
    raise exception 'The start date can''t be in the past.';
  end if;
  if p_start_date > current_date + 180 then
    raise exception 'You can request dates up to 6 months ahead.';
  end if;
  if v_item.max_days is not null and v_days > v_item.max_days then
    raise exception 'The lender allows up to % days per loan. You asked for %.', v_item.max_days, v_days;
  end if;
  if char_length(p_message) > 1000 then
    raise exception 'Keep your message under 1,000 characters.';
  end if;
  if exists (
    select 1 from public.borrowings b
    where b.item_id = p_item_id and b.status = 'active'
      and daterange(b.start_date, b.end_date, '[]') && daterange(p_start_date, p_end_date, '[]')
  ) then
    raise exception 'The item is already booked for some of those dates. Choose different dates.';
  end if;

  begin
    insert into public.borrowing_requests (item_id, borrower_id, lender_id, start_date, end_date, message)
    values (p_item_id, uid, v_item.lender_id, p_start_date, p_end_date, nullif(trim(p_message), ''))
    returning id into v_request_id;
  exception when unique_violation then
    raise exception 'You already have a pending request for this item. Cancel it first to ask for new dates.';
  end;

  perform public.notify(
    v_item.lender_id, 'request_received',
    'New request for ' || v_item.title,
    (select display_name from public.profiles where id = uid)
      || ' wants to borrow it ' || to_char(p_start_date, 'FMDD Mon') || ' – ' || to_char(p_end_date, 'FMDD Mon') || '.',
    '/dashboard/requests'
  );
  return v_request_id;
end;
$$;

-- ---------------------------------------------------------------------
-- Step 2a · Lender approves → the request becomes an active loan
-- ---------------------------------------------------------------------
create or replace function public.approve_request(
  p_request_id uuid,
  p_pickup_details text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := public.require_user();
  r public.borrowing_requests;
  v_title text;
  v_borrowing_id uuid;
  other record;
begin
  -- "for update" locks the row so two clicks can't approve it twice.
  select * into r from public.borrowing_requests where id = p_request_id for update;

  if r.id is null or r.lender_id <> uid then
    raise exception 'Request not found.';
  end if;
  if r.status <> 'pending' then
    raise exception 'This request has already been %.', r.status;
  end if;
  if r.end_date < current_date then
    raise exception 'These dates have passed. Decline the request instead.';
  end if;
  if char_length(p_pickup_details) > 1000 then
    raise exception 'Keep the pickup details under 1,000 characters.';
  end if;

  select title into v_title from public.items where id = r.item_id;

  begin
    insert into public.borrowings (request_id, item_id, borrower_id, lender_id, start_date, end_date, pickup_details)
    values (r.id, r.item_id, r.borrower_id, r.lender_id, r.start_date, r.end_date, nullif(trim(p_pickup_details), ''))
    returning id into v_borrowing_id;
  exception when exclusion_violation then
    -- the double-booking guard from migration 1
    raise exception 'You''ve already approved another loan of this item for some of these dates.';
  end;

  update public.borrowing_requests
     set status = 'approved', decided_at = now()
   where id = r.id;

  perform public.notify(
    r.borrower_id, 'request_approved',
    'Request approved: ' || v_title,
    'You can pick it up from ' || to_char(r.start_date, 'FMDD Mon') || '. Return it by ' || to_char(r.end_date, 'FMDD Mon') || '.',
    '/dashboard/borrowing'
  );

  -- Other pending requests for overlapping dates can't be approved any
  -- more, so decline them automatically and tell those borrowers.
  for other in
    update public.borrowing_requests
       set status = 'rejected', decided_at = now()
     where item_id = r.item_id and status = 'pending' and id <> r.id
       and daterange(start_date, end_date, '[]') && daterange(r.start_date, r.end_date, '[]')
    returning borrower_id
  loop
    perform public.notify(
      other.borrower_id, 'request_rejected',
      'Request declined: ' || v_title,
      'Someone else is borrowing it on those dates. Try different dates.',
      '/dashboard/requests'
    );
  end loop;

  return v_borrowing_id;
end;
$$;

-- ---------------------------------------------------------------------
-- Step 2b · Lender declines
-- ---------------------------------------------------------------------
create or replace function public.reject_request(p_request_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := public.require_user();
  r public.borrowing_requests;
begin
  select * into r from public.borrowing_requests where id = p_request_id for update;
  if r.id is null or r.lender_id <> uid then
    raise exception 'Request not found.';
  end if;
  if r.status <> 'pending' then
    raise exception 'This request has already been %.', r.status;
  end if;

  update public.borrowing_requests set status = 'rejected', decided_at = now() where id = r.id;

  perform public.notify(
    r.borrower_id, 'request_rejected',
    'Request declined: ' || (select title from public.items where id = r.item_id),
    'The lender can''t lend it on those dates.',
    '/dashboard/requests'
  );
end;
$$;

-- ---------------------------------------------------------------------
-- Step 2c · Borrower cancels a pending request
-- ---------------------------------------------------------------------
create or replace function public.cancel_request(p_request_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := public.require_user();
  r public.borrowing_requests;
begin
  select * into r from public.borrowing_requests where id = p_request_id for update;
  if r.id is null or r.borrower_id <> uid then
    raise exception 'Request not found.';
  end if;
  if r.status <> 'pending' then
    raise exception 'Only pending requests can be cancelled. This one has been %.', r.status;
  end if;

  update public.borrowing_requests set status = 'cancelled', decided_at = now() where id = r.id;

  perform public.notify(
    r.lender_id, 'request_cancelled',
    'Request cancelled: ' || (select title from public.items where id = r.item_id),
    (select display_name from public.profiles where id = uid) || ' cancelled their request.',
    '/dashboard/requests'
  );
end;
$$;

-- ---------------------------------------------------------------------
-- Either side cancels an approved loan before it starts
-- ---------------------------------------------------------------------
create or replace function public.cancel_borrowing(p_borrowing_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := public.require_user();
  b public.borrowings;
  v_other uuid;
begin
  select * into b from public.borrowings where id = p_borrowing_id for update;
  if b.id is null or uid not in (b.borrower_id, b.lender_id) then
    raise exception 'Loan not found.';
  end if;
  if b.status <> 'active' or b.start_date <= current_date then
    raise exception 'Only loans that haven''t started yet can be cancelled.';
  end if;

  update public.borrowings set status = 'cancelled' where id = b.id;
  update public.borrowing_requests set status = 'cancelled' where id = b.request_id;

  v_other := case when uid = b.borrower_id then b.lender_id else b.borrower_id end;
  perform public.notify(
    v_other, 'request_cancelled',
    'Loan cancelled: ' || (select title from public.items where id = b.item_id),
    (select display_name from public.profiles where id = uid) || ' cancelled the loan before it started.',
    '/dashboard'
  );
end;
$$;

-- ---------------------------------------------------------------------
-- Step 3 · Return and completion
-- The first person to confirm marks the item "returned"; when the other
-- person confirms too, the loan is "completed" and both can leave reviews.
-- ---------------------------------------------------------------------
create or replace function public.confirm_return(p_borrowing_id uuid)
returns public.borrowing_status
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := public.require_user();
  b public.borrowings;
  v_title text;
  v_is_lender boolean;
  v_other uuid;
begin
  select * into b from public.borrowings where id = p_borrowing_id for update;
  if b.id is null or uid not in (b.borrower_id, b.lender_id) then
    raise exception 'Loan not found.';
  end if;
  if b.status not in ('active', 'returned') then
    raise exception 'This loan is already %.', b.status;
  end if;
  if b.status = 'active' and b.start_date > current_date then
    raise exception 'This loan hasn''t started yet.';
  end if;

  v_is_lender := uid = b.lender_id;
  v_other := case when v_is_lender then b.borrower_id else b.lender_id end;
  select title into v_title from public.items where id = b.item_id;

  if (v_is_lender and b.lender_confirmed_at is not null)
     or (not v_is_lender and b.borrower_confirmed_at is not null) then
    raise exception 'You''ve already confirmed this return. Waiting for the other person.';
  end if;

  update public.borrowings
     set lender_confirmed_at   = case when v_is_lender then now() else lender_confirmed_at end,
         borrower_confirmed_at = case when not v_is_lender then now() else borrower_confirmed_at end,
         returned_at           = coalesce(returned_at, now()),
         status                = 'returned'
   where id = b.id
   returning * into b;

  if b.lender_confirmed_at is not null and b.borrower_confirmed_at is not null then
    update public.borrowings set status = 'completed' where id = b.id;
    perform public.notify(b.lender_id, 'borrowing_completed', 'Loan completed: ' || v_title,
      'Thanks for lending! You can now review the borrower.', '/dashboard/history');
    perform public.notify(b.borrower_id, 'borrowing_completed', 'Loan completed: ' || v_title,
      'Thanks for returning it! You can now review the lender.', '/dashboard/history');
    return 'completed';
  end if;

  perform public.notify(
    v_other, 'item_returned',
    'Confirm the return: ' || v_title,
    case when v_is_lender
      then 'The lender marked the item as returned. Please confirm to complete the loan.'
      else 'The borrower says they returned it. Please confirm you got it back.' end,
    case when v_is_lender then '/dashboard/borrowing' else '/dashboard/lending' end
  );
  return 'returned';
end;
$$;

-- ---------------------------------------------------------------------
-- Reviews: one per person per completed loan
-- ---------------------------------------------------------------------
create or replace function public.submit_review(
  p_borrowing_id uuid,
  p_rating smallint,
  p_comment text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := public.require_user();
  b public.borrowings;
  v_reviewee uuid;
  v_id uuid;
begin
  select * into b from public.borrowings where id = p_borrowing_id;
  if b.id is null or uid not in (b.borrower_id, b.lender_id) then
    raise exception 'Loan not found.';
  end if;
  if b.status <> 'completed' then
    raise exception 'You can leave a review once both of you have confirmed the return.';
  end if;
  if p_rating is null or p_rating not between 1 and 5 then
    raise exception 'Choose a rating from 1 to 5 stars.';
  end if;
  if char_length(p_comment) > 1000 then
    raise exception 'Keep your review under 1,000 characters.';
  end if;

  v_reviewee := case when uid = b.lender_id then b.borrower_id else b.lender_id end;

  begin
    insert into public.reviews (borrowing_id, reviewer_id, reviewee_id, rating, comment)
    values (b.id, uid, v_reviewee, p_rating, nullif(trim(p_comment), ''))
    returning id into v_id;
  exception when unique_violation then
    raise exception 'You''ve already reviewed this loan.';
  end;

  perform public.notify(v_reviewee, 'review_received', 'You received a review',
    (select display_name from public.profiles where id = uid) || ' gave you ' || p_rating || ' out of 5.',
    '/dashboard/profile');
  return v_id;
end;
$$;

-- ---------------------------------------------------------------------
-- Public read helpers. They reveal only dates and counts, never who is
-- borrowing what, so it's safe for anyone to call them.
-- ---------------------------------------------------------------------

-- Dates an item is already booked (for the date picker)
create or replace function public.item_booked_ranges(p_item_id uuid)
returns table (start_date date, end_date date)
language sql
stable
security definer
set search_path = ''
as $$
  select b.start_date, b.end_date
  from public.borrowings b
  where b.item_id = p_item_id and b.status = 'active' and b.end_date >= current_date
  order by b.start_date;
$$;

-- Which of these items are on loan today, and when they're due back
create or replace function public.items_on_loan(p_item_ids uuid[])
returns table (item_id uuid, due_back date)
language sql
stable
security definer
set search_path = ''
as $$
  select b.item_id, b.end_date
  from public.borrowings b
  where b.item_id = any (p_item_ids) and b.status = 'active'
    and current_date between b.start_date and b.end_date;
$$;

-- Numbers shown on a public profile
create or replace function public.profile_stats(p_user_id uuid)
returns table (
  items_listed integer,
  items_borrowed integer,
  lends_completed integer,
  review_count integer,
  average_rating numeric
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    (select count(*)::int from public.items i where i.lender_id = p_user_id and i.status = 'active'),
    (select count(*)::int from public.borrowings b where b.borrower_id = p_user_id and b.status = 'completed'),
    (select count(*)::int from public.borrowings b where b.lender_id = p_user_id and b.status = 'completed'),
    (select count(*)::int from public.reviews r where r.reviewee_id = p_user_id),
    (select round(avg(r.rating), 1) from public.reviews r where r.reviewee_id = p_user_id);
$$;

-- ---------------------------------------------------------------------
-- Reminders: notify borrowers the day before an item is due back.
-- Run once a day by a scheduler (see supabase/optional/schedule_reminders.sql).
-- ---------------------------------------------------------------------
create or replace function public.send_due_reminders()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  b record;
  n integer := 0;
begin
  for b in
    update public.borrowings
       set reminder_sent_at = now()
     where status = 'active' and reminder_sent_at is null
       and end_date = current_date + 1
    returning id, borrower_id, item_id, end_date
  loop
    perform public.notify(
      b.borrower_id, 'borrowing_reminder',
      'Due back tomorrow: ' || (select title from public.items where id = b.item_id),
      'Please return it by ' || to_char(b.end_date, 'FMDD Mon') || '.',
      '/dashboard/borrowing'
    );
    n := n + 1;
  end loop;
  return n;
end;
$$;

-- ---------------------------------------------------------------------
-- Who may call which function
-- ---------------------------------------------------------------------
revoke execute on all functions in schema public from public, anon, authenticated;

grant execute on function
  public.create_borrow_request(uuid, date, date, text),
  public.approve_request(uuid, text),
  public.reject_request(uuid),
  public.cancel_request(uuid),
  public.cancel_borrowing(uuid),
  public.confirm_return(uuid),
  public.submit_review(uuid, smallint, text)
to authenticated;

grant execute on function
  public.item_booked_ranges(uuid),
  public.items_on_loan(uuid[]),
  public.profile_stats(uuid),
  public.is_moderator(),
  public.has_borrowed_item(uuid)
to anon, authenticated;

-- require_user() is used inside the functions above (it only reads auth.uid())
grant execute on function public.require_user() to authenticated;

-- notify() and send_due_reminders() stay private: members can't call them.
