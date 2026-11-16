import Link from "next/link";
import { Eye, Pause, Play, Trash2 } from "lucide-react";
import { ActionButton } from "@/components/shared/action-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { deleteItem, setItemStatus } from "@/lib/actions/items";

/** Owner-only controls for one listing: view, pause/resume, delete. */
export function ListingControls({ itemId, status }: { itemId: string; status: "active" | "paused" | "removed" }) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-card p-3">
      <Badge variant={status === "active" ? "default" : status === "paused" ? "warm" : "danger"} className="mr-auto ml-1">
        {status === "active" ? "Live on Explore" : status === "paused" ? "Paused (hidden)" : "Removed by a moderator"}
      </Badge>
      <Button asChild variant="ghost" size="sm">
        <Link href={`/items/${itemId}`}>
          <Eye aria-hidden />
          View
        </Link>
      </Button>
      {status === "active" && (
        <ActionButton action={setItemStatus.bind(null, itemId, "paused")} variant="outline" pendingLabel="Pausing…">
          <Pause aria-hidden />
          Pause
        </ActionButton>
      )}
      {status === "paused" && (
        <ActionButton action={setItemStatus.bind(null, itemId, "active")} variant="outline" pendingLabel="Resuming…">
          <Play aria-hidden />
          Resume
        </ActionButton>
      )}
      <ActionButton
        action={deleteItem.bind(null, itemId)}
        variant="ghost"
        pendingLabel="Deleting…"
        className="text-destructive hover:bg-destructive/8"
        confirm={{
          title: "Delete this listing?",
          description:
            "It's removed for good, with its photos. Past loans stay in your history. If it's on loan right now, pause it instead.",
          confirmLabel: "Delete listing",
          cancelLabel: "Keep it",
          destructive: true,
        }}
      >
        <Trash2 aria-hidden />
        Delete
      </ActionButton>
    </div>
  );
}
