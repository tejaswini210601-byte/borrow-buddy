import { PGlite } from "@electric-sql/pglite";
import { btree_gist } from "@electric-sql/pglite/contrib/btree_gist";
import fs from "node:fs";
// Runs every migration on an in-memory Postgres (PGlite), then checks the
// security rules and workflow by acting as different users.
// Run with: npm run test:db
import path from "node:path";
import { fileURLToPath } from "node:url";
const here = path.dirname(fileURLToPath(import.meta.url));
const stub = path.join(here, "supabase-stub.sql");
const migDir = path.join(here, "..", "migrations");
const db = new PGlite({ extensions: { btree_gist } });
await db.exec(fs.readFileSync(stub, "utf8"));
for (const f of fs.readdirSync(migDir).sort()) {
  try { await db.exec(fs.readFileSync(`${migDir}/${f}`, "utf8")); console.log("✓ applied", f); }
  catch (e) { console.log("✗ FAILED", f, e.message); process.exit(1); }
}
const A = "00000000-0000-0000-0000-00000000000a", B = "00000000-0000-0000-0000-00000000000b", C = "00000000-0000-0000-0000-00000000000c";
let pass = 0, fail = 0;
const ok = (cond, name, extra = "") => { if (cond) pass++; else fail++; console.log(`${cond ? "  PASS" : "  FAIL"}  ${name}${extra ? "  → " + extra : ""}`); };
async function as(uid, sql, params = []) {
  await db.exec("begin");
  try {
    await db.query(uid ? "set local role authenticated" : "set local role anon");
    await db.query("select set_config('request.jwt.claim.sub', $1, true)", [uid ?? ""]);
    const r = await db.query(sql, params);
    await db.exec("commit");
    return { rows: r.rows, affected: r.affectedRows };
  } catch (e) { await db.exec("rollback"); return { error: e.message }; }
}
const admin = (sql, p = []) => db.query(sql, p);

// --- signup creates profiles
await admin(`insert into auth.users (id, email, raw_user_meta_data) values
  ($1,'aino@example.com','{"display_name":"Aino K.","area":"Niinivaara"}'),
  ($2,'bo@example.com','{}'), ($3,'c@example.com','{"display_name":"X"}')`, [A, B, C]);
const profs = (await admin("select id, display_name, area from public.profiles order by id")).rows;
ok(profs.length === 3 && profs[0].display_name === "Aino K." && profs[1].display_name === "bo" && profs[2].display_name === "X_", "Signup creates a profile (with name fallbacks)", JSON.stringify(profs.map(p=>p.display_name)));

// --- profiles
let r = await as(B, "update public.profiles set is_moderator = true where id = $1", [B]);
ok(!!r.error, "Member can't make themselves a moderator", r.error);
r = await as(B, "update public.profiles set bio = 'hi' where id = $1", [A]);
ok(!r.error && r.affected === 0, "Member can't edit someone else's profile");
r = await as(B, "update public.profiles set bio = 'Student' where id = $1", [B]);
ok(r.affected === 1, "Member can edit their own profile");

// --- items
r = await as(A, `insert into public.items (lender_id,title,description,category,condition,area,max_days)
  values ($1,'Cordless drill','18 V drill with bits and two batteries','tools','like_new','Karsikko',7) returning id`, [A]);
const item = r.rows?.[0]?.id; ok(!!item, "Member can list an item", r.error);
r = await as(A, `insert into public.items (lender_id,title,description,category,condition,area,status)
  values ($1,'Old tent','Two-person tent, slightly used','sports_outdoors','fair','Karsikko','paused') returning id`, [A]);
const paused = r.rows?.[0]?.id;
r = await as(B, `insert into public.items (lender_id,title,description,category,condition,area) values ($1,'Fake','Pretending to be someone','tools','good','Here')`, [A]);
ok(!!r.error, "Member can't list an item as someone else", r.error);
r = await as(B, "update public.items set title = 'Hacked' where id = $1", [item]);
ok(!r.error && r.affected === 0, "Member can't edit someone else's listing");
r = await as(A, "update public.items set is_sample = true where id = $1", [item]);
ok(!!r.error, "Owner can't set protected columns (is_sample)", r.error);
r = await as(A, "update public.items set status = 'removed' where id = $1", [item]);
ok(!!r.error, "Only moderators can mark a listing removed", r.error);
r = await as(null, "select id from public.items");
ok(r.rows?.length === 1, "Visitors see only active listings", `${r.rows?.length} visible`);
r = await as(null, "select title from public.items where search @@ websearch_to_tsquery('english', 'drills')");
ok(r.rows?.length === 1, "Full-text search finds 'drill' when searching 'drills'");

