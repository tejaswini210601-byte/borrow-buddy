"use client";

import Link from "next/link";
import { useRef } from "react";
import { DropdownMenu } from "radix-ui";
import { Bell, LayoutDashboard, LogOut, Package, Plus, UserRound } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { logOut } from "@/lib/actions/auth";
import { initials } from "@/lib/format";

export type MenuUser = { displayName: string; avatarUrl: string | null; unread: number };

/**
 * Shown in the header when someone is logged in: a bell with the number
 * of unread notifications, and their avatar, which opens a menu.
 * Radix's DropdownMenu handles keyboard use (arrows, Escape) for us.
 */
export function UserMenu({ user }: { user: MenuUser }) {
  // The log-out form lives outside the menu: choosing "Log out" closes the
  // menu (removing its contents), so the item submits this form instead.
  const logOutForm = useRef<HTMLFormElement>(null);
  return (
    <div className="flex items-center gap-1">
      <form ref={logOutForm} action={logOut} hidden />
      <Button asChild variant="ghost" size="icon" className="relative">
        <Link href="/dashboard/notifications">
          <Bell className="size-5" aria-hidden />
          <span className="sr-only">
            Notifications{user.unread ? ` (${user.unread} unread)` : ""}
          </span>
          {user.unread > 0 && (
            <span aria-hidden className="absolute top-1 right-1 flex min-w-4.5 items-center justify-center rounded-full bg-tangerine px-1 text-[0.65rem] font-bold text-charcoal">
              {user.unread > 9 ? "9+" : user.unread}
            </span>
          )}
        </Link>
      </Button>

      <DropdownMenu.Root>
        <DropdownMenu.Trigger className="cursor-pointer rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest">
          <Avatar className="size-9">
            {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt="" />}
            <AvatarFallback>{initials(user.displayName)}</AvatarFallback>
          </Avatar>
          <span className="sr-only">Open your account menu</span>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="end"
            sideOffset={8}
            className="z-50 min-w-56 rounded-xl border bg-card p-1.5 shadow-lg data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
          >
            <DropdownMenu.Label className="px-3 py-2 text-sm">
              <span className="block text-xs text-stone">Logged in as</span>
              <span className="font-semibold text-forest">{user.displayName}</span>
            </DropdownMenu.Label>
            <DropdownMenu.Separator className="my-1 h-px bg-border" />
            <MenuLink href="/dashboard" icon={LayoutDashboard}>Dashboard</MenuLink>
            <MenuLink href="/dashboard/listings" icon={Package}>My listings</MenuLink>
            <MenuLink href="/items/new" icon={Plus}>List an item</MenuLink>
            <MenuLink href="/dashboard/profile" icon={UserRound}>Profile settings</MenuLink>
            <DropdownMenu.Separator className="my-1 h-px bg-border" />
            <DropdownMenu.Item className={itemClass} onSelect={() => logOutForm.current?.requestSubmit()}>
              <LogOut className="size-4" aria-hidden />
              Log out
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  );
}

const itemClass =
  "flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold text-charcoal outline-none data-[highlighted]:bg-fresh-soft data-[highlighted]:text-forest";

function MenuLink({ href, icon: Icon, children }: { href: string; icon: typeof Bell; children: React.ReactNode }) {
  return (
    <DropdownMenu.Item asChild>
      <Link href={href} className={itemClass}>
        <Icon className="size-4" aria-hidden />
        {children}
      </Link>
    </DropdownMenu.Item>
  );
}
