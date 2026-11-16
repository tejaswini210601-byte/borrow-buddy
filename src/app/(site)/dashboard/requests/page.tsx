import type { Metadata } from "next";
import Link from "next/link";
import { RequestCard } from "@/components/dashboard/cards";
import { MemberSection, todayIso } from "@/components/dashboard/member-section";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { getRequests, type RequestView } from "@/lib/dashboard";

export const metadata: Metadata = { title: "Requests" };

export default function RequestsPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Requests" description="Requests to borrow your things, and the requests you've sent." />
      <MemberSection path="/dashboard/requests">
        {async (user) => {
          const today = todayIso();
          const { incoming, outgoing } = await getRequests(user.id);
          return (
            <div className="flex flex-col gap-12">
              <Group
                id="incoming"
                title="For your items"
                requests={incoming}
                side="incoming"
                today={today}
                empty={
                  <EmptyState
                    title="No requests yet"
                    description="When someone asks to borrow one of your items, you'll approve or decline it here."
                    action={
                      <Button asChild variant="outline">
                        <Link href="/items/new">List an item</Link>
                      </Button>
                    }
                  />
                }
              />
              <Group
                id="outgoing"
                title="You've sent"
                requests={outgoing}
                side="outgoing"
                today={today}
                empty={
                  <EmptyState
                    title="You haven't asked to borrow anything yet"
                    action={
                      <Button asChild variant="outline">
                        <Link href="/explore">Explore items</Link>
                      </Button>
                    }
                  />
                }
              />
            </div>
          );
        }}
      </MemberSection>
    </div>
  );
}

function Group({ id, title, requests, side, today, empty }: { id: string; title: string; requests: RequestView[]; side: "incoming" | "outgoing"; today: string; empty: React.ReactNode }) {
  // Pending first (they need action), then the rest, newest first.
  const sorted = [...requests].sort((a, b) => Number(b.status === "pending") - Number(a.status === "pending"));
  return (
    <section aria-labelledby={id} className="flex flex-col gap-4">
      <h2 id={id} className="text-2xl">
        {title} {requests.length > 0 && <span className="text-base font-normal text-stone">({requests.length})</span>}
      </h2>
      {sorted.length === 0 ? empty : sorted.map((r) => <RequestCard key={r.id} request={r} side={side} today={today} />)}
    </section>
  );
}
