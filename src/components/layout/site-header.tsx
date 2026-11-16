import Link from "next/link";
import { Suspense } from "react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { getUnreadCount } from "@/lib/dashboard";
import { DesktopNav, DesktopNavLinks, MobileNav, MobileNavPlaceholder } from "./nav-links";
import { UserMenu } from "./user-menu";

/**
 * SiteHeader — the sticky navigation bar.
 * The logo and links are the same for everyone, so they load instantly.
 * The account area depends on who's logged in (it reads the login cookie),
 * so it streams in behind <Suspense>, showing the guest buttons meanwhile.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-forest/10 bg-cream/90 backdrop-blur supports-[backdrop-filter]:bg-cream/75">
      <div className="relative mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />
        {/* The nav highlights the current page, which on some pages (e.g.
            /members/<id>) is only known per request, so it streams in. */}
        <Suspense fallback={<DesktopNavLinks pathname="" />}>
          <DesktopNav />
        </Suspense>
        <div className="flex items-center gap-2">
          <Suspense fallback={<GuestButtons className="hidden md:flex" />}>
            <AccountArea />
          </Suspense>
          <Suspense fallback={<MobileNavPlaceholder />}>
            <MobileNav
              guestLinks={
                <Suspense fallback={null}>
                  <MobileGuestLinks />
                </Suspense>
              }
            />
          </Suspense>
        </div>
      </div>
    </header>
  );
}

async function AccountArea() {
  const user = await getCurrentUser();
  if (!user) return <GuestButtons className="hidden md:flex" />;
  const unread = await getUnreadCount(user.id);
  return <UserMenu user={{ displayName: user.displayName, avatarUrl: user.avatarUrl, unread }} />;
}

function GuestButtons({ className }: { className?: string }) {
  return (
    <div className={`items-center gap-2 ${className ?? ""}`}>
      <Button asChild variant="ghost" size="sm">
        <Link href="/login">Log in</Link>
      </Button>
      <Button asChild size="sm">
        <Link href="/signup">Sign up</Link>
      </Button>
    </div>
  );
}

/** In the mobile menu: account links for members, log in / sign up for guests. */
async function MobileGuestLinks() {
  const user = await getCurrentUser();
  if (user) {
    return (
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button asChild variant="outline">
          <Link href="/dashboard">Dashboard</Link>
        </Button>
        <Button asChild>
          <Link href="/items/new">List an item</Link>
        </Button>
      </div>
    );
  }
  return (
    <div className="mt-4 grid grid-cols-2 gap-2">
      <Button asChild variant="outline">
        <Link href="/login">Log in</Link>
      </Button>
      <Button asChild>
        <Link href="/signup">Sign up</Link>
      </Button>
    </div>
  );
}
