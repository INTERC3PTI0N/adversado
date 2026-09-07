"use client";

import { useState, useTransition } from "react";
import { saveSeoSettings } from "@/app/(admin)/admin/(guarded)/seo/actions";
import type { Field as FieldDef } from "@/lib/cms/schemas";
import {
  Alert, Button, Field, INPUT_CLASS, Panel, PanelHeader,
} from "./ui";

/**
 * The SEO singleton, rendered from a field list.
 *
 * Both this and the site settings screen edit the same row, so each is handed
 * the subset it owns — no field appears on both, and saving one never blanks
 * what the other set.
 */
export function SeoSettingsForm({
  groups,
  initial,
}: {
  groups: { title: string; hint?: string; fields: FieldDef[] }[];
  initial: Record<string, string>;
}) {
  const [values, setValues] = useState(initial);
  const [message, setMessage] = useState<{ tone: "error" | "success"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const dirty = JSON.stringify(values) !== JSON.stringify(initial);

  function submit() {
    setMessage(null);
    startTransition(async () => {
      const result = await saveSeoSettings(values);
      setMessage(
        result.ok
          ? { tone: "success", text: "Saved. The site picks this up within moments." }
          : { tone: "error", text: result.error },
      );
    });
  }

  return (
    <div className="flex flex-col gap-7">
      {message ? <Alert tone={message.tone}>{message.text}</Alert> : null}

      {groups.map((group) => (
        <Panel key={group.title}>
          <PanelHeader title={group.title} hint={group.hint} />
          <div className="flex flex-col gap-6 p-5 sm:p-6">
            {group.fields.map((field) => (
              <Field key={field.key} label={field.label} help={field.help}>
                {field.type === "textarea" || field.type === "richtext" ? (
                  <textarea
                    rows={field.type === "richtext" ? 12 : 4}
                    value={values[field.key] ?? ""}
                    onChange={(e) =>
                      setValues((v) => ({ ...v, [field.key]: e.target.value }))
                    }
                    maxLength={field.maxLength}
                    className={`${INPUT_CLASS} resize-y ${
                      field.type === "richtext" ? "font-mono text-[0.78rem]" : ""
                    }`}
                  />
                ) : (
                  <input
                    type="text"
                    value={values[field.key] ?? ""}
                    onChange={(e) =>
                      setValues((v) => ({ ...v, [field.key]: e.target.value }))
                    }
                    maxLength={field.maxLength}
                    className={INPUT_CLASS}
                  />
                )}

                {/* Search engines truncate around these lengths; showing the
                    count is the difference between writing to fit and finding
                    out from a search result. */}
                {field.maxLength ? (
                  <span
                    className={`mt-1 block text-right font-sans text-[0.68rem] font-bold tabular-nums ${
                      (values[field.key] ?? "").length > field.maxLength * 0.95
                        ? "text-[#c8322a]"
                        : "text-charcoal/40"
                    }`}
                  >
                    {(values[field.key] ?? "").length} / {field.maxLength}
                  </span>
                ) : null}
              </Field>
            ))}
          </div>
        </Panel>
      ))}

      <div className="flex justify-end">
        <Button onClick={submit} disabled={pending || !dirty}>
          {pending ? "Saving…" : dirty ? "Save changes" : "Saved"}
        </Button>
      </div>
    </div>
  );
}
