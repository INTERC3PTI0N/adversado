"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  inviteUser,
  removeUser,
  setUserActive,
  setUserClient,
  setUserRole,
} from "@/app/(admin)/admin/(guarded)/settings/users/actions";
import { ROLE_DESCRIPTION, ROLE_LABEL } from "@/lib/auth/roles";
import type { Client, Profile, UserRole } from "@/lib/supabase/types";
import {
  Alert, Badge, Button, Field, INPUT_CLASS, Panel, PanelHeader, Table, Td, Th,
} from "./ui";

const ROLES: UserRole[] = ["super_admin", "admin", "editor", "client"];

const ROLE_TONE: Record<UserRole, string> = {
  super_admin: "won",
  admin: "new",
  editor: "draft",
  client: "scheduled",
};

/**
 * Users and roles.
 *
 * Role and activation are `select`/toggle rather than an edit-then-save form:
 * these are one-field changes made rarely, and a save button between the
 * decision and the effect only invites half-finished state.
 *
 * `self` is passed so the row for the signed-in user can disable the controls
 * that would lock them out. The server refuses those anyway — this just stops
 * the click that was always going to fail.
 */
export function UsersTable({
  users,
  clients,
  self,
}: {
  users: Profile[];
  clients: Pick<Client, "id" | "name">[];
  self: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ tone: "error" | "success"; text: string } | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [invite, setInvite] = useState({ email: "", name: "", role: "editor" as UserRole });
  const [inviteLink, setInviteLink] = useState<string | null>(null);
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

  function submitInvite() {
    setMessage(null);
    setInviteLink(null);
    startTransition(async () => {
      const result = await inviteUser(invite.email, invite.role, invite.name);

      if (!result.ok) {
        setMessage({ tone: "error", text: result.error });
        return;
      }

      setInvite({ email: "", name: "", role: "editor" });
      if (result.emailed) {
        setMessage({ tone: "success", text: `Invite sent to ${invite.email}.` });
        setInviteOpen(false);
      } else {
        // No mail transport — surface the link rather than pretending it sent.
        setInviteLink(result.link);
        setMessage({
          tone: "success",
          text: "Account created. Email isn't connected, so send them this link yourself.",
        });
      }
      router.refresh();
    });
  }

  const active = users.filter((u) => u.is_active);

  return (
    <div className="flex flex-col gap-7">
      {message ? <Alert tone={message.tone}>{message.text}</Alert> : null}

      {inviteLink ? (
        <Panel>
          <PanelHeader title="Invite link" hint="Single-use, and it expires. Copy it now." />
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
        <PanelHeader
          title={`Team · ${active.length} active`}
          hint="New accounts arrive switched off. Turn one on only when you mean to."
          action={
            <Button tone={inviteOpen ? "secondary" : "primary"} onClick={() => setInviteOpen((v) => !v)}>
              {inviteOpen ? "Cancel" : "Invite someone"}
            </Button>
          }
        />

        {inviteOpen ? (
          <div className="grid gap-5 border-b-[3px] border-charcoal bg-bone/60 p-5 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end">
            <Field label="Email" required>
              <input
                type="email"
                value={invite.email}
                onChange={(e) => setInvite((v) => ({ ...v, email: e.target.value }))}
                className={INPUT_CLASS}
              />
            </Field>
            <Field label="Name">
              <input
                type="text"
                value={invite.name}
                onChange={(e) => setInvite((v) => ({ ...v, name: e.target.value }))}
                className={INPUT_CLASS}
              />
            </Field>
            <Field label="Role">
              <select
                value={invite.role}
                onChange={(e) => setInvite((v) => ({ ...v, role: e.target.value as UserRole }))}
                className={`${INPUT_CLASS} appearance-none`}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABEL[r]}
                  </option>
                ))}
              </select>
            </Field>
            <Button disabled={pending || !invite.email.trim()} onClick={submitInvite}>
              {pending ? "Sending…" : "Send invite"}
            </Button>
          </div>
        ) : null}

        <Table>
          <thead>
            <tr>
              <Th>Person</Th>
              <Th>Role</Th>
              <Th>Client</Th>
              <Th>Status</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const isSelf = user.id === self;

              return (
                <tr key={user.id} className={user.is_active ? "" : "bg-charcoal/[0.04]"}>
                  <Td>
                    <span className="font-black">
                      {user.full_name ?? user.email.split("@")[0]}
                      {isSelf ? (
                        <span className="ml-2 font-sans text-[0.58rem] font-black uppercase tracking-[0.16em] text-charcoal/45">
                          You
                        </span>
                      ) : null}
                    </span>
                    <span className="block text-[0.78rem] text-charcoal/55">{user.email}</span>
                  </Td>

                  <Td>
                    <select
                      value={user.role}
                      disabled={pending}
                      onChange={(e) =>
                        run(() => setUserRole(user.id, e.target.value as UserRole), "Role updated.")
                      }
                      title={ROLE_DESCRIPTION[user.role]}
                      className="w-full max-w-[10.5rem] appearance-none border-[3px] border-charcoal bg-cream px-3 py-1.5 font-sans text-[0.78rem] font-bold text-charcoal"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {ROLE_LABEL[r]}
                        </option>
                      ))}
                    </select>
                  </Td>

                  <Td>
                    {user.role === "client" ? (
                      <select
                        value={user.client_id ?? ""}
                        disabled={pending}
                        onChange={(e) =>
                          run(() => setUserClient(user.id, e.target.value || null), "Linked.")
                        }
                        className="w-full max-w-[12rem] appearance-none border-[3px] border-charcoal bg-cream px-3 py-1.5 font-sans text-[0.78rem] font-bold text-charcoal"
                      >
                        <option value="">Not linked</option>
                        {clients.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-charcoal/35">—</span>
                    )}
                  </Td>

                  <Td>
                    <Badge tone={user.is_active ? ROLE_TONE[user.role] : "archived"}>
                      {user.is_active ? "Active" : "Off"}
                    </Badge>
                  </Td>

                  <Td className="text-right">
                    <div className="flex flex-wrap justify-end gap-2">
                      <button
                        type="button"
                        disabled={pending || (isSelf && user.is_active)}
                        onClick={() =>
                          run(
                            () => setUserActive(user.id, !user.is_active),
                            user.is_active ? "Access removed." : "Access granted.",
                          )
                        }
                        className="border-2 border-charcoal bg-cream px-3 py-1 font-sans text-[0.6rem] font-black uppercase tracking-[0.14em] text-charcoal disabled:opacity-30"
                      >
                        {user.is_active ? "Deactivate" : "Activate"}
                      </button>

                      {confirmDelete === user.id ? (
                        <>
                          <button
                            type="button"
                            disabled={pending}
                            onClick={() => {
                              setConfirmDelete(null);
                              run(() => removeUser(user.id), "Account deleted.");
                            }}
                            className="border-2 border-charcoal bg-[#c8322a] px-3 py-1 font-sans text-[0.6rem] font-black uppercase tracking-[0.14em] text-cream"
                          >
                            Really delete
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDelete(null)}
                            className="border-2 border-charcoal bg-cream px-3 py-1 font-sans text-[0.6rem] font-black uppercase tracking-[0.14em] text-charcoal"
                          >
                            Keep
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          disabled={pending || isSelf}
                          onClick={() => setConfirmDelete(user.id)}
                          className="border-2 border-charcoal bg-cream px-3 py-1 font-sans text-[0.6rem] font-black uppercase tracking-[0.14em] text-charcoal disabled:opacity-30"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </Panel>

      <Panel>
        <PanelHeader title="What each role can do" />
        <ul className="divide-y divide-charcoal/15">
          {ROLES.map((r) => (
            <li key={r} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 px-5 py-3">
              <span className="min-w-[7.5rem] font-sans text-[0.72rem] font-black uppercase tracking-[0.18em] text-charcoal">
                {ROLE_LABEL[r]}
              </span>
              <span className="font-sans text-[0.86rem] font-medium text-charcoal/65">
                {ROLE_DESCRIPTION[r]}
              </span>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
