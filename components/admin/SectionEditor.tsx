"use client";

import { useState, useTransition } from "react";
import type { Field, SectionSchema } from "@/lib/cms/schemas";
import type { ContentStatus, UserRole } from "@/lib/supabase/types";
import { canPublish } from "@/lib/auth/roles";
import { saveSection } from "@/app/(admin)/admin/(guarded)/content/pages/actions";
import { Alert, Badge, Button, Field as FieldWrap, INPUT_CLASS, label } from "./ui";

/**
 * Renders an editing form from a section schema.
 *
 * The schema is the contract: the admin never hardcodes a field list, so
 * adding a field to `lib/cms/schemas.ts` makes it editable here and readable
 * in the renderer without touching this component.
 */

type Data = Record<string, unknown>;

function TextInput({
  field,
  value,
  onChange,
}: {
  field: Field;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const str = typeof value === "string" ? value : "";

  if (field.type === "textarea" || field.type === "richtext") {
    return (
      <textarea
        value={str}
        onChange={(e) => onChange(e.target.value)}
        rows={field.type === "richtext" ? 8 : 4}
        maxLength={field.maxLength}
        className={`${INPUT_CLASS} resize-y`}
      />
    );
  }

  if (field.type === "boolean") {
    return (
      <label className="inline-flex items-center gap-3">
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
          className="h-5 w-5 border-[3px] border-charcoal accent-gold"
        />
        <span className="font-sans text-[0.84rem] font-bold text-charcoal">
          Enabled
        </span>
      </label>
    );
  }

  if (field.type === "number") {
    return (
      <input
        type="number"
        value={typeof value === "number" ? value : ""}
        onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
        className={INPUT_CLASS}
      />
    );
  }

  if (field.type === "select" && field.options) {
    return (
      <select
        value={str}
        onChange={(e) => onChange(e.target.value)}
        className={`${INPUT_CLASS} appearance-none`}
      >
        {field.options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    );
  }

  return (
    <input
      type="text"
      value={str}
      onChange={(e) => onChange(e.target.value)}
      maxLength={field.maxLength}
      className={INPUT_CLASS}
    />
  );
}

/** Repeating group — the six Ds, the beliefs, the process steps. */
function ListInput({
  field,
  value,
  onChange,
}: {
  field: Field;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const items = Array.isArray(value) ? (value as Data[]) : [];
  const itemFields = field.itemFields ?? [];

  const update = (i: number, key: string, v: unknown) => {
    const next = items.map((item, idx) => (idx === i ? { ...item, [key]: v } : item));
    onChange(next);
  };

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-4">
      {items.map((item, i) => (
        <div key={i} className="border-[3px] border-charcoal/30 bg-bone/60 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-sans text-[0.6rem] font-black uppercase tracking-[0.2em] text-charcoal/50">
              Item {i + 1}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => move(i, -1)}
                disabled={i === 0}
                aria-label="Move up"
                className="border-2 border-charcoal px-2 py-0.5 font-sans text-[0.66rem] font-black disabled:opacity-30"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => move(i, 1)}
                disabled={i === items.length - 1}
                aria-label="Move down"
                className="border-2 border-charcoal px-2 py-0.5 font-sans text-[0.66rem] font-black disabled:opacity-30"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => onChange(items.filter((_, idx) => idx !== i))}
                aria-label="Remove"
                className="border-2 border-charcoal bg-[#c8322a] px-2 py-0.5 font-sans text-[0.66rem] font-black text-cream"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {itemFields.map((f) => (
              <FieldWrap key={f.key} label={f.label} help={f.help}>
                <TextInput
                  field={f}
                  value={item[f.key]}
                  onChange={(v) => update(i, f.key, v)}
                />
              </FieldWrap>
            ))}
          </div>
        </div>
      ))}

      <Button
        tone="secondary"
        onClick={() =>
          onChange([
            ...items,
            Object.fromEntries(itemFields.map((f) => [f.key, ""])),
          ])
        }
      >
        Add item
      </Button>
    </div>
  );
}

export function SectionEditor({
  sectionId,
  schema,
  initialData,
  initialStatus,
  initialScheduledAt,
  pageSlug,
  role,
}: {
  sectionId: string;
  schema: SectionSchema;
  initialData: Data;
  initialStatus: ContentStatus;
  initialScheduledAt: string | null;
  pageSlug: string;
  role: UserRole;
}) {
  const [data, setData] = useState<Data>(initialData);
  const [status, setStatus] = useState<ContentStatus>(initialStatus);
  const [scheduledAt, setScheduledAt] = useState(initialScheduledAt?.slice(0, 16) ?? "");
  const [message, setMessage] = useState<{ tone: "error" | "success"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const dirty = JSON.stringify(data) !== JSON.stringify(initialData) ||
    status !== initialStatus;

  const mayPublish = canPublish(role);

  function submit() {
    setMessage(null);
    startTransition(async () => {
      const result = await saveSection(
        sectionId,
        data,
        status,
        scheduledAt ? new Date(scheduledAt).toISOString() : null,
        pageSlug,
      );

      setMessage(
        result.ok
          ? { tone: "success", text: "Saved. The site updates within moments." }
          : { tone: "error", text: result.error },
      );
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {message ? <Alert tone={message.tone}>{message.text}</Alert> : null}

      <div className="flex flex-col gap-6">
        {schema.fields.map((field) => (
          <FieldWrap
            key={field.key}
            label={field.label}
            help={field.help}
            required={field.required}
          >
            {field.type === "list" ? (
              <ListInput
                field={field}
                value={data[field.key]}
                onChange={(v) => setData((d) => ({ ...d, [field.key]: v }))}
              />
            ) : (
              <TextInput
                field={field}
                value={data[field.key]}
                onChange={(v) => setData((d) => ({ ...d, [field.key]: v }))}
              />
            )}
          </FieldWrap>
        ))}
      </div>

      <div className="flex flex-wrap items-end justify-between gap-5 border-t-[3px] border-charcoal pt-5">
        <div className="flex flex-wrap items-end gap-4">
          <FieldWrap label="Status">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ContentStatus)}
              className={`${INPUT_CLASS} appearance-none`}
            >
              <option value="draft">Draft</option>
              <option value="in_review">In review</option>
              <option value="scheduled">Scheduled</option>
              {mayPublish ? <option value="published">Published</option> : null}
              <option value="archived">Archived</option>
            </select>
          </FieldWrap>

          {status === "scheduled" ? (
            <FieldWrap label="Publishes at">
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className={INPUT_CLASS}
              />
            </FieldWrap>
          ) : null}

          <div className="pb-2">
            <Badge tone={status}>{label(status)}</Badge>
          </div>
        </div>

        <Button onClick={submit} disabled={pending || !dirty}>
          {pending ? "Saving…" : dirty ? "Save changes" : "Saved"}
        </Button>
      </div>

      {!mayPublish ? (
        <p className="font-sans text-[0.78rem] font-medium leading-[1.6] text-charcoal/55">
          You can save and schedule. Publishing is an admin action — set the
          status to <strong>In review</strong> and it will appear in their queue.
        </p>
      ) : null}
    </div>
  );
}
