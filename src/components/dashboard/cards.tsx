import Link from "next/link";
import { CalendarRange, MapPin, MessageSquareText, Truck } from "lucide-react";
import { ItemImage } from "@/components/items/item-image";
import { ActionButton } from "@/components/shared/action-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  approveRequest,
  cancelLoan,
  cancelRequest,
  confirmReturn,
  rejectRequest,
} from "@/lib/actions/borrowing";
import type { ItemSummary, LoanView, Person, RequestView } from "@/lib/dashboard";
import { formatDayMonth, initials } from "@/lib/format";
import { ReviewForm } from "./review-form";

/**
 * Cards for the dashboard: one borrowing request, or one loan.
 * Which buttons appear depends on the status and on whether you're the
 * borrower or the lender. The database checks again when a button is used.
 */

const dates = (a: string, b: string) => `${formatDayMonth(a)} – ${formatDayMonth(b)}`;

const REQUEST_BADGE: Record<RequestView["status"], { label: string; variant: "warm" | "default" | "neutral" | "danger" }> = {
  pending: { label: "Waiting for reply", variant: "warm" },
  approved: { label: "Approved", variant: "default" },
  rejected: { label: "Declined", variant: "danger" },
  cancelled: { label: "Cancelled", variant: "neutral" },
};

export function RequestCard({ request, side, today }: { request: RequestView; side: "incoming" | "outgoing"; today: string }) {
  const badge = REQUEST_BADGE[request.status];
  const pending = request.status === "pending";
  const expired = pending && request.endDate < today;
  return (
    <Shell item={request.item}>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={badge.variant}>{badge.label}</Badge>
        <span className="flex items-center gap-1 text-sm text-stone">
          <CalendarRange className="size-4" aria-hidden />
          {dates(request.startDate, request.endDate)}
        </span>
      </div>
      <PersonLine person={request.other} label={side === "incoming" ? "Requested by" : "Lender"} />
      {request.message && (
        <p className="flex gap-2 rounded-lg bg-muted/70 p-3 text-sm text-charcoal/85">
          <MessageSquareText className="mt-0.5 size-4 shrink-0 text-stone" aria-hidden />
          <span>{request.message}</span>
        </p>
      )}

      {pending && side === "incoming" && (
        <div className="flex flex-wrap gap-2">
          {!expired && (
            <ActionButton
              action={approveRequest.bind(null, request.id)}
              pendingLabel="Approving…"
              confirm={{
                title: `Lend it to ${request.other.displayName}?`,
                description: `${dates(request.startDate, request.endDate)}. Other requests for overlapping dates will be declined automatically.`,
                confirmLabel: "Approve request",
                body: (
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor={`pickup-${request.id}`}>Pickup details (optional)</Label>
                    <Textarea
                      id={`pickup-${request.id}`}
                      name="pickup"
                      rows={3}
                      maxLength={1000}
                      placeholder="Where and when to pick it up, and how to reach you. Only the borrower sees this."
                    />
                  </div>
                ),
              }}
            >
              Approve
            </ActionButton>
          )}
          <ActionButton
            action={rejectRequest.bind(null, request.id)}
            variant="outline"
            pendingLabel="Declining…"
            confirm={{
              title: "Decline this request?",
              description: `${request.other.displayName} will be told you can't lend it on those dates.`,
              confirmLabel: "Decline",
              destructive: true,
            }}
          >
            Decline
          </ActionButton>
        </div>
      )}
      {pending && side === "outgoing" && (
        <ActionButton
          action={cancelRequest.bind(null, request.id)}
          variant="outline"
          pendingLabel="Cancelling…"
          confirm={{
            title: "Cancel your request?",
            description: "The lender will be told. You can send a new request later.",
            confirmLabel: "Cancel request",
            cancelLabel: "Keep it",
            destructive: true,
          }}
        >
          Cancel request
        </ActionButton>
      )}
      {request.status === "approved" && (
        <Link href={side === "incoming" ? "/dashboard/lending" : "/dashboard/borrowing"} className="text-sm font-semibold text-forest hover:underline">
          See the loan →
        </Link>
      )}
    </Shell>
  );
}

const LOAN_BADGE = {
  upcoming: { label: "Starts soon", variant: "neutral" },
  active: { label: "On loan", variant: "warm" },
  overdue: { label: "Overdue", variant: "danger" },
  returned: { label: "Return to confirm", variant: "warm" },
  completed: { label: "Completed", variant: "default" },
  cancelled: { label: "Cancelled", variant: "neutral" },
} as const;

