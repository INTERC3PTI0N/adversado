"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  deleteRedirect, saveRedirect,
} from "@/app/(admin)/admin/(guarded)/seo/actions";
import {
  Alert, Badge, Button, EmptyState, INPUT_CLASS, Panel, PanelHeader, Table, Td, Th,
} from "./ui";

type Redirect = {
  id: string;
  from_path: string;
  to_path: string;
  status_code: number;
  is_active: boolean;
  hit_count: number;
};

const CODES = [
  { value: 308, label: "308 Permanent" },
  { value: 301, label: "301 Permanent (legacy)" },
  { value: 307, label: "307 Temporary" },
  { value: 302, label: "302 Temporary (legacy)" },
];

/**
 * Redirects.
 *
 * `hit_count` is shown because it is the only way to tell a redirect that is
 * still carrying traffic from one that can safely be deleted.
 */
export function RedirectsTable({ redirects }: { redirects: Redirect[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ tone: "error" | "success"; text: string } | null>(null);
  const [draft, setDraft] = useState({ from: "", to: "", code: 308 });
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

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
    <div className="flex flex-col gap-5">
      {message ? <Alert tone={message.tone}>{message.text}</Alert> : null}

      <Panel>
        <PanelHeader
          title="Redirects"
          hint="For pages that moved. Keeps old links and search rankings working."
        />

        <div className="grid gap-4 border-b-[3px] border-charcoal bg-bone/60 p-5 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end">
          <label>
            <span className="font-sans text-[0.6rem] font-black uppercase tracking-[0.2em] text-charcoal">
              Old path
            </span>
            <input
              value={draft.from}
              onChange={(e) => setDraft((d) => ({ ...d, from: e.target.value }))}
              placeholder="/old-page"
              className={`${INPUT_CLASS} mt-2`}
            />
          </label>

          <label>
            <span className="font-sans text-[0.6rem] font-black uppercase tracking-[0.2em] text-charcoal">
              Goes to
            </span>
            <input
              value={draft.to}
              onChange={(e) => setDraft((d) => ({ ...d, to: e.target.value }))}
              placeholder="/new-page"
              className={`${INPUT_CLASS} mt-2`}
            />
          </label>

          <label>
            <span className="font-sans text-[0.6rem] font-black uppercase tracking-[0.2em] text-charcoal">
              Type
            </span>
            <select
              value={draft.code}
              onChange={(e) => setDraft((d) => ({ ...d, code: Number(e.target.value) }))}
              className={`${INPUT_CLASS} mt-2 appearance-none`}
            >
              {CODES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>

          <Button
            disabled={pending || !draft.from.trim() || !draft.to.trim()}
            onClick={() =>
              run(async () => {
                const r = await saveRedirect(null, {
                  from_path: draft.from,
                  to_path: draft.to,
                  status_code: draft.code,
                  is_active: true,
                });
                if (r.ok) setDraft({ from: "", to: "", code: 308 });
                return r;
              }, "Redirect added.")
            }
          >
            Add
          </Button>
        </div>

        {redirects.length === 0 ? (
          <EmptyState
            title="No redirects"
            body="Add one when a page moves, so the old address keeps working instead of 404ing."
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>From</Th>
                <Th>To</Th>
                <Th>Type</Th>
                <Th className="text-right">Hits</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {redirects.map((r) => (
                <tr key={r.id} className={r.is_active ? "" : "opacity-45"}>
                  <Td className="font-mono text-[0.8rem]">{r.from_path}</Td>
                  <Td className="font-mono text-[0.8rem]">{r.to_path}</Td>
                  <Td>
                    <Badge tone={r.status_code < 307 ? "draft" : "new"}>{r.status_code}</Badge>
                  </Td>
                  <Td className="text-right tabular-nums text-charcoal/60">{r.hit_count}</Td>
                  <Td className="text-right">
                    <div className="flex flex-wrap justify-end gap-2">
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() =>
                          run(() =>
                            saveRedirect(r.id, {
                              from_path: r.from_path,
                              to_path: r.to_path,
                              status_code: r.status_code,
                              is_active: !r.is_active,
                            }),
                          )
                        }
                        className="border-2 border-charcoal bg-cream px-3 py-1 font-sans text-[0.6rem] font-black uppercase tracking-[0.14em] text-charcoal disabled:opacity-40"
                      >
                        {r.is_active ? "Pause" : "Resume"}
                      </button>

                      {confirmDelete === r.id ? (
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => {
                            setConfirmDelete(null);
                            run(() => deleteRedirect(r.id), "Redirect removed.");
                          }}
                          className="border-2 border-charcoal bg-[#c8322a] px-3 py-1 font-sans text-[0.6rem] font-black uppercase tracking-[0.14em] text-cream"
                        >
                          Confirm
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => setConfirmDelete(r.id)}
                          className="border-2 border-charcoal bg-cream px-3 py-1 font-sans text-[0.6rem] font-black uppercase tracking-[0.14em] text-charcoal disabled:opacity-40"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Panel>
    </div>
  );
}
