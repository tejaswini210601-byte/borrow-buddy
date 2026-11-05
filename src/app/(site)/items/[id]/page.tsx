import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CalendarDays, ChevronLeft, Clock, Flag, Info, MapPin, ShieldCheck } from "lucide-react";
import { AvailabilityTag } from "@/components/items/availability-tag";
import { ItemCard } from "@/components/items/item-card";
import { ItemGallery } from "@/components/items/item-gallery";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CATEGORIES, CONDITIONS, labelFor } from "@/lib/constants";
import { formatDayMonth, formatMonthYear, initials } from "@/lib/format";
import { getAllItemIds, getItem, getSimilarItems } from "@/lib/items";
import type { Item } from "@/lib/types";

type Params = Promise<{ id: string }>;

/** Prerender a page for every known listing at build time (fast to open). */
export async function generateStaticParams() {
  return (await getAllItemIds()).map((id) => ({ id }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const item = await getItem((await params).id);
  return item ? { title: item.title, description: item.description } : { title: "Item not found" };
}

export default function ItemPage({ params }: { params: Params }) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <Link href="/explore" className="inline-flex items-center gap-1 text-sm font-semibold text-forest hover:underline">
        <ChevronLeft className="size-4" aria-hidden />
        Back to all items
      </Link>
      <Suspense fallback={<ItemSkeleton />}>
        <ItemDetails params={params} />
      </Suspense>
    </div>
  );
}

async function ItemDetails({ params }: { params: Params }) {
  const item = await getItem((await params).id);
  if (!item) notFound();
  const similar = await getSimilarItems(item);

  return (
    <>
      <div className="mt-6 grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-14">
        <ItemGallery images={item.images} title={item.title} category={item.category}>
          <AvailabilityTag item={item} className="absolute top-4 left-4 text-sm" />
        </ItemGallery>

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant="neutral">{labelFor(CATEGORIES, item.category)}</Badge>
              <Badge>{labelFor(CONDITIONS, item.condition)}</Badge>
              {item.isSample && <Badge variant="outline">Sample listing</Badge>}
            </div>
            <h1 className="text-[clamp(2rem,4vw,3rem)]">{item.title}</h1>
            <p className="flex items-center gap-1.5 text-sm text-stone">
              <MapPin className="size-4" aria-hidden />
              {item.area}, Joensuu
            </p>
          </div>

          <p className="max-w-prose text-charcoal/85">{item.description}</p>

          <dl className="grid grid-cols-2 gap-4 rounded-xl border bg-card p-5 text-sm">
            <Detail label="Availability">
              {item.availability === "available"
                ? "Available now"
                : item.availability === "on_loan"
                  ? item.dueBack
                    ? `On loan until ${formatDayMonth(item.dueBack)}`
                    : "On loan"
                  : "Not lending right now"}
            </Detail>
            <Detail label="Longest loan">{item.maxDays ? `${item.maxDays} days` : "No limit"}</Detail>
            <Detail label="Condition">{labelFor(CONDITIONS, item.condition)}</Detail>
            <Detail label="Pickup area">{item.area}</Detail>
          </dl>

          {item.instructions && (
            <div className="flex gap-3 rounded-xl bg-tangerine-soft p-4 text-sm">
              <Info className="mt-0.5 size-4 shrink-0 text-[#8a4f16]" aria-hidden />
              <div>
                <p className="font-semibold text-charcoal">Borrowing instructions</p>
                <p className="mt-1 text-charcoal/85">{item.instructions}</p>
              </div>
            </div>
          )}

          <RequestPanel item={item} />
          <LenderCard item={item} />

          <Link
            href={`/contact?topic=item&ref=${item.id}#report`}
            className="inline-flex items-center gap-1.5 self-start text-sm text-stone underline-offset-4 hover:text-destructive hover:underline"
          >
            <Flag className="size-3.5" aria-hidden />
            Report this listing
          </Link>
        </div>
      </div>

      {similar.length > 0 && (
        <section aria-labelledby="similar" className="mt-20">
          <h2 id="similar" className="text-[clamp(1.5rem,3vw,2rem)]">
            Similar items
          </h2>
          <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {similar.map((s) => (
              <li key={s.id} className="flex">
                <ItemCard item={s} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs font-semibold text-stone">{label}</dt>
      <dd className="font-semibold text-charcoal">{children}</dd>
    </div>
  );
}

/**
 * Where borrowing starts. Requests need an account, so for now this sends
 * people to log in. In Phase 4 logged-in users see a date picker here and
 * the request is saved to the database.
 */
function RequestPanel({ item }: { item: Item }) {
  const next = encodeURIComponent(`/items/${item.id}#request`);
  return (
    <div id="request" className="scroll-mt-24 rounded-2xl bg-forest p-5 text-white sm:p-6">
      <div className="flex items-start gap-3">
        <CalendarDays className="mt-1 size-5 shrink-0 text-tangerine" aria-hidden />
        <div className="flex flex-col gap-1">
          <p className="font-display text-xl font-semibold">
            {item.availability === "available" ? "Want to borrow this?" : "Need it after it's back?"}
          </p>
          <p className="text-sm text-white/80">
            Choose your dates and send a request. {item.lender.displayName} decides whether to approve it.
          </p>
        </div>
      </div>
      <Button asChild size="lg" className="mt-5 w-full bg-tangerine text-charcoal hover:bg-[#f5b878]">
        <Link href={`/login?next=${next}`}>Log in to request this item</Link>
      </Button>
      <p className="mt-3 flex items-center gap-1.5 text-xs text-white/70">
        <Clock className="size-3.5" aria-hidden />
        {item.maxDays ? `Up to ${item.maxDays} days per loan.` : "No time limit set by the lender."}
      </p>
    </div>
  );
}

function LenderCard({ item }: { item: Item }) {
  const l = item.lender;
  return (
    <div className="flex gap-4 rounded-xl border bg-card p-5">
      <Avatar className="size-12">
        <AvatarFallback>{initials(l.displayName)}</AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-col gap-1">
        <p className="text-xs font-semibold text-stone">Lent by</p>
        <p className="font-display text-lg font-semibold text-forest">{l.displayName}</p>
        {l.bio && <p className="text-sm text-charcoal/80">{l.bio}</p>}
        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone">
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3" aria-hidden />
            {l.area}
          </span>
          <span>Member since {formatMonthYear(l.memberSince)}</span>
        </p>
        <p className="mt-2 flex items-center gap-1.5 text-xs text-stone">
          <ShieldCheck className="size-3.5" aria-hidden />
          Contact details are shared only after a request is approved.
        </p>
      </div>
    </div>
  );
}

function ItemSkeleton() {
  return (
    <div className="mt-6 grid gap-10 lg:grid-cols-[1.15fr_1fr]" aria-busy="true" aria-label="Loading item">
      <Skeleton className="aspect-[4/3] rounded-2xl" />
      <div className="flex flex-col gap-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-24" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
    </div>
  );
}
