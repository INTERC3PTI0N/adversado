import { requireStaff } from "@/lib/auth/rbac";
import { PageHeading } from "@/components/admin/ui";
import { AccountForm } from "@/components/admin/AccountForm";

export const metadata = { title: "Your account — Adversado Admin" };
export const dynamic = "force-dynamic";

/** Editor-level: everyone with a login can correct their own name. */
export default async function AccountPage() {
  const { profile } = await requireStaff("editor");

  return (
    <>
      <PageHeading
        eyebrow="Your account"
        title="Profile"
        description="Your name and position. What you can reach is set by your role, which only a super admin changes."
      />

      <AccountForm profile={profile} />
    </>
  );
}
