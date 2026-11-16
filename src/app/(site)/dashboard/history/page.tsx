import type { Metadata } from "next";
import Link from "next/link";
import { LoanCard } from "@/components/dashboard/cards";
import { MemberSection, todayIso } from "@/components/dashboard/member-section";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { getLoans } from "@/lib/dashboard";

export const metadata: Metadata = { title: "History" };

export default function HistoryPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="History" description="Finished and cancelled loans. Leave a review for each completed one." />
      <MemberSection path="/dashboard/history">
        {async (user) => {
          const today = todayIso();
          const loans = (await getLoans(user.id))
            .filter((l) => l.status === "completed" || l.status === "cancelled")
            // completed loans you haven't reviewed yet come first
            .sort((a, b) => Number(a.reviewed || a.status === "cancelled") - Number(b.reviewed || b.status === "cancelled") || b.endDate.localeCompare(a.endDate));
          if (loans.length === 0) {
            return (
              <EmptyState
                title="No finished loans yet"
                description="When a loan is completed, it moves here and you can review the other person."
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
