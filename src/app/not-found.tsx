import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main id="main" className="mx-auto flex min-h-dvh max-w-xl flex-col items-start justify-center gap-6 px-4 sm:px-6">
      <Logo />
      <h1 className="text-[clamp(2rem,5vw,3rem)]">This page doesn&apos;t exist</h1>
      <p className="text-charcoal/80">The link may be mistyped, or the page has moved.</p>
      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/">Go to the homepage</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/explore">Explore items</Link>
        </Button>
      </div>
    </main>
  );
}
