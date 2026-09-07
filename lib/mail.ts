import "server-only";

import { CONTACT } from "@/lib/contact";

/**
 * Outbound mail, over Resend's HTTP API.
 *
 * Extracted from the contact route once invites, bookings and invoices all
 * needed to send something. Plain `fetch` rather than the SDK — one dependency
 * fewer, and the API is two fields.
 *
 * Nothing here throws. A mail failure must never be the reason a lead, a
 * booking or a role change is lost, so callers get a result and decide.
 */

/* Must be on the Resend-verified domain. `noreply@` rather than the real
   inbox so it doesn't collide with a mailbox someone actually reads. */
const DEFAULT_FROM = `Adversado <noreply@${CONTACT.email.split("@")[1]}>`;

export type MailResult = { ok: true } | { ok: false; error: string };

export function isMailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export async function sendMail({
  to,
  subject,
  text,
  replyTo,
}: {
  to: string | string[];
  subject: string;
  text: string;
  replyTo?: string;
}): Promise<MailResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, error: "Email is not connected (RESEND_API_KEY is unset)." };

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.CONTACT_FROM || DEFAULT_FROM,
        to: Array.isArray(to) ? to : [to],
        reply_to: replyTo,
        subject,
        text,
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      console.error("Resend rejected the message:", res.status, detail);
      return { ok: false, error: "The mail service rejected the message." };
    }

    return { ok: true };
  } catch (err) {
    console.error("Mail send failed:", err);
    return { ok: false, error: "Could not reach the mail service." };
  }
}

/** Where staff notifications go. */
export const STUDIO_INBOX = CONTACT.email;
