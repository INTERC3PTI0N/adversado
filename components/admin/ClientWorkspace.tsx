"use client";

import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  archiveClient, grantPortalAccess, postClientMessage, saveClient,
  setPortalEnabled, shareDocument, unshareDocument,
} from "@/app/(admin)/admin/(guarded)/clients/actions";
import { dateTime } from "@/lib/format";
import type { Client } from "@/lib/supabase/types";
import {
  Alert, Badge, Button, Field, INPUT_CLASS, Panel, PanelHeader,
} from "./ui";

type Doc = { id: string; title: string; created_at: string; media_id: string | null };
type Message = { id: string; body: string; created_at: string; author_id: string | null };
type MediaOption = { id: string; filename: string };

const ADDRESS_KEYS = ["line1", "line2", "city", "postcode", "country"] as const;

/**
 * Client record, portal switch, shared files and messages.
 *
 * Portal access creates a real auth account, so it sits behind its own button
 * rather than a checkbox — `portal_enabled` alone controls whether the portal
 * *shows* anything, and toggling it is not the same act as issuing a login.
 */
export function ClientWorkspace({
  client,
  documents,
  messages,
  media,
  hasLogin,
}: {
  client: Client | null;
  documents: Doc[];
  messages: Message[];
  media: MediaOption[];
  hasLogin: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ tone: "error" | "success"; text: string } | null>(null);

  const address = (client?.address ?? {}) as Record<string, string>;

  const [form, setForm] = useState({
    name: client?.name ?? "",
    company: client?.company ?? "",
    email: client?.email ?? "",
    phone: client?.phone ?? "",
    notes: client?.notes ?? "",
    portal_enabled: client?.portal_enabled ?? false,
    address: Object.fromEntries(
      ADDRESS_KEYS.map((k) => [k, address[k] ?? ""]),
    ) as Record<string, string>,
  });

  const [inviteEmail, setInviteEmail] = useState(client?.email ?? "");
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [share, setShare] = useState({ mediaId: "", title: "" });
  const [confirmArchive, setConfirmArchive] = useState(false);
  const privateInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

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

  function submit() {
    setMessage(null);
    startTransition(async () => {
      const result = await saveClient(client?.id ?? null, form);
      if (!result.ok) {
        setMessage({ tone: "error", text: result.error });
        return;
      }
      if (!client) router.replace(`/admin/clients/${result.id}`);
      else {
        setMessage({ tone: "success", text: "Saved." });
        router.refresh();
      }
    });
  }

  /**
   * Upload straight into the private `documents` bucket and share it.
   *
   * The library picker below shares a file from the public website bucket,
   * which is right for a brand deck and wrong for a contract. This path is for
   * the second kind: the object is unreadable without a signed URL minted for
   * that client.
   */
  async function uploadPrivate(file: File) {
    if (!client) return;
    setMessage(null);
    setUploading(true);

    const body = new FormData();
    body.append("file", file);
    body.append("bucket", "documents");

    const res = await fetch("/api/admin/media/upload", { method: "POST", body });
    const data = await res.json().catch(() => ({}));
    setUploading(false);

    if (!res.ok || !data.media?.id) {
      setMessage({ tone: "error", text: data.error ?? "Upload failed." });
      return;
    }

    run(
      () => shareDocument(client.id, data.media.id, share.title || file.name),
      "Uploaded and shared privately.",
    );
    setShare({ mediaId: "", title: "" });
  }

  return (
    <div className="flex flex-col gap-7">
      {message ? <Alert tone={message.tone}>{message.text}</Alert> : null}

      {inviteLink ? (
        <Panel>
          <PanelHeader title="Portal invite link" hint="Single-use, and it expires." />
          <div className="p-5">
            <textarea
              readOnly
              rows={3}
              value={inviteLink}
              onFocus={(e) => e.currentTarget.select()}
              className={`${INPUT_CLASS} resize-y font-mono text-[0.74rem]`}
            />
          </div>
        </Panel>
      ) : null}

      <Panel>
        <PanelHeader title="Details" />
        <div className="grid gap-6 p-5 sm:grid-cols-2 sm:p-6">
          <Field label="Name" required>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className={INPUT_CLASS}
            />
          </Field>
          <Field label="Company">
            <input
              value={form.company}
              onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
              className={INPUT_CLASS}
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className={INPUT_CLASS}
            />
          </Field>
          <Field label="Phone">
            <input
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className={INPUT_CLASS}
            />
          </Field>

          {ADDRESS_KEYS.map((key) => (
            <Field key={key} label={key === "line1" ? "Address" : key.replace(/^./, (c) => c.toUpperCase())}>
              <input
                value={form.address[key]}
                onChange={(e) =>
                  setForm((f) => ({ ...f, address: { ...f.address, [key]: e.target.value } }))
                }
                className={INPUT_CLASS}
              />
            </Field>
          ))}

          <div className="sm:col-span-2">
            <Field label="Notes" help="Internal. Never shown in the portal.">
              <textarea
                rows={4}
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                className={`${INPUT_CLASS} resize-y`}
              />
            </Field>
          </div>
        </div>

        <div className="flex flex-wrap justify-between gap-3 border-t-[3px] border-charcoal p-5">
          {client ? (
            confirmArchive ? (
              <div className="flex gap-3">
                <Button
                  tone="danger"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      const r = await archiveClient(client.id);
                      if (r.ok) router.push("/admin/clients");
                      else setMessage({ tone: "error", text: r.error });
                    })
                  }
                >
                  Really archive
                </Button>
                <Button tone="secondary" onClick={() => setConfirmArchive(false)}>
                  Keep
                </Button>
              </div>
            ) : (
              <Button tone="secondary" onClick={() => setConfirmArchive(true)}>
                Archive
              </Button>
            )
          ) : (
            <span />
          )}

          <Button onClick={submit} disabled={pending || !form.name.trim()}>
            {pending ? "Saving…" : client ? "Save changes" : "Create client"}
          </Button>
        </div>
      </Panel>

      {client ? (
        <>
          <Panel>
            <PanelHeader
              title="Client portal"
              hint="What they see when they sign in: their projects, invoices and shared files."
              action={
                <Badge tone={client.portal_enabled ? "published" : "archived"}>
                  {client.portal_enabled ? "Live" : "Off"}
                </Badge>
              }
            />

            <div className="flex flex-wrap items-center justify-between gap-4 border-b-[3px] border-charcoal p-5">
              <p className="max-w-[46ch] font-sans text-[0.86rem] font-medium leading-[1.6] text-charcoal/65">
                {client.portal_enabled
                  ? "The portal is showing. Turning it off hides everything without deleting anything or removing their login."
                  : "The portal is hidden. Anyone with a login sees an empty account until you turn it on."}
              </p>
              <Button
                tone="secondary"
                disabled={pending}
                onClick={() =>
                  run(
                    () => setPortalEnabled(client.id, !client.portal_enabled),
                    client.portal_enabled ? "Portal hidden." : "Portal is live.",
                  )
                }
              >
                {client.portal_enabled ? "Turn off" : "Turn on"}
              </Button>
            </div>

            <div className="p-5">
              {hasLogin ? (
                <p className="font-sans text-[0.86rem] font-medium text-charcoal/65">
                  This client has a login. Manage it from{" "}
                  <Link
                    href="/admin/settings/users"
                    className="font-black underline decoration-charcoal/30 underline-offset-4"
                  >
                    Users &amp; roles
                  </Link>
                  .
                </p>
              ) : (
                <div className="flex flex-wrap items-end gap-4">
                  <Field label="Portal login" help="Creates an account and sends a set-password link.">
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className={INPUT_CLASS}
                    />
                  </Field>
                  <Button
                    disabled={pending || !inviteEmail.trim()}
                    onClick={() => {
                      setMessage(null);
                      setInviteLink(null);
                      startTransition(async () => {
                        const r = await grantPortalAccess(client.id, inviteEmail);
                        if (!r.ok) {
                          setMessage({ tone: "error", text: r.error });
                          return;
                        }
                        if (r.emailed) {
                          setMessage({ tone: "success", text: `Invite sent to ${inviteEmail}.` });
                        } else {
                          setInviteLink(r.link);
                          setMessage({
                            tone: "success",
                            text: "Account created. Email isn't connected, so send them this link yourself.",
                          });
                        }
                        router.refresh();
                      });
                    }}
                  >
                    Give access
                  </Button>
                </div>
              )}
            </div>
          </Panel>

          <Panel>
            <PanelHeader
              title="Shared files"
              hint="Visible in the portal, and only there."
              action={
                <>
                  <input
                    ref={privateInput}
                    type="file"
                    hidden
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadPrivate(file);
                      e.target.value = "";
                    }}
                  />
                  <Button
                    tone="secondary"
                    disabled={pending || uploading}
                    onClick={() => privateInput.current?.click()}
                  >
                    {uploading ? "Uploading…" : "Upload private file"}
                  </Button>
                </>
              }
            />

            <div className="grid gap-4 border-b-[3px] border-charcoal bg-bone/60 p-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
              <Field label="File from the library" help="Public URL — fine for a deck, not for a contract.">
                <select
                  value={share.mediaId}
                  onChange={(e) => setShare((s) => ({ ...s, mediaId: e.target.value }))}
                  className={`${INPUT_CLASS} appearance-none`}
                >
                  <option value="">Choose a file…</option>
                  {media.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.filename}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Shown as">
                <input
                  value={share.title}
                  onChange={(e) => setShare((s) => ({ ...s, title: e.target.value }))}
                  placeholder="Brand guidelines v2"
                  className={INPUT_CLASS}
                />
              </Field>
              <Button
                disabled={pending || !share.mediaId}
                onClick={() =>
                  run(async () => {
                    const r = await shareDocument(client.id, share.mediaId, share.title);
                    if (r.ok) setShare({ mediaId: "", title: "" });
                    return r;
                  }, "Shared.")
                }
              >
                Share
              </Button>
            </div>

            {documents.length === 0 ? (
              <p className="px-5 py-6 font-sans text-[0.86rem] font-medium text-charcoal/55">
                Nothing shared yet.
              </p>
            ) : (
              <ul className="divide-y divide-charcoal/15">
                {documents.map((doc) => (
                  <li key={doc.id} className="flex items-center justify-between gap-4 px-5 py-3">
                    <div className="min-w-0">
                      <p className="truncate font-sans text-[0.88rem] font-black text-charcoal">
                        {doc.title}
                      </p>
                      <p className="font-sans text-[0.72rem] font-bold text-charcoal/45">
                        {dateTime(doc.created_at)}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => run(() => unshareDocument(doc.id, client.id), "Unshared.")}
                      className="shrink-0 border-2 border-charcoal bg-cream px-3 py-1 font-sans text-[0.6rem] font-black uppercase tracking-[0.14em] text-charcoal disabled:opacity-40"
                    >
                      Unshare
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel>
            <PanelHeader title="Messages" hint="Two-way. The client sees these and can reply." />

            <div className="border-b-[3px] border-charcoal p-5">
              <Field label="Write to the client">
                <textarea
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className={`${INPUT_CLASS} resize-y`}
                />
              </Field>
              <div className="mt-4 flex justify-end">
                <Button
                  disabled={pending || !note.trim()}
                  onClick={() =>
                    run(async () => {
                      const r = await postClientMessage(client.id, note);
                      if (r.ok) setNote("");
                      return r;
                    }, "Sent.")
                  }
                >
                  Send
                </Button>
              </div>
            </div>

            {messages.length === 0 ? (
              <p className="px-5 py-6 font-sans text-[0.86rem] font-medium text-charcoal/55">
                No messages yet.
              </p>
            ) : (
              <ul className="divide-y divide-charcoal/15">
                {messages.map((m) => (
                  <li key={m.id} className="px-5 py-4">
                    <p className="mb-2 font-sans text-[0.72rem] font-bold tabular-nums text-charcoal/50">
                      {dateTime(m.created_at)}
                    </p>
                    <p className="whitespace-pre-wrap font-sans text-[0.9rem] font-medium leading-[1.65] text-charcoal">
                      {m.body}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </>
      ) : null}
    </div>
  );
}
