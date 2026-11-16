import { cacheLife, cacheTag } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { CATEGORIES, CONDITIONS, type Category, type Condition } from "./constants";
import { SAMPLE_ITEMS } from "./sample-data";
import { ITEM_BUCKET, AVATAR_BUCKET, publicImageUrl } from "./storage";
import { isSupabaseConfigured } from "./supabase/env";
import { createPublicClient } from "./supabase/public";
import type { Availability, Item } from "./types";

/**
 * Data access for listings ("data access layer").
 * Pages call these functions instead of talking to the database directly.
 *
 * Real listings come from Supabase. The sample listings from Phase 2 are
 * still shown too (always labelled "Sample listing"), so the site never
 * looks empty while the community is small.
 *
 * Public reads use `"use cache"`: the result is kept for a few minutes and
 * shared by all visitors, so the homepage and Explore stay fast. When a
 * listing changes, the actions call updateTag("items") to refresh it.
 */

export type ItemFilters = {
  q?: string;
  category?: Category;
  area?: string;
  availability?: Availability | "any";
  condition?: Condition;
  sort?: "newest" | "relevance";
};

const isCategory = (v: unknown): v is Category => CATEGORIES.some((c) => c.value === v);
const isCondition = (v: unknown): v is Condition => CONDITIONS.some((c) => c.value === v);
export const isUuid = (v: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

/** Turns raw URL search params into safe, typed filters (ignores junk). */
export function parseFilters(sp: Record<string, string | string[] | undefined>): ItemFilters {
  const one = (k: string) => {
    const v = sp[k];
    return (Array.isArray(v) ? v[0] : v)?.trim() || undefined;
  };
  const q = one("q")?.slice(0, 100);
  const category = one("category");
  const condition = one("condition");
  const availability = one("availability");
  const sort = one("sort");
  return {
    q,
    category: isCategory(category) ? category : undefined,
    area: one("area")?.slice(0, 60),
    condition: isCondition(condition) ? condition : undefined,
    availability: availability === "any" ? "any" : availability === "available" ? "available" : undefined,
    sort: sort === "newest" || sort === "relevance" ? sort : q ? "relevance" : "newest",
  };
}

function relevance(item: Item, q: string) {
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
  const title = item.title.toLowerCase();
  const desc = item.description.toLowerCase();
  let score = 0;
  for (const t of terms) {
    if (title.includes(t)) score += title.startsWith(t) ? 5 : 3;
    if (desc.includes(t)) score += 1;
  }
  return score;
}

/** The same filter rules, applied in code (used for the sample listings). */
function applyFilters(items: Item[], filters: ItemFilters) {
  let out = items.filter((i) => i.availability !== "paused");
  if (filters.q) out = out.filter((i) => relevance(i, filters.q!) > 0);
  if (filters.category) out = out.filter((i) => i.category === filters.category);
  if (filters.area) out = out.filter((i) => i.area.toLowerCase() === filters.area!.toLowerCase());
  if (filters.condition) out = out.filter((i) => i.condition === filters.condition);
  if (filters.availability === "available") out = out.filter((i) => i.availability === "available");
  return out;
}

function sortItems(items: Item[], filters: ItemFilters) {
  // Real listings before samples; then newest (or best match) first.
  const byNewest = (a: Item, b: Item) =>
    Number(a.isSample) - Number(b.isSample) || b.createdAt.localeCompare(a.createdAt);
  return [...items].sort(
    filters.sort === "relevance" && filters.q
      ? (a, b) => relevance(b, filters.q!) - relevance(a, filters.q!) || byNewest(a, b)
      : byNewest,
  );
}

// ---------------------------------------------------------------------
// Turning database rows into the Item shape the pages use
// ---------------------------------------------------------------------
export const ITEM_SELECT = `
  id, title, description, category, condition, area, status, max_days, instructions, is_sample, created_at,
  lender:profiles!items_lender_id_fkey ( id, display_name, bio, area, avatar_path, created_at ),
  item_images ( storage_path, position )
` as const;

type ItemRow = {
  id: string;
  title: string;
  description: string;
  category: Category;
  condition: Condition;
  area: string;
  status: "active" | "paused" | "removed";
  max_days: number | null;
  instructions: string | null;
  is_sample: boolean;
  created_at: string;
  lender: { id: string; display_name: string; bio: string | null; area: string | null; avatar_path: string | null; created_at: string } | null;
  item_images: { storage_path: string; position: number }[] | null;
};

export function rowToItem(row: ItemRow, onLoan: Map<string, string>): Item {
  const due = onLoan.get(row.id) ?? null;
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    condition: row.condition,
    area: row.area,
    availability: row.status !== "active" ? "paused" : due ? "on_loan" : "available",
    dueBack: due,
    maxDays: row.max_days,
    instructions: row.instructions,
    images: [...(row.item_images ?? [])]
      .sort((a, b) => a.position - b.position)
      .map((img) => publicImageUrl(ITEM_BUCKET, img.storage_path))
      .filter((u): u is string => Boolean(u)),
    lender: {
      id: row.lender?.id ?? "",
      displayName: row.lender?.display_name ?? "Member",
      bio: row.lender?.bio ?? null,
      area: row.lender?.area ?? row.area,
      avatarUrl: publicImageUrl(AVATAR_BUCKET, row.lender?.avatar_path),
      memberSince: row.lender?.created_at ?? row.created_at,
    },
    createdAt: row.created_at,
    isSample: row.is_sample,
  };
}

