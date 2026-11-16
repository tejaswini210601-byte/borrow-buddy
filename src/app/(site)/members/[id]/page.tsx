import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { MapPin, Star } from "lucide-react";
import { ItemCard } from "@/components/items/item-card";
import { EmptyState } from "@/components/shared/states";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { getPublicProfile } from "@/lib/dashboard";
import { formatMonthYear, initials } from "@/lib/format";
import { getItemsByLender, isUuid } from "@/lib/items";

export const metadata: Metadata = { title: "Member profile" };

type Params = Promise<{ id: string }>;

/** A member's public profile: name, area, bio, stats, reviews and listings. Never their email. */
export default function MemberPage({ params }: { params: Params }) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <Suspense fallback={<Skeleton className="h-48 rounded-2xl" />}>
        <Profile params={params} />
      </Suspense>
    </div>
  );
}

async function Profile({ params }: { params: Params }) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const [profile, items] = await Promise.all([getPublicProfile(id), getItemsByLender(id)]);
  if (!profile) notFound();
  const s = profile.stats;

  return (
    <div className="flex flex-col gap-12">
      <header className="flex flex-col gap-6 rounded-2xl border bg-card p-6 sm:flex-row sm:items-center sm:p-8">
        <Avatar className="size-24">
          {profile.avatarUrl && <AvatarImage src={profile.avatarUrl} alt="" />}
          <AvatarFallback className="text-2xl">{initials(profile.displayName)}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col gap-2">
          <h1 className="text-[clamp(1.875rem,4vw,2.5rem)]">{profile.displayName}</h1>
          <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-stone">
            {profile.area && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-4" aria-hidden />
                {profile.area}
              </span>
            )}
            <span>Member since {formatMonthYear(profile.memberSince)}</span>
            {s?.average_rating != null && (
              <span className="inline-flex items-center gap-1 font-semibold text-charcoal">
                <Star className="size-4 fill-tangerine text-tangerine" aria-hidden />
                {s.average_rating} ({s.review_count} {s.review_count === 1 ? "review" : "reviews"})
              </span>
            )}
          </p>
          {profile.bio && <p className="max-w-prose text-charcoal/85">{profile.bio}</p>}
          {s && (
            <p className="text-sm text-stone">
              {s.lends_completed} {s.lends_completed === 1 ? "loan" : "loans"} lent · {s.items_borrowed} borrowed
            </p>
          )}
        </div>
      </header>

      <section aria-labelledby="listings" className="flex flex-col gap-5">
        <h2 id="listings" className="text-2xl">Listings</h2>
        {items.length === 0 ? (
          <EmptyState title={`${profile.displayName} has nothing listed right now`} />
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <li key={item.id} className="flex">
                <ItemCard item={item} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="reviews" className="flex flex-col gap-5">
        <h2 id="reviews" className="text-2xl">Reviews</h2>
        {profile.reviews.length === 0 ? (
          <p className="text-stone">No reviews yet.</p>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {profile.reviews.map((r) => (
              <li key={r.id} className="flex flex-col gap-2 rounded-xl border bg-card p-5">
                <p className="flex items-center gap-0.5" aria-label={`${r.rating} out of 5 stars`}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star key={n} aria-hidden className={n <= r.rating ? "size-4 fill-tangerine text-tangerine" : "size-4 text-stone/40"} />
                  ))}
                </p>
                {r.comment && <p className="text-charcoal/85">{r.comment}</p>}
                <p className="text-sm text-stone">
                  {r.reviewer.displayName} · {formatMonthYear(r.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
