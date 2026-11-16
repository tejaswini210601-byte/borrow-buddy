import type { Metadata } from "next";
import Link from "next/link";
import { Bell, Inbox, PackageOpen, Plus, Send } from "lucide-react";
import { LoanCard, RequestCard, loanPhase } from "@/components/dashboard/cards";
import { MemberSection, todayIso } from "@/components/dashboard/member-section";
import { EmptyState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { getLoans, getRequests, getUnreadCount } from "@/lib/dashboard";

export const metadata: Metadata = { title: "Your dashboard" };

export default function DashboardPage() {
  return (
    <MemberSection path="/dashboard">
      {async (user) => {
        const today = todayIso();
        const [{ incoming }, loans, unread] = await Promise.all([getRequests(user.id), getLoans(user.id), getUnreadCount(user.id)]);
        const waiting = incoming.filter((r) => r.status === "pending");
        const live = loans.filter((l) => l.status === "active" || l.status === "returned");
        const borrowing = live.filter((l) => l.role === "borrower");
        const lending = live.filter((l) => l.role === "lender");
        // "Needs you": requests to answer, and returns waiting for your confirmation.
        const needsYou = live.filter((l) => {
          const p = loanPhase(l, today);
          return p === "overdue" || (p === "returned" && !l.iConfirmed);
        });

        return (
          <div className="flex flex-col gap-10">
            <header className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-stone">Your dashboard</p>
                <h1 className="text-[clamp(1.875rem,4vw,2.75rem)]">Hi, {user.displayName.split(" ")[0]}</h1>
              </div>
              <Button asChild>
                <Link href="/items/new">
                  <Plus aria-hidden />
                  List an item
                </Link>
              </Button>
            </header>

            <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Stat href="/dashboard/requests" icon={Inbox} value={waiting.length} label="Requests to answer" highlight={waiting.length > 0} />
              <Stat href="/dashboard/borrowing" icon={PackageOpen} value={borrowing.length} label="Things you're borrowing" />
              <Stat href="/dashboard/lending" icon={Send} value={lending.length} label="Things you're lending" />
              <Stat href="/dashboard/notifications" icon={Bell} value={unread} label="Unread notifications" highlight={unread > 0} />
            </ul>

            <section aria-labelledby="todo" className="flex flex-col gap-4">
              <h2 id="todo" className="text-2xl">Needs your attention</h2>
              {waiting.length === 0 && needsYou.length === 0 ? (
                <EmptyState
                  title="You're all caught up"
                  description="New requests and returns to confirm will show up here."
                  action={
                    <Button asChild variant="outline">
                      <Link href="/explore">Find something to borrow</Link>
                    </Button>
                  }
                />
              ) : (
                <div className="flex flex-col gap-4">
                  {waiting.map((r) => (
                    <RequestCard key={r.id} request={r} side="incoming" today={today} />
                  ))}
                  {needsYou.map((l) => (
                    <LoanCard key={l.id} loan={l} today={today} />
                  ))}
                </div>
              )}
            </section>
          </div>
        );
      }}
    </MemberSection>
  );
}

function Stat({ href, icon: Icon, value, label, highlight = false }: { href: string; icon: typeof Inbox; value: number; label: string; highlight?: boolean }) {
  return (
    <li>
      <Link
        href={href}
        className={`flex h-full flex-col gap-2 rounded-xl border p-4 transition-colors hover:border-forest/40 ${highlight ? "border-tangerine bg-tangerine-soft" : "bg-card"}`}
      >
        <Icon className="size-5 text-forest" aria-hidden />
        <span className="font-display text-3xl font-semibold text-forest">{value}</span>
        <span className="text-sm text-charcoal/80">{label}</span>
      </Link>
    </li>
  );
}