/** Asks the database which of these items are on loan today. */
export async function loanMap(
  client: SupabaseClient<Database>,
  ids: string[],
): Promise<Map<string, string>> {
  if (ids.length === 0) return new Map();
  const { data } = await client.rpc("items_on_loan", { p_item_ids: ids });
  return new Map((data ?? []).map((r) => [r.item_id, r.due_back]));
}

// ---------------------------------------------------------------------
// Cached public reads (no login involved)
// ---------------------------------------------------------------------
async function fetchPublicItems(filters: ItemFilters): Promise<Item[]> {
  "use cache";
  cacheTag("items");
  cacheLife("minutes");
  if (!isSupabaseConfigured) return [];

  const supabase = createPublicClient();
  let query = supabase.from("items").select(ITEM_SELECT).eq("status", "active").order("created_at", { ascending: false }).limit(60);
  if (filters.q) query = query.textSearch("search", filters.q, { type: "websearch", config: "english" });
  if (filters.category) query = query.eq("category", filters.category);
  if (filters.area) query = query.ilike("area", filters.area);
  if (filters.condition) query = query.eq("condition", filters.condition);

  const { data, error } = await query;
  if (error) {
    console.error("items query failed", error.message);
    return [];
  }
  const rows = data as unknown as ItemRow[];
  const onLoan = await loanMap(supabase, rows.map((r) => r.id));
  return rows.map((r) => rowToItem(r, onLoan));
}

async function fetchPublicItem(id: string): Promise<Item | null> {
  "use cache";
  cacheTag("items", `item:${id}`);
  cacheLife("minutes");
  if (!isSupabaseConfigured) return null;

  const supabase = createPublicClient();
  const { data } = await supabase.from("items").select(ITEM_SELECT).eq("id", id).maybeSingle();
  if (!data) return null;
  const row = data as unknown as ItemRow;
  return rowToItem(row, await loanMap(supabase, [row.id]));
}

async function fetchLenderItems(lenderId: string): Promise<Item[]> {
  "use cache";
  cacheTag("items");
  cacheLife("minutes");
  if (!isSupabaseConfigured) return [];

  const supabase = createPublicClient();
  const { data } = await supabase
    .from("items")
    .select(ITEM_SELECT)
    .eq("lender_id", lenderId)
    .eq("status", "active")
    .order("created_at", { ascending: false });
  const rows = (data ?? []) as unknown as ItemRow[];
  const onLoan = await loanMap(supabase, rows.map((r) => r.id));
  return rows.map((r) => rowToItem(r, onLoan));
}

// ---------------------------------------------------------------------
// What the pages call
// ---------------------------------------------------------------------
export async function getItems(filters: ItemFilters = {}): Promise<Item[]> {
  const real = await fetchPublicItems({ ...filters, sort: undefined, availability: undefined });
  const all = applyFilters([...real, ...SAMPLE_ITEMS], filters);
  return sortItems(all, filters);
}

/** One listing as any visitor sees it (active listings only, plus samples). */
export async function getItem(id: string): Promise<Item | null> {
  if (isUuid(id)) return fetchPublicItem(id);
  return SAMPLE_ITEMS.find((i) => i.id === id) ?? null;
}

export async function getSimilarItems(item: Item, limit = 3): Promise<Item[]> {
  const pool = (await getItems()).filter((i) => i.id !== item.id && i.availability !== "paused");
  return [
    ...pool.filter((i) => i.category === item.category),
    ...pool.filter((i) => i.category !== item.category && i.area === item.area),
  ].slice(0, limit);
}

export async function getFeaturedItems(limit = 4): Promise<Item[]> {
  return (await getItems({ sort: "newest" })).slice(0, limit);
}

/** Neighbourhoods that currently have listings (for the location filter). */
export async function getAreas(): Promise<string[]> {
  const items = await getItems();
  return [...new Set(items.map((i) => i.area))].sort((a, b) => a.localeCompare(b));
}

/** Pre-built pages: the sample listings. Real listings are built on first visit. */
export async function getAllItemIds(): Promise<string[]> {
  return SAMPLE_ITEMS.map((i) => i.id);
}

/** A member's active listings, for their public profile. */
export async function getItemsByLender(lenderId: string): Promise<Item[]> {
  if (!isUuid(lenderId)) return SAMPLE_ITEMS.filter((i) => i.lender.id === lenderId);
  return fetchLenderItems(lenderId);
}
