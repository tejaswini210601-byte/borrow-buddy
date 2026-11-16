import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import type { FormState } from "@/lib/validation/form-state";

/**
 * Field — a label, the input (passed as children), an optional hint, and
 * an error message underneath. The ids link them together so screen
 * readers read the hint and error along with the input.
 */
export function Field({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string;
  label: React.ReactNode;
  error?: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-err`} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

/** Props to spread onto an input so it's linked to its error message. */
export function fieldProps(id: string, error?: string, hasHint = false) {
  return {
    id,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? `${id}-err` : hasHint ? `${id}-hint` : undefined,
  } as const;
}

/** The summary message at the top of a form (error or success). */
export function FormMessage({ state }: { state: FormState }) {
  if (!state.message || state.status === "idle") return null;
  if (state.status === "success") {
    return (
      <div role="status" className="flex gap-3 rounded-xl bg-fresh-soft p-4 text-sm text-forest">
        <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
        <p>{state.message}</p>
      </div>
    );
  }
  return (
    <div role="alert" className="flex gap-2 rounded-lg bg-destructive/8 p-3 text-sm text-destructive">
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
      <p>{state.message}</p>
    </div>
  );
}

/** First error for a field, from a FormState. */
export const errorFor = (state: FormState, field: string) => state.fieldErrors?.[field]?.[0];
