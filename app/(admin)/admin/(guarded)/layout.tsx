import { headers } from "next/headers";
import { requireStaff } from "@/lib/auth/rbac";
import { AdminNav } from "@/components/admin/Nav";
import { AdminTopbar } from "@/components/admin/Topbar";

/**
 * Guarded admin shell.
 *
 * `requireStaff()` runs before anything renders and redirects on the server, so
 * protected markup is never sent to an unauthorised visitor — a client-side
 * check would ship the HTML first and hide it after.
 *
 * The login page sits outside this layout, in the route group's own layout, so
 * it can render without a session.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await requireStaff("editor");

  // Path is read for the topbar breadcrumb; headers() also opts this layout out
  // of static rendering, which a session-dependent shell must be.
  const h = await headers();
  const pathname = h.get("x-invoke-path") ?? "";

  return (
    <div className="flex min-h-screen">
      <AdminNav role={profile.role} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar profile={profile} pathname={pathname} />
        <main className="min-w-0 flex-1 px-6 py-8 sm:px-8 lg:px-10">{children}</main>
      </div>
    </div>
  );
}
