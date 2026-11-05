import Link from "next/link";
import { LogoMark } from "@/components/brand/logo";

const COLUMNS = [
  {
    title: "Borrow Buddy",
    links: [
      { href: "/explore", label: "Explore items" },
      { href: "/#how-it-works", label: "How it works" },
      { href: "/about", label: "About us" },
    ],
  },
  {
    title: "Lend",
    links: [
      { href: "/items/new", label: "List an item" },
      { href: "/dashboard", label: "Your dashboard" },
      { href: "/signup", label: "Create an account" },
    ],
  },
  {
    title: "Support",
    links: [
      { href: "/contact", label: "Contact us" },
      { href: "/contact#faq", label: "Questions and answers" },
      { href: "/contact#safety", label: "Safety guidelines" },
      { href: "/contact#report", label: "Report a problem" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-24 bg-forest text-white/85">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="flex flex-col gap-4">
          <Link href="/" className="inline-flex items-center gap-2 text-white">
            <LogoMark className="size-8 [&_rect:last-of-type]:fill-white [&_circle]:fill-forest" />
            <span className="font-display text-xl font-bold">Borrow Buddy</span>
          </Link>
          <p className="max-w-xs text-sm text-white/75">
            Borrow more. Buy less. Share better. A neighbourhood lending library for everyday things.
          </p>
        </div>
        {COLUMNS.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h2 className="font-sans text-sm font-bold tracking-normal text-white">{col.title}</h2>
            <ul className="mt-4 flex flex-col gap-2.5 text-sm">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-white/75 underline-offset-4 hover:text-white hover:underline">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-white/60 sm:px-6">
          © 2026 Borrow Buddy. A University of Eastern Finland software engineering project.
        </p>
      </div>
    </footer>
  );
}
