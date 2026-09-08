"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setUserDetails } from "@/app/(admin)/admin/(guarded)/settings/users/actions";
import { ROLE_DESCRIPTION, ROLE_LABEL } from "@/lib/auth/roles";
import type { Profile } from "@/lib/supabase/types";
import {
  Alert, Badge, Button, Field, INPUT_CLASS, Panel, PanelHeader,
} from "./ui";

/**
 * Your own name and position.
 *
 * Reuses the same action the Users screen calls, which allows a self-edit or a
 * super admin editing anyone. Role, activation and client link are absent by
 * design: they are somebody else's decision, and the
 * `profiles_privilege_guard` trigger would reject them from here anyway.
 */
export function AccountForm({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ tone: "error" | "success"; text: string } | null>(null);

  const [form, setForm] = useState({
    name: profile.full_name ?? "",
    position: profile.job_title ?? "",
  });

  const dirty =
    form.name !== (profile.full_name ?? "") ||
    form.position !== (profile.job_title ?? "");

  return (
    <div className="flex flex-col gap-7">
      {message ? <Alert tone={message.tone}>{message.text}</Alert> : null}

      <Panel>
        <PanelHeader title="Your details" hint="How you appear across the admin." />

        <div className="grid gap-6 p-5 sm:grid-cols-2 sm:p-6">
          <Field label="Name">
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              maxLength={120}
              className={INPUT_CLASS}
            />
          </Field>

          <Field label="Position" help="Founder, Strategy Head — what you do here.">
            <input
              value={form.position}
              onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))}
              maxLength={80}
              className={INPUT_CLASS}
            />
          </Field>
        </div>

        <div className="flex justify-end border-t-[3px] border-charcoal p-5">
          <Button
            disabled={pending || !dirty}
            onClick={() => {
              setMessage(null);
              startTransition(async () => {
                const result = await setUserDetails(profile.id, {
                  full_name: form.name,
                  job_title: form.position,
                });

                if (result.ok) {
                  setMessage({ tone: "success", text: "Saved." });
                  router.refresh();
                } else {
                  setMessage({ tone: "error", text: result.error });
                }
              });
            }}
          >
            {pending ? "Saving…" : dirty ? "Save changes" : "Saved"}
          </Button>
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="Access" hint="Only a super admin can change this." />
        <dl className="divide-y divide-charcoal/15">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-5 py-4">
            <dt className="min-w-[6rem] font-sans text-[0.62rem] font-black uppercase tracking-[0.18em] text-charcoal/55">
              Email
            </dt>
            <dd className="font-sans text-[0.88rem] font-medium text-charcoal">
              {profile.email}
            </dd>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-5 py-4">
            <dt className="min-w-[6rem] font-sans text-[0.62rem] font-black uppercase tracking-[0.18em] text-charcoal/55">
              Role
            </dt>
            <dd className="flex flex-wrap items-center gap-3">
              <Badge tone={profile.role === "super_admin" ? "won" : "new"}>
                {ROLE_LABEL[profile.role]}
              </Badge>
              <span className="font-sans text-[0.84rem] font-medium text-charcoal/60">
                {ROLE_DESCRIPTION[profile.role]}
              </span>
            </dd>
          </div>
        </dl>
      </Panel>
    </div>
  );
}
