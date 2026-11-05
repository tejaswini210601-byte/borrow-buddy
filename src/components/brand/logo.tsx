import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Logo mark: two overlapping rounded tags — one item, two people.
 * It's an inline SVG so it stays sharp at any size and needs no image file.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" aria-hidden className={cn("size-9", className)}>
      <rect x="3" y="9" width="22" height="26" rx="6" fill="var(--fresh)" transform="rotate(-10 14 22)" />
      <rect x="14" y="5" width="22" height="26" rx="6" fill="var(--forest)" transform="rotate(8 25 18)" />
      <circle cx="25.5" cy="11.5" r="2.6" fill="var(--cream)" />
    </svg>
  );
}

export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link
      href={href}
      className={cn("inline-flex items-center gap-2 rounded-md text-forest", className)}
      aria-label="Borrow Buddy home"
    >
      <LogoMark />
      <span className="font-display text-xl font-bold tracking-tight">Borrow Buddy</span>
    </Link>
  );
}
