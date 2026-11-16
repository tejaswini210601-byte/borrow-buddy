import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Category } from "./constants";
import type { Database } from "./database.types";
import { ITEM_SELECT, loanMap, rowToItem } from "./items";
import { AVATAR_BUCKET, ITEM_BUCKET, publicImageUrl } from "./storage";
import { isSupabaseConfigured } from "./supabase/env";
import { createClient } from "./supabase/server";
import type { Item } from "./types";

/**
 * Data for the logged-in member's own pages (dashboard, requests, loans).
 * These read with the member's own login, so the database's security rules
 * only return THEIR requests, loans and notifications. They're never cached
 * between people.
 */

type Client = SupabaseClient<Database>;

export type Person = { id: string; displayName: string; avatarUrl: string | null; area: string | null };
export type ItemSummary = { id: string; title: string; category: Category; imageUrl: string | null };

type PersonRow = { id: string; display_name: string; avatar_path: string | null; area: string | null } | null;
type ItemSummaryRow = {
  id: string;
  title: string;
  category: Category;
  item_images: { storage_path: string; position: number }[] | null;
} | null;

const person = (p: PersonRow): Person => ({
  id: p?.id ?? "",
  displayName: p?.display_name ?? "A member",
  avatarUrl: publicImageUrl(AVATAR_BUCKET, p?.avatar_path),
  area: p?.area ?? null,
});

const itemSummary = (i: ItemSummaryRow, fallbackId: string): ItemSummary => {
  const first = [...(i?.item_images ?? [])].sort((a, b) => a.position - b.position)[0];
  return {
    id: i?.id ?? fallbackId,
    title: i?.title ?? "A listing that's no longer available",
    category: i?.category ?? "other",
    imageUrl: publicImageUrl(ITEM_BUCKET, first?.storage_path),
  };
};

const PERSON = "id, display_name, avatar_path, area";
const ITEM_SUMMARY = "id, title, category, item_images ( storage_path, position )";

async function client(): Promise<Client | null> {
  if (!isSupabaseConfigured) return null;
  return createClient();
}

// ---------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------
export type Notification = Database["public"]["Tables"]["notifications"]["Row"];

export async function getUnreadCount(userId: string): Promise<number> {
  const supabase = await client();
  if (!supabase) return 0;
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at", null);
  return count ?? 0;
}