export function loanPhase(loan: LoanView, today: string): keyof typeof LOAN_BADGE {
  if (loan.status === "active") {
    if (loan.startDate > today) return "upcoming";
    if (loan.endDate < today) return "overdue";
    return "active";
  }
  return loan.status;
}

export function LoanCard({ loan, today }: { loan: LoanView; today: string }) {
  const phase = loanPhase(loan, today);
  const badge = LOAN_BADGE[phase];
  const borrower = loan.role === "borrower";
  return (
    <Shell item={loan.item}>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={badge.variant}>{badge.label}</Badge>
        <span className="flex items-center gap-1 text-sm text-stone">
          <CalendarRange className="size-4" aria-hidden />
          {dates(loan.startDate, loan.endDate)}
        </span>
      </div>
      <PersonLine person={loan.other} label={borrower ? "Lent by" : "Borrowed by"} />

      {loan.pickupDetails && (phase === "upcoming" || phase === "active" || phase === "overdue") && (
        <p className="flex gap-2 rounded-lg bg-fresh-soft/70 p-3 text-sm text-charcoal/85">
          <Truck className="mt-0.5 size-4 shrink-0 text-forest" aria-hidden />
          <span>
            <span className="font-semibold">Pickup: </span>
            {loan.pickupDetails}
          </span>
        </p>
      )}

      {phase === "returned" && (
        <p className="text-sm text-charcoal/85">
          {loan.iConfirmed
            ? `You've confirmed the return. Waiting for ${loan.other.displayName} to confirm.`
            : `${loan.other.displayName} has confirmed the return. Please confirm too, to complete the loan.`}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {(phase === "active" || phase === "overdue" || (phase === "returned" && !loan.iConfirmed)) && (
          <ActionButton
            action={confirmReturn.bind(null, loan.id)}
            pendingLabel="Confirming…"
            confirm={{
              title: borrower ? "Have you returned it?" : "Did you get it back?",
              description: borrower
                ? `Confirm that you gave the item back to ${loan.other.displayName}. They'll be asked to confirm too.`
                : `Confirm that ${loan.other.displayName} returned the item. They'll be asked to confirm too.`,
              confirmLabel: borrower ? "Yes, I returned it" : "Yes, I got it back",
            }}
          >
            {borrower ? "I've returned it" : "I got it back"}
          </ActionButton>
        )}
        {phase === "upcoming" && (
          <ActionButton
            action={cancelLoan.bind(null, loan.id)}
            variant="outline"
            pendingLabel="Cancelling…"
            confirm={{
              title: "Cancel this loan?",
              description: `It hasn't started yet. ${loan.other.displayName} will be told.`,
              confirmLabel: "Cancel loan",
              cancelLabel: "Keep it",
              destructive: true,
            }}
          >
            Cancel loan
          </ActionButton>
        )}
      </div>

      {phase === "completed" && (loan.reviewed ? (
        <p className="text-sm text-stone">You reviewed {loan.other.displayName}. Thanks!</p>
      ) : (
        <ReviewForm borrowingId={loan.id} name={loan.other.displayName} />
      ))}
    </Shell>
  );
}

/** Layout shared by both cards: item photo on the left, details on the right. */
function Shell({ item, children }: { item: ItemSummary; children: React.ReactNode }) {
  return (
    <article className="flex flex-col gap-4 rounded-xl border bg-card p-4 sm:flex-row sm:p-5">
      <Link href={`/items/${item.id}`} className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-lg sm:size-28 sm:aspect-square">
        <ItemImage src={item.imageUrl ?? undefined} alt={item.title} category={item.category} />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <h3 className="text-lg leading-snug">
          <Link href={`/items/${item.id}`} className="hover:underline">
            {item.title}
          </Link>
        </h3>
        {children}
      </div>
    </article>
  );
}

export function PersonLine({ person, label }: { person: Person; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Avatar className="size-7">
        {person.avatarUrl && <AvatarImage src={person.avatarUrl} alt="" />}
        <AvatarFallback className="text-[0.65rem]">{initials(person.displayName)}</AvatarFallback>
      </Avatar>
      <span className="text-stone">{label}</span>
      <Link href={`/members/${person.id}`} className="font-semibold text-forest hover:underline">
        {person.displayName}
      </Link>
      {person.area && (
        <span className="hidden items-center gap-0.5 text-xs text-stone sm:flex">
          <MapPin className="size-3" aria-hidden />
          {person.area}
        </span>
      )}
    </div>
  );
}
