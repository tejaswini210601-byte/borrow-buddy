import type { Metadata } from "next";
import { Bell } from "lucide-react";
import { MemberSection } from "@/components/dashboard/member-section";
import { PageHeader } from "@/components/layout/page-header";
import { ActionButton } from "@/components/shared/action-button";
import { EmptyState } from "@/components/shared/states";
import { markAllRead, openNotification } from "@/lib/actions/account";
import { getNotifications } from "@/lib/dashboard";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Notifications" };

const when = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export default function NotificationsPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Notifications" description="Updates about your requests and loans." />
      <MemberSection path="/dashboard/notifications">
        {async (user) => {
          const items = await getNotifications(user.id);
          if (items.length === 0) {
            return <EmptyState icon={Bell} title="No notifications yet" description="You'll hear here when someone requests your item, or replies to your request." />;
          }
          const unread = items.filter((n) => !n.read_at).length;
          return (
            <div className="flex flex-col gap-4">
              {unread > 0 && (
                <ActionButton action={markAllRead} variant="outline" pendingLabel="Marking…" className="self-end">
                  Mark all as read
                </ActionButton>
              )}
              <ul className="flex flex-col divide-y overflow-hidden rounded-xl border bg-card">
                {items.map((n) => (
                  <li key={n.id}>
                    {/* A form button (not a link) so opening it also marks it read. */}
                    <form action={openNotification.bind(null, n.id, n.link)}>
                      <button
                        type="submit"
                        className={cn(
                          "flex w-full cursor-pointer gap-3 p-4 text-left transition-colors hover:bg-fresh-soft/60 sm:p-5",
                          !n.read_at && "bg-tangerine-soft/40",
                        )}
                      >
                        <span aria-hidden className={cn("mt-2 size-2 shrink-0 rounded-full", n.read_at ? "bg-transparent" : "bg-tangerine")} />
                        <span className="flex min-w-0 flex-col gap-0.5">
                          <span className="font-semibold text-charcoal">
                            {!n.read_at && <span className="sr-only">Unread: </span>}
                            {n.title}
                          </span>
                          {n.body && <span className="text-sm text-charcoal/80">{n.body}</span>}
                          <span className="text-xs text-stone">{when.format(new Date(n.created_at))}</span>
                        </span>
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            </div>
          );
        }}
      </MemberSection>
    </div>
  );
}
