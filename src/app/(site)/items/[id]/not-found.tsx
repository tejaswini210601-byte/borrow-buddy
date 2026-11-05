import Link from "next/link";
import { PackageX } from "lucide-react";
import { EmptyState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";

export default function ItemNotFound() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-20 sm:px-6">
      <EmptyState
        icon={PackageX}
        title="This item isn't listed any more"
        description="The lender may have removed it, or the link is mistyped."
        action={
          <Button asChild>
            <Link href="/explore">Explore other items</Link>
          </Button>
        }
      />
    </div>
  );
}
