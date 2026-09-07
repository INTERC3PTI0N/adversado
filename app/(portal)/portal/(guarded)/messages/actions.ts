"use server";

import { revalidatePath } from "next/cache";
import { getSupabase } from "@/lib/supabase/server";
import { requireClient } from "@/lib/auth/rbac";

export type ActionResult = { ok: true } | { ok: false; error: string };

/**
 * A client replying to the studio.
 *
 * `client_messages_write` requires both `client_id = auth_client_id()` and
 * `author_id = auth.uid()`, so a client cannot post into another client's
 * thread or sign a message as someone else — the policy checks both halves,
 * and this action supplies them from the session rather than the request.
 */
export async function sendClientMessage(body: string): Promise<ActionResult> {
  const { userId, clientId } = await requireClient();

  const text = body.trim();
  if (!text) return { ok: false, error: "Write something first." };
  if (text.length > 4000) return { ok: false, error: "That's too long — keep it under 4000 characters." };

  const supabase = await getSupabase();

  const { error } = await supabase
    .from("client_messages")
    .insert({ client_id: clientId, author_id: userId, body: text });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/portal/messages");
  return { ok: true };
}

/**
 * Marks the studio's messages as seen, so the header badge clears.
 *
 * Goes through `mark_client_messages_read()` rather than a plain update: RLS
 * grants a client no update on `client_messages` at all, and widening it to
 * whole rows would let them rewrite what the studio wrote. The function can
 * only set `read_at`, only on their own rows, only on messages they did not
 * write.
 */
export async function markMessagesRead(): Promise<void> {
  await requireClient();
  const supabase = await getSupabase();
  await supabase.rpc("mark_client_messages_read");
}
