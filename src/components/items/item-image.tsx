import { CATEGORIES, type Category } from "@/lib/constants";
import { cn } from "@/lib/utils";

/** Each category gets its own soft background so the grid isn't monotone. */
const TINTS: Record<Category, string> = {
  electronics: "bg-[#e4ebe8] text-forest",
  books: "bg-tangerine-soft text-[#8a4f16]",
  tools: "bg-[#e9e6db] text-forest",
  sports_outdoors: "bg-fresh-soft text-forest",
  kitchen: "bg-[#f6e3dc] text-[#7c3a26]",
  home_garden: "bg-[#e6eedc] text-[#3d5a24]",
  clothing: "bg-[#ece6f0] text-[#4d3a5c]",
  toys_games: "bg-[#fdf0c9] text-[#6b5208]",
  other: "bg-muted text-stone",
};

/**
 * ItemImage — shows the item's photo, or (for listings without photos,
 * like our sample data) an illustrated placeholder with the category icon.
 */
export function ItemImage({
  src,
  alt,
  category,
  className,
  iconClassName,
}: {
  src?: string;
  alt: string;
  category: Category;
  className?: string;
  iconClassName?: string;
}) {
  if (src) {
    return (
      // Plain <img> works for any Supabase Storage URL without extra config.
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={alt} className={cn("size-full object-cover", className)} loading="lazy" />
    );
  }
  const Icon = CATEGORIES.find((c) => c.value === category)?.icon ?? CATEGORIES[8].icon;
  return (
    <div
      role="img"
      aria-label={`${alt} (no photo yet)`}
      className={cn("relative flex size-full items-center justify-center overflow-hidden", TINTS[category], className)}
    >
      {/* soft concentric rings give the placeholder some depth */}
      <span aria-hidden className="absolute size-[70%] rounded-full bg-white/35" />
      <span aria-hidden className="absolute size-[45%] rounded-full bg-white/40" />
      <Icon aria-hidden strokeWidth={1.4} className={cn("relative size-[22%] min-w-8", iconClassName)} />
    </div>
  );
}
