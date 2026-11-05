import { Search } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { LendingTag } from "@/components/brand/lending-tag";
import { EmptyState } from "@/components/shared/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CATEGORIES } from "@/lib/constants";

/**
 * TEMPORARY page (Phase 1): a preview of the design system so we can check
 * colours, type and components. Phase 2 replaces it with the real homepage.
 */
export default function Home() {
  return (
    <main id="main" className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-16">
      <Logo />
      <p className="mt-2 text-sm text-muted-foreground">
        Design system preview. The real homepage arrives in Phase 2.
      </p>

      <section className="mt-12 max-w-3xl">
        <h1>Why buy when you can borrow?</h1>
        <p className="mt-5 max-w-xl text-lg text-charcoal/80">
          A drill, a tent, a raclette set: most of us own things we use a few times a year.
          Borrow from someone down the street, and lend out what sits in your cupboard.
        </p>
        <form className="mt-8 flex max-w-xl gap-2" action="/explore">
          <label htmlFor="q" className="sr-only">
            What do you need today?
          </label>
          <Input id="q" name="q" placeholder="What do you need today?" className="h-13 rounded-full px-5" />
          <Button size="lg">
            <Search />
            Search
          </Button>
        </form>
      </section>

      <section className="mt-16">
        <h2>Components</h2>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button>Request to borrow</Button>
          <Button variant="secondary">List an item</Button>
          <Button variant="outline">View profile</Button>
          <Button variant="ghost">Cancel</Button>
          <Button variant="destructive">Reject request</Button>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <Badge>Available</Badge>
          <Badge variant="warm">Pending</Badge>
          <Badge variant="neutral">Returned</Badge>
          <Badge variant="danger">Rejected</Badge>
          <Badge variant="outline">Sample listing</Badge>
        </div>
      </section>

      <section className="mt-12 grid gap-6 sm:grid-cols-2">
        <Card className="overflow-hidden">
          <div className="relative aspect-[4/3] bg-fresh-soft">
            <LendingTag className="absolute top-4 left-4">Due back 14 Nov</LendingTag>
          </div>
          <CardContent>
            <div className="flex items-center justify-between gap-3">
              <h3>Cordless drill</h3>
              <Badge>Available</Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">Tools · Like new · Joensuu centre</p>
          </CardContent>
        </Card>
        <EmptyState
          title="You haven't listed anything yet"
          description="List something you rarely use, like a tent or a stand mixer, and neighbours can ask to borrow it."
          action={<Button>List an item</Button>}
        />
      </section>

      <section className="mt-12">
        <h3>Categories</h3>
        <ul className="mt-4 flex flex-wrap gap-2">
          {CATEGORIES.map(({ value, label, icon: Icon }) => (
            <li
              key={value}
              className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm font-medium text-forest"
            >
              <Icon className="size-4" aria-hidden />
              {label}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
