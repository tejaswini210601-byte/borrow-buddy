"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const NAV_LINKS = [
  { href: "/explore", label: "Explore" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/about", label: "About" },
];

/**
 * "use client" = this component runs in the browser, because it needs
 * interactivity (knowing the current page, opening the mobile menu).
 */
export function DesktopNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className="hidden md:block">
      <ul className="flex items-center gap-1">
        {NAV_LINKS.map((l) => {
          const active = !l.href.includes("#") && pathname.startsWith(l.href);
          return (
            <li key={l.href}>
              <Link
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-semibold text-charcoal/80 transition-colors hover:bg-fresh-soft hover:text-forest",
                  active && "bg-fresh-soft text-forest",
                )}
              >
                {l.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  // Remember which page the menu was opened on. Navigating to another page
  // changes `pathname`, so `open` becomes false automatically — no effect needed.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const setOpen = (next: boolean | ((o: boolean) => boolean)) =>
    setOpenOn((typeof next === "function" ? next(open) : next) ? pathname : null);

  return (
    <div className="md:hidden">
      <Button
        variant="ghost"
        size="icon"
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen((o) => !o)}
      >
        {open ? <X className="size-5" /> : <Menu className="size-5" />}
        <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
      </Button>

      {open && (
        <div
          id="mobile-menu"
          className="absolute inset-x-0 top-full border-b bg-cream px-4 pt-2 pb-6 shadow-lg animate-in fade-in-0 slide-in-from-top-2"
        >
          <nav aria-label="Main">
            <ul className="flex flex-col">
              {NAV_LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-lg px-3 py-3 font-display text-lg font-semibold text-forest hover:bg-fresh-soft"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button asChild variant="outline">
              <Link href="/login">Log in</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Sign up</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
