"use client";

import Link from "next/link";
import { useActionState } from "react";
import { errorFor, Field, fieldProps, FormMessage } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { CATEGORIES, CONDITIONS } from "@/lib/constants";
import { idle, type FormState } from "@/lib/validation/form-state";
import { PhotoPicker } from "./photo-picker";

export type ItemFormValues = Partial<Record<"title" | "description" | "category" | "condition" | "area" | "maxDays" | "instructions", string>>;

/**
 * The listing form, used both to list a new item and to edit one.
 * `action` is the Server Action to run (createItem, or updateItem for this item).
 */
export function ItemForm({
  action,
  userId,
  initial = {},
  existingImages,
  submitLabel,
  cancelHref,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  userId: string;
  initial?: ItemFormValues;
  existingImages?: { id: string; url: string }[];
  submitLabel: string;
  cancelHref: string;
}) {
  const [state, formAction, pending] = useActionState(action, idle);
  // After an error, show what the person typed rather than the starting values.
  const v: ItemFormValues = state.values ?? initial;
  const err = (f: string) => errorFor(state, f);

  return (
    <form action={formAction} noValidate className="flex flex-col gap-8">
      <FormMessage state={state} />

      <Section title="Photos" description="Clear photos help people decide. Show the whole item and anything included.">
        <PhotoPicker userId={userId} existing={existingImages} />
      </Section>

      <Section title="About the item">
        <Field id="title" label="Title" hint="Short and specific, e.g. “Cordless drill with bit set”." error={err("title")}>
          <Input {...fieldProps("title", err("title"), true)} name="title" maxLength={100} defaultValue={v.title} required />
        </Field>
        <Field id="description" label="Description" hint="What it is, what's included, and anything a borrower should know." error={err("description")}>
          <Textarea {...fieldProps("description", err("description"), true)} name="description" rows={5} maxLength={2000} defaultValue={v.description} required />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="category" label="Category" error={err("category")}>
            <NativeSelect {...fieldProps("category", err("category"))} name="category" defaultValue={v.category ?? ""} required>
              <option value="" disabled>
                Choose a category
              </option>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field id="condition" label="Condition" error={err("condition")}>
            <NativeSelect {...fieldProps("condition", err("condition"))} name="condition" defaultValue={v.condition ?? ""} required>
              <option value="" disabled>
                Choose the condition
              </option>
              {CONDITIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </NativeSelect>
          </Field>
        </div>
      </Section>

      <Section title="Borrowing rules">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="area" label="Pickup area" hint="Your neighbourhood only, never your street address." error={err("area")}>
            <Input {...fieldProps("area", err("area"), true)} name="area" maxLength={60} defaultValue={v.area} required />
          </Field>
          <Field id="maxDays" label="Longest loan, in days (optional)" hint="Leave empty for no limit." error={err("maxDays")}>
            <Input {...fieldProps("maxDays", err("maxDays"), true)} name="maxDays" inputMode="numeric" defaultValue={v.maxDays} />
          </Field>
        </div>
        <Field id="instructions" label="Instructions for borrowers (optional)" hint="E.g. “Please clean the bowl before returning.”" error={err("instructions")}>
          <Textarea {...fieldProps("instructions", err("instructions"), true)} name="instructions" rows={3} maxLength={1000} defaultValue={v.instructions} />
        </Field>
      </Section>

      <div className="flex flex-wrap items-center gap-3 border-t pt-6">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Saving…" : submitLabel}
        </Button>
        <Button asChild variant="ghost" size="lg">
          <Link href={cancelHref}>Cancel</Link>
        </Button>
      </div>
    </form>
  );
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-5">
      <legend className="mb-1 font-display text-xl font-semibold text-forest">{title}</legend>
      {description && <p className="-mt-3 text-sm text-muted-foreground">{description}</p>}
      {children}
    </fieldset>
  );
}
