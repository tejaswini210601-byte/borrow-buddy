import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/auth-card";
import { NewPasswordForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = { title: "Choose a new password" };

/**
 * People arrive here from the reset link in their email. The link
 * (handled by /auth/confirm) has already logged them in, so all that's
 * left is to save the new password.
 */
export default function ResetPasswordPage() {
  return (
    <AuthCard title="Choose a new password" description="After saving, you'll stay logged in.">
      <NewPasswordForm />
    </AuthCard>
  );
}
