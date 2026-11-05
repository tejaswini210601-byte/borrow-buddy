import type { Metadata } from "next";
import { Suspense } from "react";
import { Flag, HandHeart, MessageCircleQuestion, ShieldCheck } from "lucide-react";
import { ContactForm } from "@/components/contact/contact-form";
import { Skeleton } from "@/components/ui/skeleton";
import { CONTACT_TOPICS } from "@/lib/validation/contact";

export const metadata: Metadata = {
  title: "Contact and support",
  description: "Get help, report a problem, and read Borrow Buddy's safety guidelines.",
};

const FAQ = [
  {
    q: "Does it cost anything to borrow?",
    a: "No. Borrow Buddy is free, and lenders can't charge for items. Payments and deposits aren't part of the first version.",
  },
  {
    q: "How do I borrow something?",
    a: "Open an item, choose the dates you need it, and send a request. The lender approves or declines it, and you'll get a notification either way.",
  },
  {
    q: "What happens if an item gets damaged?",
    a: "Talk to the lender first; most problems are solved with a conversation. Borrow Buddy doesn't offer insurance, so only lend things you'd be comfortable lending to a neighbour.",
  },
  {
    q: "Can I see who I'm lending to?",
    a: "Yes. Every request shows the borrower's profile, how long they've been a member, and reviews from earlier loans. You're never obliged to approve a request.",
  },
  {
    q: "Are members identity-verified?",
    a: "No. Members sign up with an email address, and we don't check IDs. Use reviews and your own judgement, and follow the safety guidelines below.",
  },
  {
    q: "Who can see my address and phone number?",
    a: "Nobody, publicly. Profiles show only your name, a short bio and a general area. You agree on the exact pickup place with the other person after a request is approved.",
  },
];

const SAFETY = [
  "Meet in a public or well-lit place for pickups when you can, especially the first time.",
  "Check the item together at pickup and at return, and take a photo of its condition.",
  "Don't share bank details, passwords or ID numbers with other members. Borrowing is always free.",
  "Agree the return date and any rules before you hand anything over.",
  "Only lend what you could manage without if something went wrong.",
  "If someone makes you uncomfortable, stop the exchange and report them.",
];

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default function ContactPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-20">
      <header className="flex max-w-2xl flex-col gap-4">
        <h1 className="text-[clamp(2.25rem,5vw,3.5rem)]">Contact and support</h1>
        <p className="text-lg text-charcoal/80">
          Questions, problems, or something that doesn&apos;t feel right? Send us a message, or check the
          answers and safety guidelines below.
        </p>
      </header>

      <div className="mt-12 grid gap-12 lg:grid-cols-[1.2fr_1fr]">
        <section id="report" aria-labelledby="contact-h" className="scroll-mt-24 rounded-2xl border bg-card p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-fresh-soft text-forest">
              <MessageCircleQuestion className="size-5" aria-hidden />
            </span>
            <h2 id="contact-h" className="text-2xl">
              Send a message or report a problem
            </h2>
          </div>
          <p className="mt-3 text-sm text-stone">
            To report a listing or a member, choose that topic and paste a link to it.
          </p>
          <div className="mt-6">
            <Suspense fallback={<FormSkeleton />}>
              <PrefilledForm searchParams={searchParams} />
            </Suspense>
          </div>
        </section>

        <section id="safety" aria-labelledby="safety-h" className="scroll-mt-24">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-tangerine-soft text-[#8a4f16]">
              <ShieldCheck className="size-5" aria-hidden />
            </span>
            <h2 id="safety-h" className="text-2xl">
              Safety guidelines
            </h2>
          </div>
          <ul className="mt-6 flex flex-col gap-4">
            {SAFETY.map((s) => (
              <li key={s} className="flex gap-3 text-charcoal/85">
                <HandHeart className="mt-1 size-4 shrink-0 text-fresh" aria-hidden />
                {s}
              </li>
            ))}
          </ul>
          <p className="mt-6 flex gap-2 rounded-lg bg-destructive/8 p-4 text-sm text-charcoal">
            <Flag className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
            If anyone is in danger, call the emergency number 112 first, then tell us.
          </p>
        </section>
      </div>

      <section id="faq" aria-labelledby="faq-h" className="mt-20 scroll-mt-24">
        <h2 id="faq-h">Questions and answers</h2>
        <div className="mt-8 grid gap-x-12 md:grid-cols-2">
          {FAQ.map((f) => (
            <details key={f.q} className="group border-b border-forest/15 py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-lg font-semibold text-forest">
                {f.q}
                <span aria-hidden className="text-2xl leading-none text-fresh transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 max-w-prose text-charcoal/80">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}

/** Pre-fills the topic when someone arrives from "Report this listing". */
async function PrefilledForm({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const topic = typeof sp.topic === "string" && CONTACT_TOPICS.some((t) => t.value === sp.topic) ? sp.topic : undefined;
  const ref = typeof sp.ref === "string" ? sp.ref.slice(0, 120) : undefined;
  return <ContactForm defaultTopic={topic} reference={ref ? `Borrow Buddy listing: ${ref}` : undefined} />;
}

function FormSkeleton() {
  return (
    <div className="flex flex-col gap-5" aria-busy="true">
      <Skeleton className="h-11" />
      <Skeleton className="h-11" />
      <Skeleton className="h-36" />
    </div>
  );
}
