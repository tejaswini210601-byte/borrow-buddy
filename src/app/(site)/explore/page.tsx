import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { LayoutGrid, List, SearchX } from "lucide-react";
import { Filters } from "@/components/explore/filters";
import { ItemCard } from "@/components/items/item-card";
import { EmptyState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getAreas, getItems, parseFilters } from "@/lib/items";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Explore items",
  description: "Search things your neighbours lend: tools, books, outdoor gear, electronics and more.",
};

type SearchParams = Record<string, string | string[] | undefined>;

/**
 * /explore — the marketplace.
 * The heading is static (prerendered). Everything that depends on the URL
 * (?q=, ?category=…) sits inside <Suspense>, so it's computed per request
 * while the page shell shows instantly. That's how Cache Components works.
 */
export default function ExplorePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="flex max-w-2xl flex-col gap-3">
        <h1 className="text-[clamp(2.25rem,5vw,3.5rem)]">Explore items</h1>
        <p className="text-charcoal/75">
          Everything here is lent by people in Joensuu. Find what you need, pick your dates, and send a request.
        </p>
      </div>
      <Suspense fallback={<ResultsSkeleton />}>
        <Results searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Results({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const filters = parseFilters(sp);
  const view = sp.view === "list" ? "list" : "grid";
  const [items, areas] = await Promise.all([getItems(filters), getAreas()]);

  // Build links for the grid/list toggle that keep the current filters.
  const viewHref = (v: "grid" | "list") => {
    const p = new URLSearchParams();
    Object.entries(sp).forEach(([k, val]) => {
      if (k !== "view" && typeof val === "string" && val) p.set(k, val);
    });
    if (v === "list") p.set("view", "list");
    const s = p.toString();
    return s ? `/explore?${s}` : "/explore";
  };

  return (
    <div className="mt-8 flex flex-col gap-6">
      <Filters filters={filters} areas={areas} view={view} />

      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-stone" aria-live="polite">
          <span className="font-bold text-charcoal tabular-nums">{items.length}</span>{" "}
          {items.length === 1 ? "item" : "items"}
          {filters.q && (
            <>
              {" "}matching <span className="font-semibold text-charcoal">“{filters.q}”</span>
            </>
          )}
        </p>
        <div className="flex rounded-full border bg-card p-1" role="group" aria-label="Layout">
          {(["grid", "list"] as const).map((v) => {
            const Icon = v === "grid" ? LayoutGrid : List;
            return (
              <Link
                key={v}
                href={viewHref(v)}
                aria-current={view === v ? "true" : undefined}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-stone transition-colors",
                  view === v ? "bg-forest text-white" : "hover:text-forest",
                )}
              >
                <Icon className="size-3.5" aria-hidden />
                {v === "grid" ? "Grid" : "List"}
              </Link>
            );
          })}
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="Nothing matches those filters"
          description="Try a different word, or remove a filter to see more items."
          action={
            <Button asChild variant="outline">
              <Link href="/explore">Clear all filters</Link>
            </Button>
          }
        />
      ) : (
        <ul className={cn("grid gap-5", view === "grid" ? "sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1")}>
          {items.map((item) => (
            <li key={item.id} className="flex">
              <ItemCard item={item} layout={view} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ResultsSkeleton() {
  return (
    <div className="mt-8 flex flex-col gap-6" aria-busy="true" aria-label="Loading items">
      <Skeleton className="h-40 rounded-2xl" />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-96 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
