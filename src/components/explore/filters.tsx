import Link from "next/link";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { CATEGORIES, CONDITIONS } from "@/lib/constants";
import type { ItemFilters } from "@/lib/items";
import { AutoSubmitForm } from "./auto-submit-form";

/** Search + filter form for /explore. Values live in the URL. */
export function Filters({
  filters,
  areas,
  view,
}: {
  filters: ItemFilters;
  areas: string[];
  view: "grid" | "list";
}) {
  const hasFilters = Boolean(
    filters.q || filters.category || filters.area || filters.condition || filters.availability === "available",
  );

  return (
    <AutoSubmitForm action="/explore" role="search" className="flex flex-col gap-4 rounded-2xl border bg-card p-4 sm:p-5">
      {view === "list" && <input type="hidden" name="view" value="list" />}

      <div className="flex gap-2">
        <label htmlFor="explore-q" className="sr-only">
          Search items
        </label>
        <div className="relative flex-1">
          <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-stone" />
          <input
            id="explore-q"
            name="q"
            type="search"
            defaultValue={filters.q}
            placeholder="What do you need today?"
            className="h-11 w-full rounded-md border border-input bg-cream/50 pr-3 pl-10 text-base outline-none transition-colors focus-visible:border-forest focus-visible:ring-3 focus-visible:ring-forest/15"
          />
        </div>
        <Button type="submit">Search</Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <FilterField id="f-category" label="Category">
          <NativeSelect id="f-category" name="category" defaultValue={filters.category ?? ""}>
            <option value="">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </NativeSelect>
        </FilterField>
        <FilterField id="f-area" label="Location">
          <NativeSelect id="f-area" name="area" defaultValue={filters.area ?? ""}>
            <option value="">Anywhere</option>
            {areas.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </NativeSelect>
        </FilterField>
        <FilterField id="f-availability" label="Availability">
          <NativeSelect id="f-availability" name="availability" defaultValue={filters.availability ?? ""}>
            <option value="">Any</option>
            <option value="available">Available now</option>
          </NativeSelect>
        </FilterField>
        <FilterField id="f-condition" label="Condition">
          <NativeSelect id="f-condition" name="condition" defaultValue={filters.condition ?? ""}>
            <option value="">Any condition</option>
            {CONDITIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </NativeSelect>
        </FilterField>
        <FilterField id="f-sort" label="Sort by" className="col-span-2 lg:col-span-1">
          <NativeSelect id="f-sort" name="sort" defaultValue={filters.sort}>
            <option value="newest">Newest first</option>
            <option value="relevance">Best match</option>
          </NativeSelect>
        </FilterField>
      </div>

      {hasFilters && (
        <Link href={view === "list" ? "/explore?view=list" : "/explore"} className="self-start text-sm font-semibold text-forest underline-offset-4 hover:underline">
          Clear all filters
        </Link>
      )}
    </AutoSubmitForm>
  );
}

function FilterField({
  id,
  label,
  className,
  children,
}: {
  id: string;
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className ?? ""}`}>
      <label htmlFor={id} className="text-xs font-semibold text-stone">
        {label}
      </label>
      {children}
    </div>
  );
}
