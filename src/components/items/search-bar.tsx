import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * SearchBar — a plain HTML GET form that sends people to /explore?q=...
 * Because it's a normal form, it works even before JavaScript loads.
 */
export function SearchBar({
  defaultValue,
  className,
  size = "lg",
}: {
  defaultValue?: string;
  className?: string;
  size?: "lg" | "md";
}) {
  const big = size === "lg";
  return (
    <form action="/explore" role="search" className={cn("flex w-full gap-2", className)}>
      <label htmlFor={big ? "hero-search" : "search"} className="sr-only">
        What do you need today?
      </label>
      <div className="relative flex-1">
        <Search aria-hidden className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-stone" />
        <input
          id={big ? "hero-search" : "search"}
          name="q"
          type="search"
          defaultValue={defaultValue}
          placeholder="What do you need today?"
          className={cn(
            "w-full rounded-full border border-input bg-card pr-4 pl-12 text-base text-charcoal placeholder:text-muted-foreground outline-none transition-colors focus-visible:border-forest focus-visible:ring-3 focus-visible:ring-forest/15",
            big ? "h-14" : "h-12",
          )}
        />
      </div>
      <Button type="submit" size={big ? "lg" : "default"} className={big ? "h-14" : "h-12"}>
        Search
      </Button>
    </form>
  );
}
