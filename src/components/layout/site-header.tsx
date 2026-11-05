import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { DesktopNav, MobileNav } from "./nav-links";

/**
 * SiteHeader — the sticky navigation bar on public pages.
 * It's a Server Component; only the interactive parts (nav-links.tsx) run
 * in the browser. In Phase 4 the Log in / Sign up buttons change to the
 * user's avatar menu when they're logged in.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-forest/10 bg-cream/90 backdrop-blur supports-[backdrop-filter]:bg-cream/75">
      <div className="relative mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />
        <DesktopNav />
        <div className="hidden items-center gap-2 md:flex">
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">Log in</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/signup">Sign up</Link>
          </Button>
        </div>
        <MobileNav />
      </div>
    </header>
  );
}
