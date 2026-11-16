"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { errorFor, Field, fieldProps, FormMessage } from "@/components/forms/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { logIn, requestPasswordReset, signUp, updatePassword } from "@/lib/actions/auth";
import { idle } from "@/lib/validation/form-state";

/**
 * The account forms. They're Client Components because they show live
 * feedback (pending button, errors) using useActionState. The real work
 * happens in the Server Actions in src/lib/actions/auth.ts.
 */

export function LogInForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(logIn, idle);
  const v = state.values ?? {};
  return (
    <form action={action} noValidate className="flex flex-col gap-5">
      <FormMessage state={state} />
      <input type="hidden" name="next" value={v.next ?? next ?? ""} />
      <Field id="email" label="Email" error={errorFor(state, "email")}>
        <Input {...fieldProps("email", errorFor(state, "email"))} name="email" type="email" autoComplete="email" defaultValue={v.email} required />
      </Field>
      <Field id="password" label="Password" error={errorFor(state, "password")}>
        <PasswordInput id="password" error={errorFor(state, "password")} autoComplete="current-password" />
      </Field>
      <Link href="/forgot-password" className="-mt-2 self-end text-sm font-semibold text-forest hover:underline">
        Forgot your password?
      </Link>
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Logging in…" : "Log in"}
      </Button>
    </form>
  );
}

export function SignUpForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(signUp, idle);
  const v = state.values ?? {};
  if (state.status === "success") return <FormMessage state={state} />;
  return (
    <form action={action} noValidate className="flex flex-col gap-5">
      <FormMessage state={state} />
      <input type="hidden" name="next" value={v.next ?? next ?? ""} />
      <Field id="displayName" label="Your name" hint="Shown on your listings. A first name and initial is fine, e.g. Wini S." error={errorFor(state, "displayName")}>
        <Input {...fieldProps("displayName", errorFor(state, "displayName"), true)} name="displayName" autoComplete="nickname" defaultValue={v.displayName} required />
      </Field>
      <Field id="area" label="Your area (optional)" hint="A neighbourhood, not your street address, e.g. Niinivaara." error={errorFor(state, "area")}>
        <Input {...fieldProps("area", errorFor(state, "area"), true)} name="area" defaultValue={v.area} />
      </Field>
      <Field id="email" label="Email" error={errorFor(state, "email")}>
        <Input {...fieldProps("email", errorFor(state, "email"))} name="email" type="email" autoComplete="email" defaultValue={v.email} required />
      </Field>
      <Field id="password" label="Password" hint="At least 8 characters." error={errorFor(state, "password")}>
        <PasswordInput id="password" error={errorFor(state, "password")} autoComplete="new-password" hasHint />
      </Field>
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Creating your account…" : "Create account"}
      </Button>
      <p className="text-xs text-muted-foreground">
        Your email stays private. Other members only see your name, area and listings.
      </p>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, idle);
  if (state.status === "success") return <FormMessage state={state} />;
  return (
    <form action={action} noValidate className="flex flex-col gap-5">
      <FormMessage state={state} />
      <Field id="email" label="Email" error={errorFor(state, "email")}>
        <Input {...fieldProps("email", errorFor(state, "email"))} name="email" type="email" autoComplete="email" defaultValue={state.values?.email} required />
      </Field>
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Sending…" : "Send reset link"}
      </Button>
    </form>
  );
}

export function NewPasswordForm() {
  const [state, action, pending] = useActionState(updatePassword, idle);
  return (
    <form action={action} noValidate className="flex flex-col gap-5">
      <FormMessage state={state} />
      <Field id="password" label="New password" hint="At least 8 characters." error={errorFor(state, "password")}>
        <PasswordInput id="password" error={errorFor(state, "password")} autoComplete="new-password" hasHint />
      </Field>
      <Field id="confirm" label="Type it again" error={errorFor(state, "confirm")}>
        <PasswordInput id="confirm" error={errorFor(state, "confirm")} autoComplete="new-password" />
      </Field>
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Saving…" : "Save new password"}
      </Button>
    </form>
  );
}

/** Password box with a show/hide button (helps people avoid typos). */
function PasswordInput({
  id,
  error,
  autoComplete,
  hasHint = false,
}: {
  id: string;
  error?: string;
  autoComplete: string;
  hasHint?: boolean;
}) {
  const [shown, setShown] = useState(false);
  return (
    <div className="relative">
      <Input {...fieldProps(id, error, hasHint)} name={id} type={shown ? "text" : "password"} autoComplete={autoComplete} className="pr-12" required />
      <button
        type="button"
        onClick={() => setShown((s) => !s)}
        className="absolute inset-y-0 right-0 flex w-11 cursor-pointer items-center justify-center rounded-r-lg text-stone hover:text-forest"
        aria-label={shown ? "Hide password" : "Show password"}
        aria-pressed={shown}
      >
        {shown ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
      </button>
    </div>
  );
}
