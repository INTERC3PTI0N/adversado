import "server-only";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/**
 * Server-side Supabase clients.
 *
 * `server-only` at the top is load-bearing: this module reads the service-role
 * key, and importing it from a client component must fail the build rather
 * than ship the key to a browser.
 */

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `${name} is not set. Copy .env.example to .env.local and fill in the Supabase project values.`,
    );
  }
  return value;
}

/**
 * Request-scoped client carrying the visitor's session. Every query it makes
 * runs under RLS as that user — this is the one to reach for by default.
 */
export async function getSupabase() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL", URL),
    requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", ANON),
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (list) => {
          try {
            list.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            /* Called from a Server Component, where cookies are read-only.
               Session refresh happens in middleware instead, so this is safe
               to swallow rather than crash the render. */
          }
        },
      },
    },
  );
}

/**
 * Anonymous client for public reads — no session, no cookies. Used by page
 * fetches so a logged-in editor's draft content can't leak into a cached
 * public render.
 */
export function getPublicSupabase() {
  return createClient<Database>(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL", URL),
    requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", ANON),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

/**
 * Service-role client. Bypasses RLS entirely.
 *
 * Only for work the visitor legitimately cannot do as themselves — writing a
 * form submission, creating a booking, running scheduled publishing. Never
 * hand it a value that came from the request without validating it first.
 */
export function getServiceSupabase() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set. It is required for form intake, bookings and scheduled publishing.",
    );
  }

  return createClient<Database>(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL", URL),
    key,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

/** True when the project is configured at all — lets the site run without a
 *  backend, falling back to the hardcoded copy in each component. */
export function isSupabaseConfigured(): boolean {
  return Boolean(URL && ANON);
}
