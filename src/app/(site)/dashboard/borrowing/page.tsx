import type { Metadata } from "next";
import Link from "next/link";
import { LoanCard } from "@/components/dashboard/cards";
import { MemberSection, todayIso } from "@/components/dashboard/member-section";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { getLoans } from "@/lib/dashboard";

export const metadata: Metadata = { title: "Borrowing" };

export default function BorrowingPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Borrowing" description="Things you're borrowing now or soon. Confirm here when you've returned something." />
      <MemberSection path="/dashboard/borrowing">
        {async (user) => {
          const today = todayIso();
          const loans = (await getLoans(user.id))
            .filter((l) => l.role === "borrower" && (l.status === "active" || l.status === "returned"))
            // soonest due first
            .sort((a, b) => a.endDate.localeCompare(b.endDate));
          if (loans.length === 0) {
            return (
              <EmptyState
                title="You're not borrowing anything right now"
                description="Find something nearby and send a request."
                action={
                  <Button asChild variant="outline">
                    <Link href="/explore">Explore items</Link>
                  </Button>
                }
              />
            );
          }
          return (
            <div className="flex flex-col gap-4">
              {loans.map((l) => (
                <LoanCard key={l.id} loan={l} today={today} />
              ))}
            </div>
          );
        }}
      </MemberSection>
    </div>
  );
}
