import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { FormSkeleton } from "@/components/forms/form-skeleton";
import { ItemForm } from "@/components/items/item-form";
import { ListingControls } from "@/components/items/listing-controls";
import { PageHeader } from "@/components/layout/page-header";
import { NeedsDatabase } from "@/components/shared/needs-database";
import { updateItem } from "@/lib/actions/items";
import { requireUser } from "@/lib/auth";
import { getEditableItem } from "@/lib/dashboard";
import { isUuid } from "@/lib/items";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata: Metadata = { title: "Edit listing" };

type Params = Promise<{ id: string }>;

export default function EditItemPage({ params }: { params: Params }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <PageHeader title="Edit listing" description="Changes show on your listing straight away." />
      <Suspense fallback={<div className="mt-10 rounded-2xl border bg-card p-6 sm:p-8"><FormSkeleton fields={5} /></div>}>
        <EditForm params={params} />
      </Suspense>
    </div>
  );
}

async function EditForm({ params }: { params: Params }) {
  if (!isSupabaseConfigured) return <div className="mt-10"><NeedsDatabase /></div>;
  const { id } = await params;
  const user = await requireUser(`/items/${id}/edit`);
  if (!isUuid(id)) notFound();
  const item = await getEditableItem(id, user.id);
  if (!item) notFound();

  return (
    <>
      <div className="mt-8">
        <ListingControls itemId={item.id} status={item.status} />
      </div>
      <div className="mt-6 rounded-2xl border bg-card p-6 sm:p-8">
        <ItemForm
          action={updateItem.bind(null, item.id)}
          userId={user.id}
          initial={{
            title: item.title,
            description: item.description,
            category: item.category,
            condition: item.condition,
            area: item.area,
            maxDays: item.max_days?.toString() ?? "",
            instructions: item.instructions ?? "",
          }}
          existingImages={item.images.map((i) => ({ id: i.id, url: i.url }))}
          submitLabel="Save changes"
          cancelHref={`/items/${item.id}`}
        />
      </div>
    </>
  );
}