// --- requests
const d = (n) => { const x = new Date(); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10); };
r = await as(B, "select public.create_borrow_request($1,$2,$3,'Hi! For a shelf.') as id", [item, d(2), d(5)]);
const reqB = r.rows?.[0]?.id; ok(!!reqB, "Borrower can request an item", r.error);
r = await as(B, "select public.create_borrow_request($1,$2,$3)", [item, d(10), d(11)]);
ok(r.error?.includes("already have a pending request"), "One pending request per item per borrower", r.error);
r = await as(A, "select public.create_borrow_request($1,$2,$3)", [item, d(2), d(3)]);
ok(r.error?.includes("own item"), "Lender can't borrow their own item", r.error);
r = await as(C, "select public.create_borrow_request($1,$2,$3)", [item, d(2), d(20)]);
ok(r.error?.includes("up to 7 days"), "Max loan length is enforced", r.error);
r = await as(C, "select public.create_borrow_request($1,$2,$3)", [item, d(-2), d(1)]);
ok(r.error?.includes("past"), "Can't request dates in the past", r.error);
r = await as(C, "select public.create_borrow_request($1,$2,$3)", [paused, d(2), d(3)]);
ok(r.error?.includes("isn't available"), "Can't request a paused item", r.error);
r = await as(C, "select public.create_borrow_request($1,$2,$3) as id", [item, d(4), d(6)]);
const reqC = r.rows?.[0]?.id; ok(!!reqC, "Second borrower can request overlapping dates (still pending)");
r = await as(B, "insert into public.borrowing_requests (item_id,borrower_id,lender_id,start_date,end_date) values ($1,$2,$3,$4,$5)", [item, B, A, d(1), d(2)]);
ok(!!r.error, "Requests can't be inserted directly, only via the checked function", r.error);
r = await as(C, "select id from public.borrowing_requests");
ok(r.rows?.length === 1, "Members see only their own requests", `${r.rows?.length} visible to C`);
r = await as(null, "select id from public.borrowing_requests");
ok(!!r.error, "Visitors can't read requests at all", r.error);
r = await as(A, "select title from public.notifications");
ok(r.rows?.length === 2 && r.rows[0].title.startsWith("New request"), "Lender is notified of new requests", r.rows?.map(x=>x.title).join(" | "));

// --- approve / reject
r = await as(B, "select public.approve_request($1)", [reqB]);
ok(r.error?.includes("not found"), "Borrower can't approve their own request", r.error);
r = await as(A, "select public.approve_request($1, 'Pick up at the K-Market entrance') as id", [reqB]);
const loan = r.rows?.[0]?.id; ok(!!loan, "Lender approves → loan created", r.error);
r = await as(C, "select status from public.borrowing_requests where id = $1", [reqC]);
ok(r.rows?.[0]?.status === "rejected", "Overlapping pending request is declined automatically");
r = await as(C, "select title from public.notifications");
ok(r.rows?.some(n => n.title.startsWith("Request declined")), "…and that borrower is notified");
r = await as(A, "select public.approve_request($1)", [reqB]);
ok(r.error?.includes("already been approved"), "Can't approve the same request twice", r.error);
r = await as(C, "select public.create_borrow_request($1,$2,$3)", [item, d(3), d(4)]);
ok(r.error?.includes("already booked"), "New requests for booked dates are refused", r.error);
r = await as(C, "select public.create_borrow_request($1,$2,$3) as id", [item, d(6), d(8)]);
ok(!!r.rows?.[0]?.id, "Requests for free dates still work");
try {
  await admin("insert into public.borrowing_requests (id,item_id,borrower_id,lender_id,start_date,end_date,status) values ('11111111-1111-1111-1111-111111111111',$1,$2,$3,$4,$5,'approved')", [item, C, A, d(3), d(4)]);
  await admin("insert into public.borrowings (request_id,item_id,borrower_id,lender_id,start_date,end_date) values ('11111111-1111-1111-1111-111111111111',$1,$2,$3,$4,$5)", [item, C, A, d(3), d(4)]);
  ok(false, "Database itself blocks double-booking (even for admins)");
} catch (e) { ok(e.message.includes("borrowings_no_overlap"), "Database itself blocks double-booking (even for admins)", e.message.slice(0, 80)); }
r = await as(null, "select * from public.item_booked_ranges($1)", [item]);
ok(r.rows?.length === 1, "Visitors can see booked dates (dates only)");
r = await as(B, "select pickup_details from public.borrowings where id = $1", [loan]);
ok(r.rows?.[0]?.pickup_details?.includes("K-Market"), "Borrower sees the private pickup details");
r = await as(C, "select id from public.borrowings");
ok(r.rows?.length === 0, "Others can't see the loan or its pickup details");

