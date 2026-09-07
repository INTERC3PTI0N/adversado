import { getSupabase } from "@/lib/supabase/server";
import { isAdmin, requireStaff } from "@/lib/auth/rbac";
import { PageHeading, Stat } from "@/components/admin/ui";
import { MediaLibrary } from "@/components/admin/MediaLibrary";
import type { Media } from "@/lib/supabase/types";

export const metadata = { title: "Media — Adversado Admin" };
export const dynamic = "force-dynamic";

export default async function MediaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { profile } = await requireStaff("editor");
  const sp = await searchParams;

  const supabase = await getSupabase();

  const { data: folderRows } = await supabase
    .from("media_folders")
    .select("id, name")
    .order("name");

  const folders = folderRows ?? [];
  // Validated against the real list, so a stray query value shows everything
  // rather than an empty grid that looks like data loss.
  const folderId = folders.some((f) => f.id === sp.folder) ? sp.folder! : "";

  /* Public bucket only. Client documents live in the private `documents`
     bucket and are managed from the client's own page — showing them here
     would invite someone to paste a URL that only works for them. */
  let query = supabase
    .from("media")
    .select("*")
    .eq("bucket", "media")
    .order("created_at", { ascending: false })
    .limit(300);
  if (folderId) query = query.eq("folder_id", folderId);

  const { data } = await query;
  const items = (data ?? []) as Media[];

  const bytes = items.reduce((a, m) => a + m.size_bytes, 0);
  const missingAlt = items.filter(
    (m) => m.mime_type.startsWith("image/") && !m.alt_text,
  ).length;

  return (
    <>
      <PageHeading
        eyebrow="Content"
        title="Media"
        description="Every image, video and document on the site. Files uploaded here can be used by any page, post or project."
      />

      <div className="mb-7 grid gap-5 sm:grid-cols-3">
        <Stat label="Files" value={items.length} hint={folderId ? "In this folder" : "Across the site"} />
        <Stat label="Storage used" value={`${(bytes / 1048576).toFixed(1)} MB`} />
        <Stat
          label="Missing alt text"
          value={missingAlt}
          tone={missingAlt > 0 ? "gold" : "cream"}
          hint="Images a screen reader cannot describe"
        />
      </div>

      <MediaLibrary
        items={items}
        folders={folders}
        folderId={folderId}
        publicBase={process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""}
        canDelete={isAdmin(profile.role)}
      />
    </>
  );
}
