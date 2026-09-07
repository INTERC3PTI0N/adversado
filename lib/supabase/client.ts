"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";

/**
 * Browser client. Carries the session cookie, so every query runs under RLS as
 * the signed-in user. Only the anon key is ever exposed here — the
 * service-role key lives in `server.ts`, which is marked `server-only`.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