// --- returns, completion, reviews
r = await as(B, "select public.confirm_return($1)", [loan]);
ok(r.error?.includes("hasn't started"), "Can't return before the loan starts", r.error);
await admin("update public.borrowings set start_date = current_date - 3, end_date = current_date + 1 where id = $1", [loan]);
r = await as(null, "select * from public.items_on_loan(array[$1]::uuid[])", [item]);
ok(r.rows?.length === 1, "Item shows as on loan today");
const rem = await admin("select public.send_due_reminders() as n");
ok(rem.rows[0].n === 1, "Due-tomorrow reminder is sent once");
r = await as(B, "select public.send_due_reminders()");
ok(!!r.error, "Members can't trigger reminders themselves", r.error);
r = await as(A, "delete from public.items where id = $1", [item]);
ok(r.error?.includes("on loan"), "Can't delete an item that's on loan", r.error);
r = await as(B, "select public.submit_review($1, 5::smallint, 'Great')", [loan]);
ok(r.error?.includes("both of you"), "Can't review before completion", r.error);
r = await as(B, "select public.confirm_return($1) as s", [loan]);
ok(r.rows?.[0]?.s === "returned", "Borrower confirms return → 'returned'");
r = await as(B, "select public.confirm_return($1)", [loan]);
ok(r.error?.includes("already confirmed"), "Can't confirm twice", r.error);
r = await as(A, "select public.confirm_return($1) as s", [loan]);
ok(r.rows?.[0]?.s === "completed", "Lender confirms too → 'completed'");
r = await as(B, "select public.submit_review($1, 5::smallint, 'Great drill, friendly lender')", [loan]);
ok(!r.error, "Borrower reviews the lender", r.error);
r = await as(B, "select public.submit_review($1, 4::smallint)", [loan]);
ok(r.error?.includes("already reviewed"), "Only one review per person per loan", r.error);
r = await as(C, "select public.submit_review($1, 1::smallint)", [loan]);
ok(r.error?.includes("not found"), "Outsiders can't review a loan", r.error);
r = await as(B, "insert into public.reviews (borrowing_id,reviewer_id,reviewee_id,rating) values ($1,$2,$3,5)", [loan, B, A]);
ok(!!r.error, "Reviews can't be inserted directly", r.error);
r = await as(null, "select * from public.profile_stats($1)", [A]);
ok(r.rows?.[0]?.lends_completed === 1 && Number(r.rows[0].average_rating) === 5, "Public profile stats", JSON.stringify(r.rows?.[0]));

// --- notifications privacy
const bNote = (await as(B, "select id from public.notifications limit 1")).rows[0].id;
r = await as(C, "update public.notifications set read_at = now() where id = $1", [bNote]);
ok(r.affected === 0, "Can't touch someone else's notifications");
r = await as(B, "update public.notifications set read_at = now() where id = $1", [bNote]);
ok(r.affected === 1, "Can mark own notification as read");
r = await as(B, "update public.notifications set title = 'x' where id = $1", [bNote]);
ok(!!r.error, "Can't rewrite a notification's text", r.error);

// --- paused item visibility
await admin("insert into public.borrowing_requests (id,item_id,borrower_id,lender_id,start_date,end_date,status) values ('22222222-2222-2222-2222-222222222222',$1,$2,$3,current_date,current_date+2,'approved')", [paused, B, A]);
await admin("insert into public.borrowings (request_id,item_id,borrower_id,lender_id,start_date,end_date) values ('22222222-2222-2222-2222-222222222222',$1,$2,$3,current_date,current_date+2)", [paused, B, A]);
r = await as(B, "select id from public.items where id = $1", [paused]);
ok(r.rows?.length === 1, "Borrower can still open a paused item they're borrowing");
r = await as(C, "select id from public.items where id = $1", [paused]);
ok(r.rows?.length === 0, "Others can't see a paused item");

// --- reports
r = await as(null, "insert into public.reports (reporter_name,reporter_email,kind,message) values ('Visitor','v@example.com','question','How does borrowing work here?')");
ok(!r.error, "Visitors can send a contact message", r.error);
r = await as(null, "insert into public.reports (reporter_name,reporter_email,kind,message,status) values ('V','v@example.com','question','Trying to set status','resolved')");
ok(!!r.error, "Senders can't set a report's status", r.error);
r = await as(C, "insert into public.reports (reporter_id,reporter_name,reporter_email,kind,message) values ($1,'C','c@example.com','user','Pretending to be B here')", [B]);
ok(!!r.error, "Can't send a report in someone else's name", r.error);
r = await as(C, "select id from public.reports");
ok(r.rows?.length === 0, "Members can't read other people's reports");
await admin("update public.profiles set is_moderator = true where id = $1", [C]);
r = await as(C, "select id from public.reports");
ok(r.rows?.length === 1, "Moderators can read reports");
r = await as(C, "update public.items set status = 'removed' where id = $1", [item]);
ok(r.affected === 1, "Moderators can remove a listing");

// --- storage
r = await as(B, "insert into storage.objects (bucket_id, name) values ('item-images', $1)", [`${A}/x/photo.jpg`]);
ok(!!r.error, "Can't upload into someone else's photo folder", r.error);
r = await as(B, "insert into storage.objects (bucket_id, name) values ('avatars', $1)", [`${B}/me.jpg`]);
ok(!r.error, "Can upload into your own folder", r.error);
r = await as(A, "insert into public.item_images (item_id, storage_path) values ($1, $2)", [paused, `${B}/stolen.jpg`]);
ok(!!r.error, "Item photos must be in the owner's own folder", r.error);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
