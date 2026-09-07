import { getSupabase } from "@/lib/supabase/server";
import { requireStaffApi } from "@/lib/auth/rbac";

/**
 * Media upload.
 *
 * A route handler rather than a Server Action because the body is a real file:
 * actions serialise their arguments, and pushing a 10MB image through that is
 * both slow and capped. Here the browser streams the multipart body straight in.
 *
 * The upload runs on the *session* client, not the service role, so Postgres
 * and Storage both check `is_staff()` for themselves. A stolen anon key gets
 * nowhere near this.
 */

const MAX_BYTES = 25 * 1024 * 1024;

/* Allow-list rather than deny-list. The bucket is public, so anything landing
   in it is served from our own origin — an uploaded .html or .svg would be a
   stored-XSS hole on the site's domain. */
const ALLOWED = new Set([
  "image/jpeg", "image/png", "image/webp", "image/avif", "image/gif",
  "video/mp4", "video/webm",
  "application/pdf",
]);

const EXT: Record<string, string> = {
  "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp",
  "image/avif": "avif", "image/gif": "gif",
  "video/mp4": "mp4", "video/webm": "webm", "application/pdf": "pdf",
};

/** `2026/09/tall-oak-a1b2c3.jpg` — dated folders keep the bucket browsable,
    and the random suffix means two files of the same name never collide. */
function storageKey(filename: string, mime: string): string {
  const now = new Date();
  const stem =
    filename
      .replace(/\.[^.]+$/, "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "file";

  const suffix = crypto.randomUUID().slice(0, 6);
  const ext = EXT[mime] ?? "bin";

  return `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/${stem}-${suffix}.${ext}`;
}

export async function POST(request: Request) {
  const guard = await requireStaffApi("editor");
  if ("error" in guard) return guard.error;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: "Malformed upload." }, { status: 400 });
  }

  const file = form.get("file");
  const folderId = form.get("folder_id");

  if (!(file instanceof File) || file.size === 0) {
    return Response.json({ error: "No file received." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return Response.json(
      { error: `That file is ${(file.size / 1048576).toFixed(1)}MB. The limit is 25MB.` },
      { status: 413 },
    );
  }
  if (!ALLOWED.has(file.type)) {
    return Response.json(
      { error: `${file.type || "That file type"} isn't allowed. Images, MP4, WebM and PDF only.` },
      { status: 415 },
    );
  }

  const supabase = await getSupabase();
  const path = storageKey(file.name, file.type);

  const { error: uploadError } = await supabase.storage
    .from("media")
    .upload(path, file, { contentType: file.type, upsert: false });

  if (uploadError) {
    return Response.json({ error: uploadError.message }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("media")
    .insert({
      bucket: "media",
      storage_path: path,
      filename: file.name,
      mime_type: file.type,
      size_bytes: file.size,
      folder_id: typeof folderId === "string" && folderId ? folderId : null,
      uploaded_by: guard.session.userId,
    })
    .select("*")
    .single();

  if (error) {
    // The row is the record; an object with no row is invisible and unreclaimable.
    await supabase.storage.from("media").remove([path]);
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ media: data });
}