export async function getNotifications(userId: string, limit = 50): Promise<Notification[]> {
  const supabase = await client();
  if (!supabase) return [];
  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

// ---------------------------------------------------------------------
// My listings (every status, including paused)
// ---------------------------------------------------------------------
export type MyListing = Item & { status: "active" | "paused" | "removed"; pendingRequests: number };

export async function getMyListings(userId: string): Promise<MyListing[]> {
  const supabase = await client();
  if (!supabase) return [];
  const { data } = await supabase
    .from("items")
    .select(ITEM_SELECT)
    .eq("lender_id", userId)
    .order("created_at", { ascending: false });
  const rows = (data ?? []) as unknown as Parameters<typeof rowToItem>[0][];
  const ids = rows.map((r) => r.id);
  const [onLoan, pending] = await Promise.all([
    loanMap(supabase, ids),
    ids.length
      ? supabase.from("borrowing_requests").select("item_id").eq("lender_id", userId).eq("status", "pending")
      : Promise.resolve({ data: [] as { item_id: string }[] }),
  ]);
  const counts = new Map<string, number>();
  for (const r of pending.data ?? []) counts.set(r.item_id, (counts.get(r.item_id) ?? 0) + 1);
  return rows.map((r) => ({ ...rowToItem(r, onLoan), status: r.status, pendingRequests: counts.get(r.id) ?? 0 }));
}

/** A listing its owner wants to edit (null if it isn't theirs). */
export async function getEditableItem(id: string, userId: string) {
  const supabase = await client();
  if (!supabase) return null;
  const { data } = await supabase
    .from("items")
    .select("id, lender_id, title, description, category, condition, area, status, max_days, instructions, item_images ( id, storage_path, position )")
    .eq("id", id)
    .eq("lender_id", userId)
    .maybeSingle();
  if (!data) return null;
  return {
    ...data,
    images: [...(data.item_images ?? [])]
      .sort((a, b) => a.position - b.position)
      .map((img) => ({ id: img.id, path: img.storage_path, url: publicImageUrl(ITEM_BUCKET, img.storage_path)! })),
  };
}

/** An item as the logged-in person sees it: owners can open their paused listings. */
export async function getItemAsViewer(id: string): Promise<Item | null> {
  const supabase = await client();
  if (!supabase) return null;
  const { data } = await supabase.from("items").select(ITEM_SELECT).eq("id", id).maybeSingle();
  if (!data) return null;
  const row = data as unknown as Parameters<typeof rowToItem>[0];
  return rowToItem(row, await loanMap(supabase, [row.id]));
}

// ---------------------------------------------------------------------
// Requests
// ---------------------------------------------------------------------
export type RequestView = {
  id: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  startDate: string;
  endDate: string;
  message: string | null;
  createdAt: string;
  item: ItemSummary;
  other: Person; // the borrower (incoming) or the lender (outgoing)
};

export async function getRequests(userId: string): Promise<{ incoming: RequestView[]; outgoing: RequestView[] }> {
  const supabase = await client();
  if (!supabase) return { incoming: [], outgoing: [] };
  const { data } = await supabase
    .from("borrowing_requests")
    .select(
      `id, status, start_date, end_date, message, created_at, item_id, borrower_id, lender_id,
       item:items ( ${ITEM_SUMMARY} ),
       borrower:profiles!borrowing_requests_borrower_id_fkey ( ${PERSON} ),
       lender:profiles!borrowing_requests_lender_id_fkey ( ${PERSON} )`,
    )
    .order("created_at", { ascending: false })
    .limit(100);

  type Row = {
    id: string; status: RequestView["status"]; start_date: string; end_date: string; message: string | null;
    created_at: string; item_id: string; borrower_id: string; lender_id: string;
    item: ItemSummaryRow; borrower: PersonRow; lender: PersonRow;
  };
  const rows = (data ?? []) as unknown as Row[];
  const view = (r: Row, other: PersonRow): RequestView => ({
    id: r.id,
    status: r.status,
    startDate: r.start_date,
    endDate: r.end_date,
    message: r.message,
    createdAt: r.created_at,
    item: itemSummary(r.item, r.item_id),
    other: person(other),
  });
  return {
    incoming: rows.filter((r) => r.lender_id === userId).map((r) => view(r, r.borrower)),
    outgoing: rows.filter((r) => r.borrower_id === userId).map((r) => view(r, r.lender)),
  };
}

// ---------------------------------------------------------------------
// Loans (borrowings)
// ---------------------------------------------------------------------
export type LoanView = {
  id: string;
  status: "active" | "returned" | "completed" | "cancelled";
  role: "borrower" | "lender";
  startDate: string;
  endDate: string;
  pickupDetails: string | null;
  returnedAt: string | null;
  iConfirmed: boolean;
  theyConfirmed: boolean;
  reviewed: boolean; // have I already reviewed this loan?
  item: ItemSummary;
  other: Person;
};

export async function getLoans(userId: string): Promise<LoanView[]> {
  const supabase = await client();
  if (!supabase) return [];
  const { data } = await supabase
    .from("borrowings")
    .select(
      `id, status, start_date, end_date, pickup_details, returned_at, lender_confirmed_at, borrower_confirmed_at,
       item_id, borrower_id, lender_id,
       item:items ( ${ITEM_SUMMARY} ),
       borrower:profiles!borrowings_borrower_id_fkey ( ${PERSON} ),
       lender:profiles!borrowings_lender_id_fkey ( ${PERSON} )`,
    )
    .order("start_date", { ascending: false })
    .limit(200);

  type Row = {
    id: string; status: LoanView["status"]; start_date: string; end_date: string; pickup_details: string | null;
    returned_at: string | null; lender_confirmed_at: string | null; borrower_confirmed_at: string | null;
    item_id: string; borrower_id: string; lender_id: string;
    item: ItemSummaryRow; borrower: PersonRow; lender: PersonRow;
  };
  const rows = (data ?? []) as unknown as Row[];

  const { data: myReviews } = rows.length
    ? await supabase.from("reviews").select("borrowing_id").eq("reviewer_id", userId).in("borrowing_id", rows.map((r) => r.id))
    : { data: [] as { borrowing_id: string }[] };
  const reviewed = new Set((myReviews ?? []).map((r) => r.borrowing_id));

  return rows.map((r) => {
    const isLender = r.lender_id === userId;
    return {
      id: r.id,
      status: r.status,
      role: isLender ? "lender" : "borrower",
      startDate: r.start_date,
      endDate: r.end_date,
      pickupDetails: r.pickup_details,
      returnedAt: r.returned_at,
      iConfirmed: Boolean(isLender ? r.lender_confirmed_at : r.borrower_confirmed_at),
      theyConfirmed: Boolean(isLender ? r.borrower_confirmed_at : r.lender_confirmed_at),
      reviewed: reviewed.has(r.id),
      item: itemSummary(r.item, r.item_id),
      other: person(isLender ? r.borrower : r.lender),
    };
  });
}

// ---------------------------------------------------------------------
// Public profiles
// ---------------------------------------------------------------------
export type ProfileStats = Database["public"]["Functions"]["profile_stats"]["Returns"][number];
export type ReviewView = { id: string; rating: number; comment: string | null; createdAt: string; reviewer: Person };

export async function getPublicProfile(id: string) {
  const supabase = await client();
  if (!supabase) return null;
  const { data: p } = await supabase.from("profiles").select("id, display_name, bio, area, avatar_path, created_at").eq("id", id).maybeSingle();
  if (!p) return null;
  const [{ data: stats }, { data: reviews }] = await Promise.all([
    supabase.rpc("profile_stats", { p_user_id: id }),
    supabase
      .from("reviews")
      .select(`id, rating, comment, created_at, reviewer:profiles!reviews_reviewer_id_fkey ( ${PERSON} )`)
      .eq("reviewee_id", id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);
  type ReviewRow = { id: string; rating: number; comment: string | null; created_at: string; reviewer: PersonRow };
  return {
    id: p.id,
    displayName: p.display_name,
    bio: p.bio,
    area: p.area,
    avatarUrl: publicImageUrl(AVATAR_BUCKET, p.avatar_path),
    memberSince: p.created_at,
    stats: stats?.[0] ?? null,
    reviews: ((reviews ?? []) as unknown as ReviewRow[]).map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.created_at,
      reviewer: person(r.reviewer),
    })),
  };
}

/** Dates an item is already booked, so the request form can warn about them. */
export async function getBookedRanges(itemId: string) {
  const supabase = await client();
  if (!supabase) return [];
  const { data } = await supabase.rpc("item_booked_ranges", { p_item_id: itemId });
  return data ?? [];
}
