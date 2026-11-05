"use client";

import { useActionState } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { sendContactMessage } from "@/app/(site)/contact/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { CONTACT_TOPICS, type ContactState } from "@/lib/validation/contact";

/**
 * useActionState connects the form to the Server Action and gives us its
 * result (errors or success) plus a "pending" flag for the loading state.
 */
export function ContactForm({ defaultTopic, reference }: { defaultTopic?: string; reference?: string }) {
  const [state, formAction, pending] = useActionState<ContactState, FormData>(sendContactMessage, {
    status: "idle",
  });
  const err = (f: keyof NonNullable<ContactState["fieldErrors"]>) => state.fieldErrors?.[f]?.[0];
  const v = state.values ?? {};

  if (state.status === "success") {
    return (
      <div role="status" className="flex gap-3 rounded-xl bg-fresh-soft p-5 text-forest">
        <CheckCircle2 className="mt-0.5 size-5 shrink-0" aria-hidden />
        <p>{state.message}</p>
      </div>
    );
  }

  return (
    <form action={formAction} noValidate className="flex flex-col gap-5">
      {state.status === "error" && state.message && (
        <div role="alert" className="flex gap-2 rounded-lg bg-destructive/8 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {state.message}
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="c-name" label="Your name" error={err("name")}>
          <Input id="c-name" name="name" autoComplete="name" defaultValue={v.name} aria-invalid={!!err("name")} aria-describedby={err("name") ? "c-name-err" : undefined} />
        </Field>
        <Field id="c-email" label="Email" error={err("email")}>
          <Input id="c-email" name="email" type="email" autoComplete="email" defaultValue={v.email} aria-invalid={!!err("email")} aria-describedby={err("email") ? "c-email-err" : undefined} />
        </Field>
      </div>

      <Field id="c-topic" label="What's this about?" error={err("topic")}>
        <NativeSelect id="c-topic" name="topic" defaultValue={v.topic ?? defaultTopic ?? "question"}>
          {CONTACT_TOPICS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </NativeSelect>
      </Field>

      <Field id="c-ref" label="Link or name of the listing or member (optional)" error={err("reference")}>
        <Input id="c-ref" name="reference" defaultValue={v.reference ?? reference} />
      </Field>

      <Field id="c-message" label="Message" error={err("message")}>
        <Textarea id="c-message" name="message" rows={6} defaultValue={v.message} aria-invalid={!!err("message")} aria-describedby={err("message") ? "c-message-err" : undefined} />
      </Field>

      <Button type="submit" size="lg" disabled={pending} className="self-start">
        {pending ? "Sending…" : "Send message"}
      </Button>
    </form>
  );
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && (
        <p id={`${id}-err`} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
