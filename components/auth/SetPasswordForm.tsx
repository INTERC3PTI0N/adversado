"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setPassword } from "@/app/auth/actions";
import { Alert, Button, Field, INPUT_CLASS } from "@/components/admin/ui";

export function SetPasswordForm({ email }: { email: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [password, setPasswordValue] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [waiting, setWaiting] = useState(false);

  if (waiting) {
    return (
      <Alert tone="success">
        Password set. Your account still needs switching on by a super admin —
        once it is, sign in with this email and password.
      </Alert>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        startTransition(async () => {
          const result = await setPassword(password, confirm);
          if (!result.ok) {
            setError(result.error);
            return;
          }
          if (result.next) {
            router.replace(result.next);
            router.refresh();
          } else {
            setWaiting(true);
          }
        });
      }}
      className="flex flex-col gap-6"
    >
      {error ? <Alert tone="error">{error}</Alert> : null}

      <p className="font-sans text-[0.84rem] font-medium text-charcoal/60">
        Signed in as <strong className="text-charcoal">{email}</strong>
      </p>

      {/* The email is included, hidden, so password managers file the new
          password against the right account instead of guessing. */}
      <input type="email" name="username" value={email} autoComplete="username" readOnly hidden />

      <Field label="New password" help="At least 8 characters." required>
        <input
          type="password"
          value={password}
          onChange={(e) => setPasswordValue(e.target.value)}
          autoComplete="new-password"
          autoFocus
          required
          className={INPUT_CLASS}
        />
      </Field>

      <Field label="Type it again" required>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
          required
          className={INPUT_CLASS}
        />
      </Field>

      <Button type="submit" disabled={pending || !password || !confirm} className="w-full">
        {pending ? "Saving…" : "Set password"}
      </Button>
    </form>
  );
}
