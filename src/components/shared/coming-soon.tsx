import Link from "next/link";
import { Hammer } from "lucide-react";
import { EmptyState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";

/**
 * Temporary placeholder for pages built in later phases, so links never
 * lead to a broken page. Each use will be replaced by the real page.
 */
export function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-20 sm:px-6">
      <EmptyState
        icon={Hammer}
        title={title}
        description={description}
        action={
          <Button asChild>
            <Link href="/explore">Explore items</Link>
          </Button>
        }
      />
    </div>
  );
}
