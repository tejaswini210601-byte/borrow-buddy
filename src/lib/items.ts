import { CATEGORIES, CONDITIONS, type Category, type Condition } from "./constants";
import { SAMPLE_ITEMS } from "./sample-data";
import type { Availability, Item } from "./types";

/**
 * Data access for listings.
 * Pages call these functions instead of touching data directly. Right now
 * they read sample data; in Phase 4 their insides switch to Supabase queries
 * and the pages don't need to change. This is called a "data access layer".
 */

export type ItemFilters = {
  q?: string;
  category?: Category;
  area?: string;
  availability?: Availability | "any";
  condition?: Condition;
  sort?: "newest" | "relevance";
};

const isCategory = (v: unknown): v is Category =>
  CATEGORIES.some((c) => c.value === v);
const isCondition = (v: unknown): v is Condition =>
  CONDITIONS.some((c) => c.value === v);

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

export async function getItems(filters: ItemFilters = {}): Promise<Item[]> {
  let items = SAMPLE_ITEMS.filter((i) => i.availability !== "paused");

  if (filters.q) items = items.filter((i) => relevance(i, filters.q!) > 0);
  if (filters.category) items = items.filter((i) => i.category === filters.category);
  if (filters.area) items = items.filter((i) => i.area === filters.area);
  if (filters.condition) items = items.filter((i) => i.condition === filters.condition);
  if (filters.availability === "available")
    items = items.filter((i) => i.availability === "available");

  const byNewest = (a: Item, b: Item) => b.createdAt.localeCompare(a.createdAt);
  items = [...items].sort(
    filters.sort === "relevance" && filters.q
      ? (a, b) => relevance(b, filters.q!) - relevance(a, filters.q!) || byNewest(a, b)
      : byNewest,
  );
  return items;
}

export async function getItem(id: string): Promise<Item | null> {
  return SAMPLE_ITEMS.find((i) => i.id === id) ?? null;
}

export async function getSimilarItems(item: Item, limit = 3): Promise<Item[]> {
  return SAMPLE_ITEMS.filter(
    (i) => i.id !== item.id && i.category === item.category && i.availability !== "paused",
  )
    .concat(SAMPLE_ITEMS.filter((i) => i.id !== item.id && i.category !== item.category && i.area === item.area))
    .slice(0, limit);
}

export async function getFeaturedItems(limit = 4): Promise<Item[]> {
  return (await getItems({ sort: "newest" })).slice(0, limit);
}

/** Neighbourhoods that currently have listings (for the location filter). */
export async function getAreas(): Promise<string[]> {
  return [...new Set(SAMPLE_ITEMS.map((i) => i.area))].sort();
}

export async function getAllItemIds(): Promise<string[]> {
  return SAMPLE_ITEMS.map((i) => i.id);
}
