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
  html,
  replyTo,
}: {
  to: string | string[];
  subject: string;
  /** Always sent — it's what plain-text clients and spam filters read. */
  text: string;
  html?: string;
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
        html,
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

const escape = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/**
 * A one-button email: heading, a paragraph, and a call to action.
 *
 * Invitations used to be plain text with the raw link pasted in, which read as
 * a random string of characters. The button carries the link instead; the
 * text part keeps the URL for clients that can't render HTML.
 *
 * Inline styles and a table because that is what email clients honour —
 * Outlook in particular ignores most modern CSS.
 */
export function buttonEmail({
  heading,
  body,
  cta,
  link,
  footnote,
}: {
  heading: string;
  body: string;
  cta: string;
  link: string;
  footnote?: string;
}): { text: string; html: string } {
  const text = [heading, "", body, "", `${cta}: ${link}`, ...(footnote ? ["", footnote] : [])].join("\n");

  const html = `<!doctype html><html><body style="margin:0;background:#f1eee7;padding:32px 16px;font-family:Montserrat,Helvetica,Arial,sans-serif;color:#212121">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#f9f7f2;border:4px solid #212121">
<tr><td style="padding:32px 32px 8px;font-size:11px;font-weight:900;letter-spacing:4px;text-transform:uppercase;color:#21212199">Adversado</td></tr>
<tr><td style="padding:0 32px;font-size:26px;font-weight:900;line-height:1.1;text-transform:uppercase;color:#212121">${escape(heading)}</td></tr>
<tr><td style="padding:16px 32px 28px;font-size:15px;line-height:1.6;color:#212121cc">${escape(body)}</td></tr>
<tr><td style="padding:0 32px 32px"><a href="${escape(link)}" style="display:inline-block;background:#e6b325;border:3px solid #212121;padding:14px 28px;font-size:12px;font-weight:900;letter-spacing:3px;text-transform:uppercase;color:#212121;text-decoration:none">${escape(cta)}</a></td></tr>
${footnote ? `<tr><td style="padding:0 32px 32px;font-size:12px;line-height:1.6;color:#21212199">${escape(footnote)}</td></tr>` : ""}
</table></td></tr></table></body></html>`;

  return { text, html };
}

/** Where staff notifications go. */
export const STUDIO_INBOX = CONTACT.email;
