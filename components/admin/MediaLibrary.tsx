"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createFolder, deleteFolder, deleteMedia, updateMedia,
} from "@/app/(admin)/admin/(guarded)/media/actions";
import type { Media } from "@/lib/supabase/types";
import {
  Alert, Button, EmptyState, Field, INPUT_CLASS, Panel, PanelHeader,
} from "./ui";

type Folder = { id: string; name: string };

const isImage = (mime: string) => mime.startsWith("image/");

function size(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

/**
 * Media library.
 *
 * Uploads go through a route handler rather than a Server Action — actions
 * serialise their arguments, which is the wrong shape for a 10MB file. Files
 * are sent one at a time so a single rejection (wrong type, too large) names
 * the file that failed instead of failing the whole batch.
 */
export function MediaLibrary({
  items,
  folders,
  folderId,
  publicBase,
  canDelete,
}: {
  items: Media[];
  folders: Folder[];
  folderId: string;
  publicBase: string;
  canDelete: boolean;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();

  const [uploading, setUploading] = useState<string | null>(null);
  const [dropping, setDropping] = useState(false);
  const [message, setMessage] = useState<{ tone: "error" | "success"; text: string } | null>(null);
  const [selected, setSelected] = useState<Media | null>(null);
  const [draft, setDraft] = useState({ alt: "", caption: "" });
  const [newFolder, setNewFolder] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const url = (m: Media) => `${publicBase}/storage/v1/object/public/${m.bucket}/${m.storage_path}`;

  async function upload(files: FileList | File[]) {
    setMessage(null);
    const list = Array.from(files);

    for (const file of list) {
      setUploading(file.name);

      const body = new FormData();
      body.append("file", file);
      if (folderId) body.append("folder_id", folderId);

      const res = await fetch("/api/admin/media/upload", { method: "POST", body });

      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: "Upload failed." }));
        setMessage({ tone: "error", text: `${file.name}: ${error}` });
        setUploading(null);
        router.refresh();
        return;
      }
    }

    setUploading(null);
    setMessage({
      tone: "success",
      text: `${list.length} file${list.length === 1 ? "" : "s"} uploaded.`,
    });
    router.refresh();
  }

  function open(item: Media) {
    setSelected(item);
    setDraft({ alt: item.alt_text ?? "", caption: item.caption ?? "" });
  }

  function run(fn: () => Promise<{ ok: true } | { ok: false; error: string }>, success?: string) {
    setMessage(null);
    startTransition(async () => {
      const result = await fn();
      if (result.ok) {
        if (success) setMessage({ tone: "success", text: success });
        router.refresh();
      } else {
        setMessage({ tone: "error", text: result.error });
      }
    });
  }

  return (
    <div className="flex flex-col gap-7">
      {message ? <Alert tone={message.tone}>{message.text}</Alert> : null}

      {/* Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDropping(true);
        }}
        onDragLeave={() => setDropping(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDropping(false);
          if (e.dataTransfer.files.length) upload(e.dataTransfer.files);
        }}
        className={`border-[4px] border-dashed px-6 py-10 text-center transition-colors duration-150 ${
          dropping ? "border-gold bg-gold/10" : "border-charcoal/40 bg-cream"
        }`}
      >
        <p className="font-sans text-[1rem] font-black uppercase tracking-[-0.01em] text-charcoal">
          {uploading ? `Uploading ${uploading}…` : "Drop files here"}
        </p>
        <p className="mx-auto mt-2 max-w-[44ch] font-sans text-[0.86rem] font-medium text-charcoal/60">
          Images, MP4, WebM and PDF. 25MB each.
          {folderId ? " They land in the folder you have open." : ""}
        </p>

        <input
          ref={inputRef}
          type="file"
          multiple
          hidden
          accept="image/*,video/mp4,video/webm,application/pdf"
          onChange={(e) => {
            if (e.target.files?.length) upload(e.target.files);
            e.target.value = "";
          }}
        />

        <div className="mt-6 flex justify-center">
          <Button disabled={Boolean(uploading)} onClick={() => inputRef.current?.click()}>
            {uploading ? "Uploading…" : "Choose files"}
          </Button>
        </div>
      </div>

      {/* Folders */}
      <Panel>
        <PanelHeader title="Folders" hint="Deleting a folder never deletes what is in it." />
        <div className="flex flex-wrap items-center gap-3 p-5">
          <a
            href="/admin/media"
            className={`border-[3px] border-charcoal px-4 py-2 font-sans text-[0.66rem] font-black uppercase tracking-[0.16em] ${
              folderId ? "bg-cream text-charcoal" : "bg-charcoal text-gold"
            }`}
          >
            Everything
          </a>

          {folders.map((folder) => (
            <span key={folder.id} className="inline-flex">
              <a
                href={`/admin/media?folder=${folder.id}`}
                className={`border-[3px] border-charcoal px-4 py-2 font-sans text-[0.66rem] font-black uppercase tracking-[0.16em] ${
                  folderId === folder.id ? "bg-charcoal text-gold" : "bg-cream text-charcoal"
                }`}
              >
                {folder.name}
              </a>
              {canDelete ? (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => run(() => deleteFolder(folder.id), "Folder removed.")}
                  aria-label={`Delete folder ${folder.name}`}
                  className="border-[3px] border-l-0 border-charcoal bg-cream px-2 font-sans text-[0.66rem] font-black text-charcoal"
                >
                  ✕
                </button>
              ) : null}
            </span>
          ))}

          <span className="ml-auto inline-flex">
            <input
              value={newFolder}
              onChange={(e) => setNewFolder(e.target.value)}
              placeholder="New folder"
              className="w-40 border-[3px] border-charcoal bg-cream px-3 py-2 font-sans text-[0.82rem] font-medium text-charcoal outline-none"
            />
            <button
              type="button"
              disabled={pending || !newFolder.trim()}
              onClick={() =>
                run(async () => {
                  const r = await createFolder(newFolder);
                  if (r.ok) setNewFolder("");
                  return r;
                }, "Folder created.")
              }
              className="border-[3px] border-l-0 border-charcoal bg-gold px-4 font-sans text-[0.62rem] font-black uppercase tracking-[0.16em] text-charcoal disabled:opacity-40"
            >
              Add
            </button>
          </span>
        </div>
      </Panel>

      {/* Grid */}
      {items.length === 0 ? (
        <Panel>
          <EmptyState
            title="Nothing here yet"
            body="Drop a file above and it becomes available to every page, post and project on the site."
          />
        </Panel>
      ) : (
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => open(item)}
              className="group border-[3px] border-charcoal bg-cream text-left shadow-[5px_5px_0_0_#212121] transition-transform duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5"
            >
              <div className="flex aspect-[4/3] items-center justify-center overflow-hidden border-b-[3px] border-charcoal bg-bone">
                {isImage(item.mime_type) ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={url(item)}
                    alt={item.alt_text ?? ""}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="font-sans text-[0.66rem] font-black uppercase tracking-[0.18em] text-charcoal/45">
                    {item.mime_type.split("/")[1]}
                  </span>
                )}
              </div>

              <div className="p-3">
                <p className="truncate font-sans text-[0.78rem] font-black text-charcoal">
                  {item.filename}
                </p>
                <p className="mt-1 font-sans text-[0.68rem] font-bold text-charcoal/45">
                  {size(item.size_bytes)}
                  {!item.alt_text && isImage(item.mime_type) ? (
                    <span className="ml-2 text-[#c8322a]">No alt text</span>
                  ) : null}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Detail */}
      {selected ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-charcoal/70 p-5 sm:p-10">
          <div className="w-full max-w-[42rem] border-[4px] border-charcoal bg-cream shadow-[12px_12px_0_0_#212121]">
            <PanelHeader
              title={selected.filename}
              action={
                <Button tone="secondary" onClick={() => setSelected(null)}>
                  Close
                </Button>
              }
            />

            {isImage(selected.mime_type) ? (
              <div className="border-b-[3px] border-charcoal bg-bone p-5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url(selected)}
                  alt={selected.alt_text ?? ""}
                  className="mx-auto max-h-[22rem] w-auto"
                />
              </div>
            ) : null}

            <div className="flex flex-col gap-5 p-5">
              <Field
                label="Alt text"
                help="What the image shows, for screen readers and for search. Leave blank only if it is purely decorative."
              >
                <input
                  value={draft.alt}
                  onChange={(e) => setDraft((d) => ({ ...d, alt: e.target.value }))}
                  className={INPUT_CLASS}
                />
              </Field>

              <Field label="Caption">
                <input
                  value={draft.caption}
                  onChange={(e) => setDraft((d) => ({ ...d, caption: e.target.value }))}
                  className={INPUT_CLASS}
                />
              </Field>

              <Field label="Folder">
                <select
                  value={selected.folder_id ?? ""}
                  disabled={pending}
                  onChange={(e) =>
                    run(
                      () => updateMedia(selected.id, { folder_id: e.target.value || null }),
                      "Moved.",
                    )
                  }
                  className={`${INPUT_CLASS} appearance-none`}
                >
                  <option value="">No folder</option>
                  {folders.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Public URL">
                <div className="flex gap-3">
                  <input
                    readOnly
                    value={url(selected)}
                    onFocus={(e) => e.currentTarget.select()}
                    className={`${INPUT_CLASS} font-mono text-[0.72rem]`}
                  />
                  <Button
                    tone="secondary"
                    onClick={() => {
                      navigator.clipboard?.writeText(url(selected));
                      setCopied(selected.id);
                    }}
                  >
                    {copied === selected.id ? "Copied" : "Copy"}
                  </Button>
                </div>
              </Field>

              <p className="font-sans text-[0.74rem] font-bold text-charcoal/45">
                {selected.mime_type} · {size(selected.size_bytes)} · uploaded{" "}
                {new Date(selected.created_at).toLocaleDateString("en-GB")}
              </p>
            </div>

            <div className="flex flex-wrap justify-between gap-3 border-t-[3px] border-charcoal p-5">
              {canDelete ? (
                <Button
                  tone="danger"
                  disabled={pending}
                  onClick={() =>
                    run(async () => {
                      const r = await deleteMedia(selected.id);
                      if (r.ok) setSelected(null);
                      return r;
                    }, "File deleted.")
                  }
                >
                  Delete
                </Button>
              ) : (
                <span />
              )}

              <Button
                disabled={pending}
                onClick={() =>
                  run(
                    () =>
                      updateMedia(selected.id, {
                        alt_text: draft.alt,
                        caption: draft.caption,
                      }),
                    "Saved.",
                  )
                }
              >
                {pending ? "Saving…" : "Save"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
