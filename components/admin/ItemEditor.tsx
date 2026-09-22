"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Collection } from "@/lib/cms/collections";
import { SEO_FIELDS } from "@/lib/cms/collections";
import type { Field as FieldDef } from "@/lib/cms/schemas";
import type { ContentStatus, UserRole } from "@/lib/supabase/types";
import { canPublish } from "@/lib/auth/roles";
import { deleteItem, saveItem } from "@/app/(admin)/admin/(guarded)/content/[collection]/actions";
import {
  Alert, Badge, Button, Field, INPUT_CLASS, Panel, PanelHeader, label,
} from "./ui";

/** A media-library image, as offered to an `image` field. */
export type MediaOption = { id: string; filename: string; url: string };

/**
 * Editor for one collection item.
 *
 * Fields come from the registry, so this component is the same for a blog post
 * and a testimonial. The SEO block is appended for collections that carry one.
 */
export function ItemEditor({
  collection, id, initial, role, media = [],
}: {
  collection: Collection;
  id: string | null;
  initial: Record<string, unknown>;
  role: UserRole;
  /** Images from the library, for any `image` field. Stored as the media id. */
  media?: MediaOption[];
}) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, unknown>>(initial);
  const [status, setStatus] = useState<ContentStatus>(
    (initial.status as ContentStatus) ?? "draft",
  );
  const [scheduledAt, setScheduledAt] = useState(
    typeof initial.scheduled_at === "string" ? initial.scheduled_at.slice(0, 16) : "",
  );
  const [message, setMessage] = useState<{ tone: "error" | "success"; text: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pending, startTransition] = useTransition();

  const mayPublish = canPublish(role);

  function set(key: string, value: unknown) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  /** Slugify from the title, but only while the slug is untouched. */
  function onTitleChange(value: string) {
    set(collection.titleField, value);

    if (!collection.slugField) return;
    const current = String(values[collection.slugField] ?? "");
    const wasAuto =
      current === "" ||
      current === slugify(String(values[collection.titleField] ?? ""));

    if (wasAuto) set(collection.slugField, slugify(value));
  }

  function submit() {
    setMessage(null);
    startTransition(async () => {
      const result = await saveItem(
        collection.route,
        id,
        values,
        status,
        scheduledAt ? new Date(scheduledAt).toISOString() : null,
      );

      if (!result.ok) {
        setMessage({ tone: "error", text: result.error });
        return;
      }

      setMessage({ tone: "success", text: "Saved." });

      // A new item has no URL yet; move to its own once it exists.
      if (!id && result.id) {
        router.replace(`/admin/content/${collection.route}/${result.id}`);
      }
      router.refresh();
    });
  }

  function renderField(field: FieldDef) {
    const value = values[field.key];

    if (field.type === "boolean") {
      return (
        <label className="inline-flex items-center gap-3">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => set(field.key, e.target.checked)}
            className="h-5 w-5 border-[3px] border-charcoal accent-gold"
          />
          <span className="font-sans text-[0.84rem] font-bold text-charcoal">Yes</span>
        </label>
      );
    }

    if (field.type === "number") {
      return (
        <input
          type="number"
          value={typeof value === "number" ? value : ""}
          onChange={(e) => set(field.key, e.target.value === "" ? null : Number(e.target.value))}
          className={INPUT_CLASS}
        />
      );
    }

    if (field.type === "textarea" || field.type === "richtext") {
      return (
        <textarea
          rows={field.type === "richtext" ? 12 : 4}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => set(field.key, e.target.value)}
          maxLength={field.maxLength}
          className={`${INPUT_CLASS} resize-y`}
        />
      );
    }

    /* The schema has declared `image` all along, but nothing rendered it — it
       fell through to the text input below, so a cover could only be set by
       pasting a uuid. It stores the media row's id, which is what the `_id`
       foreign keys (`cover_id`, `photo_id`, `avatar_id`) expect. */
    if (field.type === "image") {
      const selected = media.find((m) => m.id === value);

      return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <div className="flex h-28 w-40 shrink-0 items-center justify-center overflow-hidden border-[3px] border-charcoal bg-bone">
            {selected ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={selected.url} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="font-sans text-[0.6rem] font-black uppercase tracking-[0.16em] text-charcoal/35">
                No image
              </span>
            )}
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <select
              value={typeof value === "string" ? value : ""}
              onChange={(e) => set(field.key, e.target.value || null)}
              className={`${INPUT_CLASS} appearance-none`}
            >
              <option value="">None</option>
              {media.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.filename}
                </option>
              ))}
            </select>
            <a
              href="/admin/media"
              target="_blank"
              rel="noreferrer"
              className="font-sans text-[0.74rem] font-bold text-charcoal/55 underline decoration-charcoal/25 underline-offset-4 hover:text-charcoal"
            >
              {media.length === 0 ? "Upload one in the media library ↗" : "Upload another ↗"}
            </a>
          </div>
        </div>
      );
    }

    const isTitle = field.key === collection.titleField;

    return (
      <input
        type="text"
        value={typeof value === "string" ? value : ""}
        onChange={(e) => (isTitle ? onTitleChange(e.target.value) : set(field.key, e.target.value))}
        maxLength={field.maxLength}
        className={INPUT_CLASS}
      />
    );
  }

  return (
    <div className="flex flex-col gap-7">
      {message ? <Alert tone={message.tone}>{message.text}</Alert> : null}

      <Panel>
        <PanelHeader title={collection.singular} hint={collection.description} />
        <div className="flex flex-col gap-6 p-5 sm:p-6">
          {collection.fields.map((field) => (
            <Field key={field.key} label={field.label} help={field.help} required={field.required}>
              {renderField(field)}
            </Field>
          ))}
        </div>
      </Panel>

      {collection.seo ? (
        <Panel>
          <PanelHeader
            title="Search engines"
            hint="Leave blank to fall back to the title and excerpt."
          />
          <div className="flex flex-col gap-6 p-5 sm:p-6">
            {SEO_FIELDS.map((field) => (
              <Field key={field.key} label={field.label} help={field.help}>
                {renderField(field)}
              </Field>
            ))}
          </div>
        </Panel>
      ) : null}

      <Panel>
        <PanelHeader title="Publishing" />
        <div className="flex flex-wrap items-end justify-between gap-5 p-5">
          <div className="flex flex-wrap items-end gap-4">
            <Field label="Status">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ContentStatus)}
                className={`${INPUT_CLASS} appearance-none`}
              >
                <option value="draft">Draft</option>
                <option value="in_review">In review</option>
                {collection.publishable ? <option value="scheduled">Scheduled</option> : null}
                {mayPublish || !collection.publishable ? (
                  <option value="published">Published</option>
                ) : null}
                <option value="archived">Archived</option>
              </select>
            </Field>

            {status === "scheduled" ? (
              <Field label="Publishes at">
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className={INPUT_CLASS}
                />
              </Field>
            ) : null}

            <div className="pb-2">
              <Badge tone={status}>{label(status)}</Badge>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {id ? (
              confirmDelete ? (
                <>
                  <Button
                    tone="danger"
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        const r = await deleteItem(collection.route, id);
                        if (r.ok) router.push(`/admin/content/${collection.route}`);
                        else setMessage({ tone: "error", text: r.error });
                      })
                    }
                  >
                    Really delete
                  </Button>
                  <Button tone="secondary" onClick={() => setConfirmDelete(false)}>
                    Keep
                  </Button>
                </>
              ) : (
                <Button tone="secondary" onClick={() => setConfirmDelete(true)}>
                  Delete
                </Button>
              )
            ) : null}

            <Button onClick={submit} disabled={pending}>
              {pending ? "Saving…" : id ? "Save changes" : `Create ${collection.singular.toLowerCase()}`}
            </Button>
          </div>
        </div>

        {!mayPublish && collection.publishable ? (
          <p className="border-t-[3px] border-charcoal px-5 py-4 font-sans text-[0.8rem] font-medium leading-[1.6] text-charcoal/60">
            You can save and schedule. Publishing is an admin action — set the
            status to <strong>In review</strong> and it will appear in their queue.
          </p>
        ) : null}
      </Panel>
    </div>
  );
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
