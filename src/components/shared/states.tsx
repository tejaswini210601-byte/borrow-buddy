import type { LucideIcon } from "lucide-react";
import { AlertTriangle, PackageOpen } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * EmptyState — shown when a list has nothing in it.
 * Its job is to tell people what to do next, so it usually has a button.
 */
export function EmptyState({
  icon: Icon = PackageOpen,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-2xl border border-dashed border-forest/20 bg-card/60 px-6 py-14 text-center",
        className,
      )}
    >
      <span className="flex size-12 items-center justify-center rounded-full bg-fresh-soft text-forest">
        <Icon className="size-6" aria-hidden />
      </span>
      <h3 className="text-lg">{title}</h3>
      {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/** ErrorState — says what went wrong and how to recover. */
export function ErrorState({
  title = "This section didn't load",
  description = "Check your connection and try again.",
  action,
  className,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-start gap-2 rounded-xl border border-destructive/25 bg-destructive/5 p-5",
        className,
      )}
    >
      <div className="flex items-center gap-2 font-semibold text-destructive">
        <AlertTriangle className="size-4" aria-hidden />
        {title}
      </div>
      <p className="text-sm text-charcoal/80">{description}</p>
      {action}
    </div>
  );
}
