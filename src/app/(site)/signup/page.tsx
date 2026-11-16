import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuthCard } from "@/components/auth/auth-card";
import { SignUpForm } from "@/components/auth/auth-forms";
import { FormSkeleton } from "@/components/forms/form-skeleton";

export const metadata: Metadata = { title: "Sign up" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default function SignUpPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <AuthCard
      tag="Free to join"
      title="Create your account"
      description="Borrow what you need from people nearby, and lend what you rarely use."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-forest hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <Suspense fallback={<FormSkeleton fields={4} />}>
        <Form searchParams={searchParams} />
      </Suspense>
    </AuthCard>
  );
}

async function Form({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  return <SignUpForm next={typeof sp.next === "string" ? sp.next : undefined} />;
}
