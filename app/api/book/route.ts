import { NextResponse } from "next/server";
import { getPublicSupabase, getServiceSupabase, isSupabaseConfigured } from "@/lib/supabase/server";
import { recordIntake } from "@/lib/crm/intake";
import { sendMail, STUDIO_INBOX } from "@/lib/mail";
import { dateTime } from "@/lib/format";

/**
 * Public booking endpoint.
 *
 * GET  ?service=<id>&from=<date>&to=<date>  — free slots
 * POST { service, start, name, email, ... } — take one
 *
 * Slots come from `available_slots()`, the same function the admin trusts, so
 * the two can't disagree about what is free. The slot is re-derived here rather
 * than taken from the request: a visitor may only book something the function
 * currently returns, whatever their form said a minute ago.
 *
 * The insert runs on the service role because anon has no insert policy on
 * `bookings` — this route is the only door, and it validates before it opens.
 */

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const MAX_DAYS = 60;

export async function GET(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ slots: [] });
  }

  const url = new URL(request.url);
  const serviceId = url.searchParams.get("service") ?? "";
  if (!serviceId) return NextResponse.json({ error: "Pick a session type." }, { status: 400 });

  const from = url.searchParams.get("from") ?? new Date().toISOString().slice(0, 10);
  const to =
    url.searchParams.get("to") ??
    new Date(Date.now() + 14 * 86_400_000).toISOString().slice(0, 10);

  // A visitor asking for five years of slots would scan five years of days.
  const span = (new Date(to).getTime() - new Date(from).getTime()) / 86_400_000;
  if (!(span >= 0) || span > MAX_DAYS) {
    return NextResponse.json({ error: "Ask for a shorter range." }, { status: 400 });
  }

  const { data, error } = await getPublicSupabase().rpc("available_slots", {
    p_service_id: serviceId,
    p_from: from,
    p_to: to,
  });

  if (error) {
    console.error("available_slots failed:", error.message);
    return NextResponse.json({ slots: [] });
  }

  return NextResponse.json({ slots: data ?? [] });
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Booking isn't switched on yet. Please email us instead." },
      { status: 503 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  // Honeypot — accept silently so a bot gets no signal either way.
  if (str(body.website)) return NextResponse.json({ ok: true });

  const serviceId = str(body.service);
  const start = str(body.start);
  const name = str(body.name);
  const email = str(body.email);
  const phone = str(body.phone);
  const notes = str(body.notes);

  const errors: Record<string, string> = {};
  if (!serviceId) errors.service = "Pick a session type.";
  if (!start) errors.start = "Pick a time.";
  if (!name) errors.name = "Please add your name.";
  if (!email) errors.email = "We need a way to reach you.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "That email doesn't look right.";

  if (Object.keys(errors).length) {
    return NextResponse.json({ errors }, { status: 422 });
  }

  const service = getServiceSupabase();

  const { data: sessionType } = await service
    .from("booking_services")
    .select("id, name, duration_minutes, is_active")
    .eq("id", serviceId)
    .single();

  if (!sessionType?.is_active) {
    return NextResponse.json(
      { error: "That session type isn't available any more." },
      { status: 409 },
    );
  }

  /* Re-derive the slot instead of trusting the posted time. Between rendering
     the form and submitting it the slot may have been taken, the day closed,
     or the hours changed. */
  const day = start.slice(0, 10);
  const { data: slots } = await service.rpc("available_slots", {
    p_service_id: serviceId,
    p_from: day,
    p_to: day,
  });

  const startMs = new Date(start).getTime();
  const slot = (slots ?? []).find(
    (s: { slot_start: string }) => new Date(s.slot_start).getTime() === startMs,
  );

  if (!slot) {
    return NextResponse.json(
      { error: "That time has just gone. Please pick another." },
      { status: 409 },
    );
  }

  const { data: booking, error } = await service
    .from("bookings")
    .insert({
      service_id: serviceId,
      name,
      email,
      phone: phone || null,
      starts_at: slot.slot_start,
      ends_at: slot.slot_end,
      notes: notes || null,
      status: "pending",
    })
    .select("id")
    .single();

  if (error) {
    // The partial unique index is what actually stops a double booking; this
    // is the message for whoever lost the race.
    const clash = /duplicate key|bookings_no_double_book/i.test(error.message);
    return NextResponse.json(
      {
        error: clash
          ? "Someone just took that time. Please pick another."
          : "We couldn't save that. Please try again.",
      },
      { status: clash ? 409 : 500 },
    );
  }

  // A booking is a lead. Recorded through the same intake path as the forms so
  // it lands in the CRM with a permanent submission behind it.
  await recordIntake({
    formKey: "booking",
    source: "booking",
    name,
    email,
    phone: phone || null,
    message: notes || null,
    sourcePage: "/book",
    /* The permanent record has to stand alone. It is what answers "we never
       received that booking", so it carries who booked and what for — not just
       a foreign key to a row that may later be merged or deleted. */
    raw: {
      name,
      email,
      phone,
      session: sessionType.name,
      starts_at: slot.slot_start,
      notes,
    },
    ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    userAgent: request.headers.get("user-agent"),
  });

  await Promise.all([
    sendMail({
      to: email,
      subject: `Your ${sessionType.name} with Adversado`,
      text: [
        `Hello ${name},`,
        "",
        `We have you down for ${sessionType.name} on ${dateTime(slot.slot_start)}.`,
        "",
        "You'll get a confirmation once we've checked it over. Reply to this email if you need to change anything.",
      ].join("\n"),
    }),
    sendMail({
      to: STUDIO_INBOX,
      replyTo: email,
      subject: `New booking — ${name} (${sessionType.name})`,
      text: [
        `${name} booked ${sessionType.name}.`,
        "",
        `When:  ${dateTime(slot.slot_start)}`,
        `Email: ${email}`,
        `Phone: ${phone || "—"}`,
        "",
        notes || "No notes.",
      ].join("\n"),
    }),
  ]);

  return NextResponse.json({ ok: true, id: booking.id });
}
