import { getSupabase } from "@/lib/supabase/server";
import { requireClient } from "@/lib/auth/rbac";
import { EmptyState, PageHeading, Panel } from "@/components/admin/ui";
import { mediaUrl } from "@/lib/cms/content";
import { shortDate } from "@/lib/format";

export const metadata = { title: "Files — Adversado" };
export const dynamic = "force-dynamic";

/** Signed links are short-lived by design; long enough to click, not to share. */
const SIGNED_URL_TTL = 60 * 60;

const size = (bytes: number) =>
  bytes < 1048576 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / 1048576).toFixed(1)} MB`;

/**
 * Shared files.
 *
 * Two kinds of file arrive here. Anything in the public `media` bucket gets a
 * plain URL. Anything in `documents` is private and gets a signed URL minted
 * here, after RLS has already confirmed this client may see the row — the
 * signature is the second lock, not the first.
 */
export default async function PortalFiles() {
  await requireClient();
  const supabase = await getSupabase();

  // No `.eq("client_id", …)`: `client_documents_read` scopes this to the
  // signed-in client and to `is_visible` rows only.
  const { data } = await supabase
    .from("client_documents")
    .select("id, title, created_at, media_id")
    .order("created_at", { ascending: false });

  const documents = data ?? [];
  const mediaIds = documents.map((d) => d.media_id).filter(Boolean) as string[];

  const { data: mediaRows } = mediaIds.length
    ? await supabase
        .from("media")
        .select("id, bucket, storage_path, filename, mime_type, size_bytes")
        .in("id", mediaIds)
    : { data: [] };

  const media = new Map((mediaRows ?? []).map((m) => [m.id, m]));

  const links = await Promise.all(
    documents.map(async (doc) => {
      const file = doc.media_id ? media.get(doc.media_id) : null;
      if (!file) return { ...doc, file: null, href: null };

      if (file.bucket !== "documents") {
        return { ...doc, file, href: mediaUrl(file.bucket, file.storage_path) };
      }

      const { data: signed } = await supabase.storage
        .from(file.bucket)
        .createSignedUrl(file.storage_path, SIGNED_URL_TTL);

      return { ...doc, file, href: signed?.signedUrl ?? null };
    }),
  );

  return (
    <>
      <PageHeading
        eyebrow="Your account"
        title="Files"
        description="Everything we've shared with you — decks, guidelines, contracts."
      />

      {links.length === 0 ? (
        <Panel>
          <EmptyState
            title="Nothing shared yet"
            body="Files we send you will appear here, and stay here."
          />
        </Panel>
      ) : (
        <Panel>
          <ul className="divide-y divide-charcoal/15">
            {links.map((doc) => (
              <li key={doc.id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
                <div className="min-w-0">
                  <p className="truncate font-sans text-[0.95rem] font-black text-charcoal">
                    {doc.title}
                  </p>
                  <p className="font-sans text-[0.74rem] font-bold text-charcoal/45">
                    {shortDate(doc.created_at)}
                    {doc.file ? ` · ${size(doc.file.size_bytes)}` : ""}
                    {doc.file?.bucket === "documents" ? " · private" : ""}
                  </p>
                </div>

                {doc.href ? (
                  <a
                    href={doc.href}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 border-[3px] border-charcoal bg-gold px-5 py-2.5 font-sans text-[0.62rem] font-black uppercase tracking-[0.18em] text-charcoal shadow-[4px_4px_0_0_#212121]"
                  >
                    Open
                  </a>
                ) : (
                  <span className="shrink-0 font-sans text-[0.76rem] font-bold text-charcoal/40">
                    Unavailable
                  </span>
                )}
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </>
  );
}
