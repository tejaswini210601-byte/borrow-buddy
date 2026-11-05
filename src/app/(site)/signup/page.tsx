import type { Metadata } from "next";
import { ComingSoon } from "@/components/shared/coming-soon";

export const metadata: Metadata = { title: "Sign up" };

// Placeholder until Phase 4 (authentication).
export default function Page() {
  return (
    <ComingSoon
      title="Sign up isn't open yet"
      description="Accounts are being built. Soon you'll create a free account here to borrow and lend."
    />
  );
}
