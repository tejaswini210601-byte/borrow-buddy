import Link from "next/link";
import { CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";

/** Category shortcuts. Each one opens Explore filtered to that category. */
export function CategoryLinks({ className }: { className?: string }) {
  return (
    <ul className={cn("flex flex-wrap gap-2", className)}>
      {CATEGORIES.map(({ value, label, icon: Icon }) => (
        <li key={value}>
          <Link
            href={`/explore?category=${value}`}
            className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-2.5 text-sm font-semibold text-forest transition-colors hover:border-forest hover:bg-fresh-soft"
          >
            <Icon className="size-4" aria-hidden />
            {label}
          </Link>
        </li>
      ))}
    </ul>
  );
}
