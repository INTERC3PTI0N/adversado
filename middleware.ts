import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Refreshes the Supabase session on every request that could need it.
 *
 * Server Components cannot write cookies, so without this an expiring token is
 * never renewed and an editor is signed out mid-edit. Middleware is the one
 * place in the App Router that can both read the request and set cookies on
 * the response.
 *
 * It also serves the CMS-managed redirects, which have to run before routing.
 */

type Redirect = { from_path: string; to_path: string; status_code: number };

/* Module-scope cache. Middleware runs on every request, and a database round
   trip per request to ask "is this one of the four redirects" is a tax on the
   99.9% of requests that aren't. Sixty seconds is the longest an editor waits
   to see a new redirect take effect, which is a fair trade for not touching
   Postgres on every page view. */
let cache: { at: number; rows: Map<string, Redirect> } | null = null;
const TTL_MS = 60_000;

async function redirectsFor(url: string, anon: string) {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.rows;

  try {
    const res = await fetch(
      `${url}/rest/v1/redirects?select=from_path,to_path,status_code&is_active=eq.true`,
      { headers: { apikey: anon, Authorization: `Bearer ${anon}` }, cache: "no-store" },
    );
    if (!res.ok) throw new Error(String(res.status));

    const rows = (await res.json()) as Redirect[];
    cache = { at: Date.now(), rows: new Map(rows.map((r) => [r.from_path, r])) };
  } catch {
    /* Keep serving the previous list rather than dropping every redirect on a
       transient failure. On a cold start with no list, an empty map means the
       request routes normally — a missed redirect, not an error page. */
    cache = cache ?? { at: Date.now(), rows: new Map() };
  }

  return cache.rows;
}

export async function middleware(request: NextRequest, event: NextFetchEvent) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // The site runs without a backend, falling back to hardcoded copy. Skip
  // rather than throw, so a missing env var doesn't take the whole site down.
  if (!url || !anon) return response;

  const path = request.nextUrl.pathname;

  // Redirects are for the public site. The admin is not CMS-addressable, and a
  // stray rule there could lock someone out of the screen that fixes it.
  if (!path.startsWith("/admin") && !path.startsWith("/api")) {
    const hit = (await redirectsFor(url, anon)).get(path);

    if (hit) {
      // Counted after the response is on its way, so the visitor never waits
      // for the write. A dropped count is acceptable; a slow redirect is not.
      event.waitUntil(
        fetch(`${url}/rest/v1/rpc/bump_redirect`, {
          method: "POST",
          headers: {
            apikey: anon,
            Authorization: `Bearer ${anon}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ p_from: path }),
        }).catch(() => {}),
      );

      const target = hit.to_path.startsWith("http")
        ? new URL(hit.to_path)
        : new URL(hit.to_path + request.nextUrl.search, request.url);

      return NextResponse.redirect(target, hit.status_code);
    }
  }

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // Touching the user is what triggers the refresh; the result is unused here.
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    /* Everything except static assets and image files — those never carry a
       session and would only add latency. */
    "/((?!_next/static|_next/image|favicon.ico|images|mockups|team|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|woff2?)$).*)",
  ],
};
