import * as React from "react";
import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Button — pill-shaped, with variants for each job.
 * Use `asChild` to style a <Link> as a button:
 *   <Button asChild><Link href="/explore">Explore items</Link></Button>
 */
const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 cursor-pointer",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-forest-deep",
        secondary: "bg-secondary text-secondary-foreground hover:bg-fresh/30",
        outline:
          "border border-forest/25 bg-card text-forest hover:border-forest hover:bg-fresh-soft",
        ghost: "text-forest hover:bg-fresh-soft",
        destructive: "bg-destructive text-white hover:bg-destructive/90",
        link: "rounded-none px-0 text-forest underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-5 text-sm",
        sm: "h-9 px-4 text-sm",
        lg: "h-13 px-7 text-base",
        icon: "size-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
