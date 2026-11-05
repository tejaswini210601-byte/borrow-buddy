import Link from "next/link";
import { AvailabilityTag } from "@/components/items/availability-tag";
import { ItemImage } from "@/components/items/item-image";
import type { Item } from "@/lib/types";

/**
 * HeroBoard — the homepage's signature visual: a few real listings pinned
 * up like tagged items on a shared shelf, each with its lending tag.
 * Slight rotations make it feel hand-arranged rather than a rigid grid.
 */
const PLACEMENT = [
  "sm:rotate-[-4deg] sm:translate-y-6",
  "sm:rotate-[3deg] sm:-translate-y-2",
  "sm:rotate-[-2deg] sm:translate-y-10",
];

export function HeroBoard({ items }: { items: Item[] }) {
  return (
    <div className="relative">
      {/* the "string" the tags hang from */}
      <svg aria-hidden viewBox="0 0 600 60" preserveAspectRatio="none" className="absolute inset-x-0 -top-3 hidden h-10 w-full sm:block">
        <path d="M0 10 Q 300 70 600 10" fill="none" stroke="var(--forest)" strokeOpacity="0.25" strokeWidth="2" strokeDasharray="6 6" />
      </svg>
      <ul className="grid grid-cols-3 gap-3 sm:gap-5">
        {items.slice(0, 3).map((item, i) => (
          <li key={item.id} className={`transition-transform motion-safe:duration-500 ${PLACEMENT[i]}`}>
            <Link
              href={`/items/${item.id}`}
              className="block overflow-hidden rounded-xl border border-forest/10 bg-card shadow-[0_18px_40px_-24px_rgb(23_75_58/0.45)] transition-transform hover:-translate-y-1"
            >
              <div className="relative aspect-[3/4]">
                <ItemImage src={item.images[0]} alt={item.title} category={item.category} iconClassName="size-[30%]" />
                <AvailabilityTag item={item} className="absolute top-2 left-2 hidden text-[0.65rem] sm:inline-flex" />
              </div>
              <p className="truncate px-3 py-2.5 text-xs font-semibold text-charcoal sm:text-sm">{item.title}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
