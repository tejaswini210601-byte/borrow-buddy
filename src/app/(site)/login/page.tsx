import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuthCard } from "@/components/auth/auth-card";
import { LogInForm } from "@/components/auth/auth-forms";
import { FormSkeleton } from "@/components/forms/form-skeleton";

export const metadata: Metadata = { title: "Log in" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default function LogInPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <AuthCard
      tag="Welcome back"
      title="Log in"
      description="Log in to request items, manage your listings and see your loans."
      footer={
        <>
          New to Borrow Buddy?{" "}
          <Link href="/signup" className="font-semibold text-forest hover:underline">
            Create a free account
          </Link>
        </>
      }
    >
      {/* searchParams (e.g. ?next=/items/123) are only known per request, so
          the part that reads them streams in behind Suspense. */}
      <Suspense fallback={<FormSkeleton />}>
        <Form searchParams={searchParams} />
      </Suspense>
    </AuthCard>
  );
}

async function Form({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const next = typeof sp.next === "string" ? sp.next : undefined;
  return (
    <div className="flex flex-col gap-5">
      {sp.error === "link" && (
        <p role="alert" className="rounded-lg bg-destructive/8 p-3 text-sm text-destructive">
          That link has expired or was already used. Log in, or ask for a new link.
        </p>
      )}
      <LogInForm next={next} />
    </div>
  );
}
