"use server";

import { revalidatePath } from "next/cache";
import { getSupabase } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth/rbac";
import { sendMail } from "@/lib/mail";
import { dateTime } from "@/lib/format";
import type { BookingStatus } from "@/lib/supabase/types";

export type ActionResult = { ok: true } | { ok: false; error: string };

/**
 * Bookings, services and availability.
 *
 * Double-booking is prevented by a partial unique index on
 * (service_id, starts_at) for live statuses, not by checking first and
 * inserting after — two visitors racing for the last 3pm slot are resolved by
 * Postgres rather than by whichever request happened to check second.
 */

export async function setBookingStatus(
  id: string,
  status: BookingStatus,
  notify = true,
): Promise<ActionResult> {
  await requireStaff("admin");
  const supabase = await getSupabase();

  const { data: booking } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", id)
    .single();

  if (!booking) return { ok: false, error: "Booking not found." };

  // Fetched separately rather than embedded: the Database type declares no
  // relationships, so a PostgREST embed cannot be typed.
  const { data: service } = booking.service_id
    ? await supabase
        .from("booking_services")
        .select("name")
        .eq("id", booking.service_id)
        .single()
    : { data: null };

  const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
  if (error) return { ok: false, error: error.message };

  if (notify && (status === "confirmed" || status === "cancelled")) {
    // A mail failure must not undo a confirmed booking, so the result is
    // deliberately not checked.
    await sendMail({
      to: booking.email,
      subject:
        status === "confirmed"
          ? "Your session with Adversado is confirmed"
          : "Your session with Adversado has been cancelled",
      text:
        status === "confirmed"
          ? [
              `Hello ${booking.name},`,
              "",
              `${service?.name ?? "Your session"} is confirmed for ${dateTime(booking.starts_at)}.`,
              "",
              "If you need to move it, just reply to this email.",
            ].join("\n")
          : [
              `Hello ${booking.name},`,
              "",
              `Your session on ${dateTime(booking.starts_at)} has been cancelled.`,
              "",
              "Reply to this email if you'd like to rebook.",
            ].join("\n"),
    });
  }

  revalidatePath("/admin/bookings");
  return { ok: true };
}

export async function saveBookingService(
  id: string | null,
  fields: {
    name: string;
    duration_minutes: number;
    buffer_minutes: number;
    price: number | null;
    max_per_day: number | null;
    description: string;
    is_active: boolean;
  },
): Promise<ActionResult> {
  await requireStaff("admin");

  if (!fields.name.trim()) return { ok: false, error: "Give the session a name." };
  if (fields.duration_minutes < 5) return { ok: false, error: "Sessions must be at least 5 minutes." };

  const supabase = await getSupabase();

  const slug = fields.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const row = {
    name: fields.name.trim(),
    description: fields.description.trim() || null,
    duration_minutes: fields.duration_minutes,
    buffer_minutes: fields.buffer_minutes,
    price: fields.price,
    max_per_day: fields.max_per_day,
    is_active: fields.is_active,
  };

  const { error } = id
    ? await supabase.from("booking_services").update(row).eq("id", id)
    : await supabase.from("booking_services").insert({ ...row, slug });

  if (error) {
    return {
      ok: false,
      error: /duplicate|unique/i.test(error.message)
        ? "There is already a session type with that name."
        : error.message,
    };
  }

  revalidatePath("/admin/bookings");
  return { ok: true };
}

export async function saveAvailability(
  rules: { weekday: number; start_time: string; end_time: string }[],
): Promise<ActionResult> {
  await requireStaff("admin");

  for (const rule of rules) {
    if (rule.end_time <= rule.start_time) {
      return { ok: false, error: "Each day's finish must be after its start." };
    }
  }

  const supabase = await getSupabase();

  /* Replaced wholesale rather than diffed. These are the studio's opening
     hours — a handful of rows edited as one form, where a partial write would
     leave the week in a state nobody asked for. */
  const { error: clearError } = await supabase
    .from("availability_rules")
    .delete()
    .is("service_id", null);

  if (clearError) return { ok: false, error: clearError.message };

  if (rules.length) {
    const { error } = await supabase.from("availability_rules").insert(
      rules.map((r) => ({ ...r, service_id: null, timezone: "Asia/Kolkata" })),
    );
    if (error) return { ok: false, error: error.message };
  }

  revalidatePath("/admin/bookings");
  return { ok: true };
}

export async function saveException(
  date: string,
  reason: string,
): Promise<ActionResult> {
  await requireStaff("admin");
  if (!date) return { ok: false, error: "Pick a date." };

  const supabase = await getSupabase();

  const { error } = await supabase
    .from("availability_exceptions")
    .upsert(
      { date, is_closed: true, reason: reason.trim() || null },
      { onConflict: "date" },
    );

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/bookings");
  return { ok: true };
}

export async function deleteException(id: string): Promise<ActionResult> {
  await requireStaff("admin");
  const supabase = await getSupabase();

  const { error } = await supabase.from("availability_exceptions").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/bookings");
  return { ok: true };
}
