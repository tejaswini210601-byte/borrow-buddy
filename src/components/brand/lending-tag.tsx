import { cn } from "@/lib/utils";

/**
 * LendingTag — Borrow Buddy's signature visual.
 * It looks like a paper luggage/library tag: a notched top corner and a
 * punched hole. We use it for the "due back" date and item status, so the
 * design itself says "this thing is on loan".
 */
export function LendingTag({
  children,
  tone = "tangerine",
  className,
}: {
  children: React.ReactNode;
  tone?: "tangerine" | "fresh" | "cream";
  className?: string;
}) {
  const tones = {
    tangerine: "bg-tangerine text-charcoal",
    fresh: "bg-fresh text-forest-deep",
    cream: "bg-cream text-forest border border-forest/15",
  };
  return (
    <span
      className={cn(
        "relative inline-flex items-center gap-1.5 py-1 pr-3 pl-6 text-xs font-bold",
        "[clip-path:polygon(10px_0,100%_0,100%_100%,10px_100%,0_50%)] rounded-r-sm",
        tones[tone],
        className,
      )}
    >
      {/* the punched hole */}
      <span aria-hidden className="absolute top-1/2 left-2.5 size-1.5 -translate-y-1/2 rounded-full bg-white/90" />
      {children}
    </span>
  );
}
