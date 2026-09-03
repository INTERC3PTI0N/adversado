import { NextResponse } from "next/server";
import { CONTACT } from "@/lib/contact";

/**
 * Contact form endpoint.
 *
 * Validation runs here rather than only in the browser, because client-side
 * `required` attributes are a convenience for the user and not a control —
 * anything can POST this route directly.
 *
 * Delivery goes through Resend's HTTP API over plain `fetch`, so no mail
 * dependency is added to the bundle. One env var is required:
 *
 *   RESEND_API_KEY   — the API key
 *
 * and one is optional:
 *
 *   CONTACT_FROM     — sender, if the default below is wrong. Must be on a
 *                      domain verified at resend.com/domains,
 *                      e.g. "Adversado site <site@adversado.com>"
 *
 * Without the key the route answers 503 and says so, rather than pretending
 * the message was delivered — a form that silently drops enquiries is worse
 * than one that admits it is not wired up yet.
 */

type Payload = {
  name?: unknown;
  brand?: unknown;
  email?: unknown;
  looking?: unknown;
  budget?: unknown;
  /** Which page the form was submitted from. */
  source?: unknown;
  /** Honeypot: real people never fill this, bots usually do. */
  website?: unknown;
};

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

/* Sender, when CONTACT_FROM isn't set. Derived from the studio address in
   `lib/contact`, so the default tracks the one domain this site belongs to
   rather than being a second place to keep it in sync.
   `noreply@` rather than the real inbox: it must be on the Resend-verified
   domain, and it shouldn't collide with a mailbox someone actually reads. */
const DEFAULT_FROM = `Adversado <noreply@${CONTACT.email.split("@")[1]}>`;

export async function POST(request: Request) {
  let body: Payload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  // Honeypot — accept silently so a bot gets no signal either way.
  if (str(body.website)) return NextResponse.json({ ok: true });

  const name = str(body.name);
  const brand = str(body.brand);
  const email = str(body.email);
  const looking = str(body.looking);
  const budget = str(body.budget);
  const source = str(body.source);

  /* Budget is optional on purpose: making it required loses the enquiries from
     people who genuinely do not know yet, which are not the worst ones. */
  const errors: Record<string, string> = {};
  if (!name) errors.name = "Please add your name.";
  if (!brand) errors.brand = "Please add your brand.";
  if (!email) errors.email = "We need a way to reply.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    errors.email = "That email doesn't look right.";
  if (!looking) errors.looking = "Tell us what you're looking for.";

  if (Object.keys(errors).length) {
    return NextResponse.json({ errors }, { status: 422 });
  }

  const key = process.env.RESEND_API_KEY;
  const from = process.env.CONTACT_FROM || DEFAULT_FROM;
  if (!key) {
    return NextResponse.json(
      {
        error:
          "The form isn't connected to email yet. Please reach us directly in the meantime.",
      },
      { status: 503 }
    );
  }

  const lines = [
    `Name:    ${name}`,
    `Brand:   ${brand}`,
    `Email:   ${email}`,
    `Budget:  ${budget || "—"}`,
    `Source:  ${source || "Contact page"}`,
    "",
    "Looking for:",
    looking,
  ].join("\n");

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [CONTACT.email],
        // So hitting reply in the inbox goes to the enquirer, not to the site.
        reply_to: email,
        subject: `New enquiry — ${brand}${source ? ` (${source})` : ""}`,
        text: lines,
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      console.error("Resend rejected the message:", res.status, detail);
      return NextResponse.json(
        { error: "We couldn't send that. Please try again, or email us." },
        { status: 502 }
      );
    }
  } catch (err) {
    console.error("Contact route failed:", err);
    return NextResponse.json(
      { error: "We couldn't send that. Please try again, or email us." },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}
