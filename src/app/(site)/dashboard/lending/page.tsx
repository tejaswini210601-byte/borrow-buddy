import type { Metadata } from "next";
import Link from "next/link";
import { LoanCard } from "@/components/dashboard/cards";
import { MemberSection, todayIso } from "@/components/dashboard/member-section";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { getLoans } from "@/lib/dashboard";

export const metadata: Metadata = { title: "Lending" };

export default function LendingPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Lending" description="Your things that are out on loan now or soon. Confirm here when you get something back." />
      <MemberSection path="/dashboard/lending">
        {async (user) => {
          const today = todayIso();
          const loans = (await getLoans(user.id))
            .filter((l) => l.role === "lender" && (l.status === "active" || l.status === "returned"))
            // soonest due first
            .sort((a, b) => a.endDate.localeCompare(b.endDate));
          if (loans.length === 0) {
            return (
              <EmptyState
                title="Nothing is out on loan"
                description="When you approve a request, the loan shows up here."
                action={
                  <Button asChild variant="outline">
                    <Link href="/dashboard/requests">See requests</Link>
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
