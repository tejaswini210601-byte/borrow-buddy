import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { MemberSection } from "@/components/dashboard/member-section";
import { ItemImage } from "@/components/items/item-image";
import { ListingControls } from "@/components/items/listing-controls";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getMyListings } from "@/lib/dashboard";
import { formatDayMonth } from "@/lib/format";

export const metadata: Metadata = { title: "My listings" };

export default function ListingsPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="My listings"
        description="Everything you lend. Pause a listing to hide it from Explore without deleting it."
        actions={
          <Button asChild>
            <Link href="/items/new">
              <Plus aria-hidden />
              List an item
            </Link>
          </Button>
        }
      />
      <MemberSection path="/dashboard/listings">
        {async (user) => {
          const listings = await getMyListings(user.id);
          if (listings.length === 0) {
            return (
              <EmptyState
                title="You haven't listed anything yet"
                description="A drill, a tent, a board game… what do you own that sits unused most of the year?"
                action={
                  <Button asChild>
                    <Link href="/items/new">List your first item</Link>
                  </Button>
                }
              />
            );
          }
          return (
            <ul className="flex flex-col gap-4">
              {listings.map((item) => (
                <li key={item.id} className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:p-5">
                  <div className="flex gap-4">
                    <Link href={`/items/${item.id}`} className="relative size-20 shrink-0 overflow-hidden rounded-lg sm:size-24">
                      <ItemImage src={item.images[0]} alt={item.title} category={item.category} />
                    </Link>
                    <div className="flex min-w-0 flex-col gap-1.5">
                      <h2 className="text-lg leading-snug">
                        <Link href={`/items/${item.id}`} className="hover:underline">
                          {item.title}
                        </Link>
                      </h2>
                      <div className="flex flex-wrap gap-2">
                        {item.availability === "on_loan" && (
                          <Badge variant="warm">On loan{item.dueBack ? ` · back ${formatDayMonth(item.dueBack)}` : ""}</Badge>
                        )}
                        {item.pendingRequests > 0 && (
                          <Link href="/dashboard/requests">
                            <Badge variant="solid">
                              {item.pendingRequests} new {item.pendingRequests === 1 ? "request" : "requests"}
                            </Badge>
                          </Link>
                        )}
                      </div>
                      <Link href={`/items/${item.id}/edit`} className="text-sm font-semibold text-forest hover:underline">
                        Edit details and photos
                      </Link>
                    </div>
                  </div>
                  <ListingControls itemId={item.id} status={item.status} />
                </li>
              ))}
            </ul>
          );
        }}
      </MemberSection>
    </div>
  );
}
