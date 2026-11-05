import Link from "next/link";
import { HandCoins, Leaf, PackageMinus, Users } from "lucide-react";
import { HeroBoard } from "@/components/home/hero-board";
import { CategoryLinks } from "@/components/items/category-links";
import { ItemCard } from "@/components/items/item-card";
import { SearchBar } from "@/components/items/search-bar";
import { Button } from "@/components/ui/button";
import { getAreas, getFeaturedItems, getItems } from "@/lib/items";

/**
 * Homepage. It's an async Server Component: it fetches listings on the
 * server, then sends finished HTML. Because it doesn't read cookies or the
 * URL, Next.js can prerender it once at build time (fast for everyone).
 */
export default async function HomePage() {
  const [featured, all, areas] = await Promise.all([getFeaturedItems(4), getItems(), getAreas()]);

  return (
    <>
      <Hero items={all.filter((i) => ["cordless-drill", "two-person-tent", "stand-mixer"].includes(i.id))} />
      <Categories />
      <Featured items={featured} />
      <HowItWorks />
      <Benefits />
      <Impact itemCount={all.length} areaCount={areas.length} />
      <Testimonials />
      <FinalCta />
    </>
  );
}

const POPULAR = ["drill", "tent", "projector", "skis"];

function Hero({ items }: { items: Awaited<ReturnType<typeof getItems>> }) {
  return (
    <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-12 pb-16 sm:px-6 md:pt-20 lg:grid-cols-[1.05fr_1fr] lg:gap-10">
      <div className="flex flex-col gap-6">
        <h1>Why buy when you can borrow?</h1>
        <p className="max-w-xl text-lg text-charcoal/80">
          Most homes are full of things used a few times a year: a drill, a tent, a raclette grill.
          Borrow Buddy lets you borrow them from people nearby and lend out your own, so fewer
          things get bought, stored and thrown away.
        </p>
        <SearchBar className="max-w-xl" />
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <span>Popular:</span>
          {POPULAR.map((q) => (
            <Link key={q} href={`/explore?q=${q}`} className="font-semibold text-forest underline-offset-4 hover:underline">
              {q}
            </Link>
          ))}
        </p>
      </div>
      <HeroBoard items={items} />
    </section>
  );
}

function SectionHeading({ title, intro, id }: { title: string; intro?: string; id?: string }) {
  return (
    <div className="flex max-w-2xl flex-col gap-3">
      <h2 id={id}>{title}</h2>
      {intro && <p className="text-charcoal/75">{intro}</p>}
    </div>
  );
}

function Categories() {
  return (
    <section aria-labelledby="categories" className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <SectionHeading id="categories" title="Browse by category" />
      <CategoryLinks className="mt-6" />
    </section>
  );
}

function Featured({ items }: { items: Awaited<ReturnType<typeof getItems>> }) {
  return (
    <section aria-labelledby="featured" className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeading id="featured" title="Recently listed" intro="Fresh listings from around Joensuu." />
        <Button asChild variant="outline">
          <Link href="/explore">See all items</Link>
        </Button>
      </div>
      <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <li key={item.id} className="flex">
            <ItemCard item={item} />
          </li>
        ))}
      </ul>
    </section>
  );
}

const STEPS = [
  {
    title: "Discover an item",
    text: "Search or browse what people near you are lending. Each listing shows its condition, its rules and when it's free.",
  },
  {
    title: "Request to borrow",
    text: "Pick the dates you need it. The lender gets a notification and approves or declines your request.",
  },
  {
    title: "Pick it up and return it",
    text: "Meet the lender, use the item, and bring it back on time. You both confirm the return, and you can leave each other a review.",
  },
];

