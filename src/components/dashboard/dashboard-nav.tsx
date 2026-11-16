"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, History, Home, Inbox, Package, PackageOpen, Send, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

export const DASHBOARD_LINKS = [
  { href: "/dashboard", label: "Overview", icon: Home },
  { href: "/dashboard/listings", label: "My listings", icon: Package },
  { href: "/dashboard/requests", label: "Requests", icon: Inbox },
  { href: "/dashboard/borrowing", label: "Borrowing", icon: PackageOpen },
  { href: "/dashboard/lending", label: "Lending", icon: Send },
  { href: "/dashboard/history", label: "History", icon: History },
  { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
  { href: "/dashboard/profile", label: "Profile", icon: UserRound },
];

/**
 * Dashboard tabs. A sidebar on big screens; a row you can swipe sideways on phones.
 */
export function DashboardNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Dashboard" className="-mx-4 overflow-x-auto px-4 lg:mx-0 lg:overflow-visible lg:px-0">
      <ul className="flex gap-1 lg:flex-col">
        {DASHBOARD_LINKS.map(({ href, label, icon: Icon }) => {
          const active = href === "/dashboard" ? pathname === href : pathname.startsWith(href);
          return (
            <li key={href} className="shrink-0">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap text-charcoal/80 transition-colors hover:bg-fresh-soft hover:text-forest lg:rounded-lg",
                  active && "bg-forest text-white hover:bg-forest hover:text-white",
                )}
              >
                <Icon className="size-4" aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
