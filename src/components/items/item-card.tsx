import Link from "next/link";
import { MapPin } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CATEGORIES, CONDITIONS, labelFor } from "@/lib/constants";
import { initials } from "@/lib/format";
import type { Item } from "@/lib/types";
import { cn } from "@/lib/utils";
import { AvailabilityTag } from "./availability-tag";
import { ItemImage } from "./item-image";

/**
 * ItemCard — one listing in a grid or list.
 * The whole card is clickable (the title link stretches over it using
 * after:absolute), while the "Request to borrow" button stays separately
 * clickable on top (relative z-10).
 */
export function ItemCard({ item, layout = "grid" }: { item: Item; layout?: "grid" | "list" }) {
  const href = `/items/${item.id}`;
  const meta = `${labelFor(CATEGORIES, item.category)} · ${labelFor(CONDITIONS, item.condition)}`;
  const isList = layout === "list";

  return (
    <article
      className={cn(
        "group relative flex w-full overflow-hidden rounded-xl border bg-card transition-colors hover:border-forest/30",
        isList ? "flex-col sm:flex-row" : "flex-col",
      )}
    >
      <div className={cn("relative shrink-0", isList ? "aspect-[4/3] sm:aspect-square sm:w-52" : "aspect-[4/3]")}>
        <ItemImage src={item.images[0]} alt={item.title} category={item.category} />
        <AvailabilityTag item={item} className="absolute top-3 left-3" />
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
        <div className="flex flex-col gap-1">
          <h3 className="text-lg leading-snug">
            <Link href={href} className="after:absolute after:inset-0 focus-visible:outline-none after:rounded-xl focus-visible:after:outline-2 focus-visible:after:outline-forest">
              {item.title}
            </Link>
          </h3>
          <p className="text-sm text-muted-foreground">{meta}</p>
          {isList && (
            <p className="mt-1 line-clamp-2 max-w-prose text-sm text-charcoal/80">{item.description}</p>
          )}
        </div>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <Avatar className="size-7">
              <AvatarFallback className="text-[0.65rem]">{initials(item.lender.displayName)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 text-xs leading-tight">
              <p className="truncate font-semibold text-charcoal">{item.lender.displayName}</p>
              <p className="flex items-center gap-1 text-muted-foreground">
                <MapPin className="size-3" aria-hidden />
                {item.area}
              </p>
            </div>
          </div>
          {item.isSample && <Badge variant="outline">Sample listing</Badge>}
        </div>

        <Button
          asChild
          size="sm"
          variant={item.availability === "available" ? "default" : "outline"}
          className={cn("relative z-10", isList ? "self-start" : "w-full")}
        >
          <Link href={`${href}#request`}>
            {item.availability === "available" ? "Request to borrow" : "Request later dates"}
          </Link>
        </Button>
      </div>
    </article>
  );
}