function HowItWorks() {
  return (
    <section id="how-it-works" aria-labelledby="how" className="scroll-mt-20 bg-white py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading id="how" title="How Borrow Buddy works" intro="Three steps from needing something to having it, without buying it." />
        <ol className="relative mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
          {/* dashed "string" connecting the steps on wide screens */}
          <span aria-hidden className="absolute top-6 right-[16%] left-[16%] hidden border-t-2 border-dashed border-forest/20 md:block" />
          {STEPS.map((s, i) => (
            <li key={s.title} className="relative flex flex-col gap-3">
              <span className="flex size-12 items-center justify-center rounded-full bg-forest font-display text-lg font-bold text-white ring-8 ring-white">
                {i + 1}
              </span>
              <h3>{s.title}</h3>
              <p className="max-w-sm text-charcoal/75">{s.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

const BENEFITS = [
  {
    icon: HandCoins,
    title: "Save money",
    text: "Borrowing a pressure washer for a weekend costs nothing. Buying one costs a lot, for something you'll use twice a year.",
  },
  {
    icon: PackageMinus,
    title: "Keep less clutter",
    text: "No more storing things you rarely touch. Your cupboard holds what you use; the rest is a short walk away.",
  },
  {
    icon: Leaf,
    title: "Lower your footprint",
    text: "Every item that gets shared is one less item made, shipped and eventually thrown away.",
  },
  {
    icon: Users,
    title: "Get to know your neighbours",
    text: "Lending something is an easy way to meet the people around you, and to have someone to ask next time.",
  },
];

function Benefits() {
  return (
    <section aria-labelledby="benefits" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <SectionHeading id="benefits" title="Why borrow instead of buy?" />
      <ul className="mt-10 grid gap-x-12 gap-y-10 sm:grid-cols-2">
        {BENEFITS.map(({ icon: Icon, title, text }) => (
          <li key={title} className="flex gap-4">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-fresh-soft text-forest">
              <Icon className="size-5" aria-hidden />
            </span>
            <div className="flex flex-col gap-1.5">
              <h3 className="text-xl">{title}</h3>
              <p className="max-w-md text-charcoal/75">{text}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Impact({ itemCount, areaCount }: { itemCount: number; areaCount: number }) {
  const stats = [
    { value: itemCount, label: "items ready to borrow" },
    { value: areaCount, label: "neighbourhoods lending" },
    { value: 9, label: "categories, from tools to toys" },
  ];
  return (
    <section aria-labelledby="impact" className="bg-forest py-20 text-white">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_1.2fr] lg:items-center">
        <div className="flex flex-col gap-4">
          <h2 id="impact" className="text-white">
            A shared shelf for the whole community
          </h2>
          <p className="max-w-lg text-white/80">
            The more people lend, the less everyone needs to buy. These numbers update as people
            list items. Right now they count our sample listings, until real members join.
          </p>
        </div>
        <dl className="grid grid-cols-3 gap-4 border-t border-white/15 pt-8 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-12">
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col gap-1">
              <dt className="order-2 text-sm text-white/75">{s.label}</dt>
              <dd className="order-1 font-display text-5xl font-bold text-tangerine tabular-nums sm:text-6xl">{s.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

const TESTIMONIALS = [
  {
    quote: "I needed a drill for one shelf. Borrowed one from two streets away and returned it the same evening.",
    name: "Sample member, Karsikko",
  },
  {
    quote: "Our kids' winter overalls get worn for one season. Now they go to another family instead of the attic.",
    name: "Sample member, Rantakylä",
  },
  {
    quote: "As a student here for two years, I don't want to buy a projector. Borrowing makes much more sense.",
    name: "Sample member, Keskusta",
  },
];

function Testimonials() {
  return (
    <section aria-labelledby="testimonials" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <SectionHeading
        id="testimonials"
        title="What borrowing feels like"
        intro="These are sample testimonials written for this preview. Real reviews from members will appear here once Borrow Buddy launches."
      />
      <ul className="mt-10 grid gap-5 md:grid-cols-3">
        {TESTIMONIALS.map((t) => (
          <li key={t.name}>
            <figure className="flex h-full flex-col justify-between gap-6 rounded-xl bg-white p-6">
              <blockquote className="text-lg leading-relaxed text-charcoal">
                <span aria-hidden className="block font-display text-5xl leading-none text-tangerine">“</span>
                {t.quote}
              </blockquote>
              <figcaption className="text-sm font-semibold text-stone">{t.name}</figcaption>
            </figure>
          </li>
        ))}
      </ul>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6">
      <div className="flex flex-col items-start gap-6 rounded-2xl bg-tangerine-soft px-6 py-12 sm:px-12 md:flex-row md:items-center md:justify-between">
        <div className="flex max-w-xl flex-col gap-3">
          <h2>Got something sitting in a cupboard?</h2>
          <p className="text-charcoal/80">
            List it in two minutes. You decide who borrows it, for how long, and how they pick it up.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href="/items/new">List an item</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/explore">Explore items</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
