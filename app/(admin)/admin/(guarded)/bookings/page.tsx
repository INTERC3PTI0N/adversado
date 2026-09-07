import { getSupabase } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/auth/rbac";
import { PageHeading, Stat } from "@/components/admin/ui";
import { BookingsWorkspace } from "@/components/admin/BookingsWorkspace";
import type { Booking, BookingService } from "@/lib/supabase/types";

export const metadata = { title: "Bookings — Adversado Admin" };
export const dynamic = "force-dynamic";

export default async function BookingsPage() {
  await requireStaff("admin");
  const supabase = await getSupabase();

  const [bookingsRes, servicesRes, rulesRes, exceptionsRes] = await Promise.all([
    supabase
      .from("bookings")
      .select("*")
      .order("starts_at", { ascending: false })
      .limit(200),
    supabase.from("booking_services").select("*").order("position").order("name"),
    // Only the studio-wide rules; per-service overrides are a schema feature
    // this screen deliberately doesn't expose yet.
    supabase.from("availability_rules").select("*").is("service_id", null).order("weekday"),
    supabase
      .from("availability_exceptions")
      .select("id, date, reason")
      .gte("date", new Date().toISOString().slice(0, 10))
      .order("date"),
  ]);

  const services = (servicesRes.data ?? []) as BookingService[];

  /* Named from the services already fetched rather than a PostgREST embed.
     The hand-written Database type declares no relationships, so an embedded
     select is untypable — and this page loads every service anyway. */
  const names = new Map(services.map((s) => [s.id, s.name]));
  const bookings = ((bookingsRes.data ?? []) as Booking[]).map((b) => ({
    ...b,
    serviceName: b.service_id ? names.get(b.service_id) ?? null : null,
  }));

  const now = new Date();
  const upcoming = bookings.filter(
    (b) => new Date(b.starts_at) >= now && b.status !== "cancelled",
  );
  const awaiting = upcoming.filter((b) => b.status === "pending").length;

  const weekEnd = new Date(now.getTime() + 7 * 86_400_000);
  const thisWeek = upcoming.filter((b) => new Date(b.starts_at) <= weekEnd).length;

  return (
    <>
      <PageHeading
        eyebrow="Delivery"
        title="Bookings"
        description="Sessions people book from the site. Slots come from the opening hours below, minus anything already taken."
      />

      <div className="mb-7 grid gap-5 sm:grid-cols-3">
        <Stat
          label="Awaiting confirmation"
          value={awaiting}
          tone={awaiting > 0 ? "gold" : "cream"}
        />
        <Stat label="Next seven days" value={thisWeek} tone="navy" />
        <Stat
          label="Session types live"
          value={services.filter((s) => s.is_active).length}
          hint={`${services.length} defined`}
        />
      </div>

      <BookingsWorkspace
        bookings={bookings}
        services={services}
        rules={rulesRes.data ?? []}
        exceptions={exceptionsRes.data ?? []}
      />
    </>
  );
}
