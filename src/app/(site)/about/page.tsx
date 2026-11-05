import type { Metadata } from "next";
import Link from "next/link";
import { LendingTag } from "@/components/brand/lending-tag";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "About",
  description: "Why Borrow Buddy exists, and how sharing everyday things helps communities and the planet.",
};

const SECTIONS = [
  {
    id: "problem",
    title: "We buy too much of what we barely use",
    body: [
      "Think of the things in your home you used once last year: a drill, a sleeping bag, a fondue set, a carpet cleaner. Most households own dozens of these. They're bought for one job, then spend years on a shelf.",
      "Meanwhile, someone a few streets away needs exactly that thing this weekend, and is about to buy their own.",
    ],
  },
  {
    id: "sharing",
    title: "Sharing turns a cupboard into a library",
    body: [
      "When neighbours lend to each other, one item can do the work of ten. People save money, homes have more space, and it gets easier to say yes to a project or a trip.",
      "Lending also builds trust. Handing someone your tent is a small act, but it's how neighbours become people you know.",
    ],
  },
  {
    id: "sustainability",
    title: "Fewer things made, shipped and thrown away",
    body: [
      "Every product carries a cost before it reaches you: materials, factory energy, packaging and transport. Using what already exists, instead of buying another one, avoids that cost entirely.",
      "Borrowing also keeps good items in use for longer, rather than in storage until they're thrown away.",
    ],
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-20">
      <header className="flex max-w-3xl flex-col gap-5">
        <LendingTag tone="fresh">Our story</LendingTag>
        <h1>A neighbourhood lending library for everyday things</h1>
        <p className="text-lg text-charcoal/80">
          Borrow Buddy started as a software engineering project at the University of Eastern Finland in
          Joensuu, with a simple question: why does every home need to own its own drill?
        </p>
      </header>

      <div className="mt-16 grid gap-14 lg:grid-cols-[14rem_1fr] lg:gap-16">
        <nav aria-label="On this page" className="hidden lg:block">
          <ul className="sticky top-24 flex flex-col gap-2 border-l border-forest/15 pl-4 text-sm">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="text-stone hover:text-forest">
                  {s.title}
                </a>
              </li>
            ))}
            <li>
              <a href="#mission" className="text-stone hover:text-forest">
                Our mission
              </a>
            </li>
          </ul>
        </nav>

        <div className="flex max-w-2xl flex-col gap-14">
          {SECTIONS.map((s) => (
            <section key={s.id} id={s.id} aria-labelledby={`${s.id}-h`} className="scroll-mt-24">
              <h2 id={`${s.id}-h`} className="text-[clamp(1.6rem,3vw,2.25rem)]">
                {s.title}
              </h2>
              {s.body.map((p) => (
                <p key={p.slice(0, 20)} className="mt-4 text-lg text-charcoal/80">
                  {p}
                </p>
              ))}
            </section>
          ))}

          <section id="mission" aria-labelledby="mission-h" className="scroll-mt-24 rounded-2xl bg-forest p-8 text-white sm:p-10">
            <h2 id="mission-h" className="text-[clamp(1.6rem,3vw,2.25rem)] text-white">
              Our mission
            </h2>
            <p className="mt-4 text-xl leading-relaxed text-white/90">
              Make borrowing from a neighbour as easy as buying online, so that the things we already own
              get used more and the things we don&apos;t need never get made.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-tangerine text-charcoal hover:bg-[#f5b878]">
                <Link href="/explore">Explore items</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:border-white">
                <Link href="/items/new">List an item</Link>
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
