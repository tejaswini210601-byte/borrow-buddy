import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, KeyRound } from "lucide-react";
import { MemberSection } from "@/components/dashboard/member-section";
import { ProfileForm } from "@/components/dashboard/profile-form";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Profile settings" };

export default function ProfileSettingsPage() {
  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Profile settings" description="What other members see about you. Your email always stays private." />
      <MemberSection path="/dashboard/profile">
        {(user) => (
          <div className="flex flex-col gap-6">
            <div className="rounded-2xl border bg-card p-6 sm:p-8">
              <ProfileForm
                userId={user.id}
                initial={{ displayName: user.displayName, area: user.area ?? "", bio: user.bio ?? "" }}
                avatarUrl={user.avatarUrl}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline">
                <Link href={`/members/${user.id}`}>
                  <ExternalLink aria-hidden />
                  View your public profile
                </Link>
              </Button>
              <Button asChild variant="ghost">
                <Link href="/reset-password">
                  <KeyRound aria-hidden />
                  Change password
                </Link>
              </Button>
            </div>
            <p className="text-sm text-stone">Logged in as {user.email}</p>
          </div>
        )}
      </MemberSection>
    </div>
  );
}
