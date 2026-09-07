"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Alert, Button, Field, INPUT_CLASS } from "@/components/admin/ui";

/**
 * Client sign-in.
 *
 * Same shape as the admin form and generic on failure for the same reason —
 * "those details didn't work" rather than "no such user", so it can't be used
 * to find out who has an account.
 *
 * `router.refresh()` after success is what makes the server layout re-run and
 * see the new cookie; without it the guard still reads a signed-out request.
 */
export function PortalLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;

    setPending(true);
    setError("");

    try {
      const { error: signInError } = await createClient().auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        setError("Those details didn't work. Check them and try again.");
        return;
      }

      router.replace("/portal");
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      {error ? <Alert tone="error">{error}</Alert> : null}

      <Field label="Email" required>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          autoFocus
          className={INPUT_CLASS}
        />
      </Field>

      <Field label="Password" required>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          className={INPUT_CLASS}
        />
      </Field>

      <Button type="submit" disabled={pending} className="mt-1 w-full">
        {pending ? "Signing in…" : "Sign in"}
      </Button>

      <p className="font-sans text-[0.76rem] font-medium leading-[1.6] text-charcoal/55">
        No login yet? Ask your contact at Adversado to set one up.
      </p>
    </form>
  );
}
