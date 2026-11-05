import * as React from "react";
import { ChevronDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * NativeSelect — a styled browser <select>.
 * Used in plain HTML forms (like the Explore filters) because it submits
 * with the form and works without JavaScript. Use <Select> for richer UI.
 */
function NativeSelect({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <div className={cn("relative", className)}>
      <select
        className="h-11 w-full cursor-pointer appearance-none rounded-md border border-input bg-card pr-9 pl-3.5 text-sm text-charcoal outline-none transition-colors focus-visible:border-forest focus-visible:ring-3 focus-visible:ring-forest/15"
        {...props}
      >
        {children}
      </select>
      <ChevronDownIcon aria-hidden className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-stone" />
    </div>
  );
}

export { NativeSelect };
