"use client";

import { useActionState, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { idle, type FormState } from "@/lib/validation/form-state";

type Action = (prev: FormState, formData: FormData) => Promise<FormState>;

/**
 * ActionButton — a button that runs one Server Action (approve, pause,
 * delete…) and shows the result as a small pop-up message ("toast").
 *
 * With `confirm`, it first asks "Are you sure?" in a dialog. Use that for
 * anything that can't easily be undone.
 */
export function ActionButton({
  action,
  children,
  pendingLabel = "Working…",
  variant = "default",
  size = "sm",
  confirm,
  fields,
  className,
}: {
  action: Action;
  children: React.ReactNode;
  pendingLabel?: string;
  variant?: React.ComponentProps<typeof Button>["variant"];
  size?: React.ComponentProps<typeof Button>["size"];
  /** Ask first in a dialog. `body` can add form fields (e.g. a message box). */
  confirm?: { title: string; description: string; confirmLabel: string; destructive?: boolean; cancelLabel?: string; body?: React.ReactNode };
  fields?: Record<string, string>;
  className?: string;
}) {
  // The result is shown as a toast straight from the action, not from an
  // effect: after "Approve", the card often disappears from the list, and a
  // message tied to the card would vanish with it.
  const [, formAction, pending] = useActionState(async (prev: FormState, formData: FormData) => {
    const result = await action(prev, formData);
    if (result.message) {
      if (result.status === "success") toast.success(result.message);
      else toast.error(result.message);
    }
    return result;
  }, idle);
  const [open, setOpen] = useState(false);

  const hidden = Object.entries(fields ?? {}).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />);

  if (!confirm) {
    return (
      <form action={formAction} className={className}>
        {hidden}
        <Button type="submit" variant={variant} size={size} disabled={pending}>
          {pending ? pendingLabel : children}
        </Button>
      </form>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button type="button" variant={variant} size={size} disabled={pending} onClick={() => setOpen(true)} className={className}>
        {pending ? pendingLabel : children}
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{confirm.title}</DialogTitle>
          <DialogDescription>{confirm.description}</DialogDescription>
        </DialogHeader>
        <form action={formAction} onSubmit={() => setOpen(false)}>
          {hidden}
          {confirm.body && <div className="mb-5">{confirm.body}</div>}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                {confirm.cancelLabel ?? "Cancel"}
              </Button>
            </DialogClose>
            <Button type="submit" variant={confirm.destructive ? "destructive" : "default"}>
              {confirm.confirmLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
