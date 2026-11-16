import type { Metadata } from "next";
import { Suspense } from "react";
import { FormSkeleton } from "@/components/forms/form-skeleton";
import { ItemForm } from "@/components/items/item-form";
import { PageHeader } from "@/components/layout/page-header";
import { NeedsDatabase } from "@/components/shared/needs-database";
import { createItem } from "@/lib/actions/items";
import { requireUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata: Metadata = { title: "List an item" };

export default function NewItemPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <PageHeader
        title="List an item"
        description="Lend something you rarely use. You decide who borrows it and for how long, and you can pause the listing any time."
      />
      <div className="mt-10 rounded-2xl border bg-card p-6 sm:p-8">
        {/* Who's logged in is known per request, so the form streams in. */}
        <Suspense fallback={<FormSkeleton fields={5} />}>
          <NewItemForm />
        </Suspense>
      </div>
    </div>
  );
}

async function NewItemForm() {
  if (!isSupabaseConfigured) return <NeedsDatabase />;
  const user = await requireUser("/items/new");
  return (
    <ItemForm
      action={createItem}
      userId={user.id}
      initial={{ area: user.area ?? "" }}
      submitLabel="Publish listing"
      cancelHref="/dashboard/listings"
    />
  );
}
