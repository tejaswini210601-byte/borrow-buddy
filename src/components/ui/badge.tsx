import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/** Badge — small status chip (e.g. "Available", "Pending", "Like new"). */
const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-xs font-semibold whitespace-nowrap [&_svg]:size-3",
  {
    variants: {
      variant: {
        default: "bg-fresh-soft text-forest",
        neutral: "bg-muted text-stone",
        warm: "bg-tangerine-soft text-charcoal",
        solid: "bg-forest text-white",
        danger: "bg-destructive/10 text-destructive",
        outline: "border border-border text-stone",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
