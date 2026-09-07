"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ROLE_LABEL } from "@/lib/auth/roles";
import type { Notification, Profile } from "@/lib/supabase/types";
import { Badge } from "./ui";

/**
 * Admin topbar: identity, unread notifications, sign out.
 *
 * Notifications are fetched on mount and then subscribed to over Realtime, so
 * a new lead lands here without a refresh. High-importance ones are marked in
 * gold — the "importance highlighting" the brief calls for.
 */
export function AdminTopbar({
  profile,
  pathname,
}: {
  profile: Profile;
  pathname?: string;
}) {
  const router = useRouter();
  const [items, setItems] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    async function load() {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .is("read_at", null)
        .order("created_at", { ascending: false })
        .limit(12);

      if (active) setItems((data ?? []) as Notification[]);
    }

    void load();

    const channel = supabase
      .channel("admin-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${profile.id}`,
        },
        (payload) => {
          setItems((prev) => [payload.new as Notification, ...prev].slice(0, 12));
        },
      )
      .subscribe();

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [profile.id]);

  async function markAllRead() {
    const supabase = createClient();
    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .is("read_at", null);
    setItems([]);
  }

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  }

  const unread = items.length;
  const hasHigh = items.some((n) => n.importance === "high");

  return (
    <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-4 border-b-[3px] border-charcoal bg-bone px-6 py-3 sm:px-8 lg:px-10">
      <Link
        href="/"
        target="_blank"
        rel="noopener noreferrer"
        className="font-sans text-[0.62rem] font-black uppercase tracking-[0.22em] text-charcoal/60 transition-colors hover:text-charcoal"
      >
        View site ↗
      </Link>

      <div className="flex items-center gap-4">
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className={`relative border-[3px] border-charcoal px-4 py-2 font-sans text-[0.62rem] font-black uppercase tracking-[0.18em] transition-colors ${
              hasHigh ? "bg-gold text-charcoal" : "bg-cream text-charcoal"
            }`}
          >
            Alerts
            {unread > 0 ? (
              <span className="ml-2 tabular-nums">{unread}</span>
            ) : null}
          </button>

          {open ? (
            <div className="absolute right-0 top-full z-40 mt-2 w-[min(22rem,80vw)] border-[3px] border-charcoal bg-cream shadow-[8px_8px_0_0_#212121]">
              <div className="flex items-center justify-between border-b-[3px] border-charcoal px-4 py-3">
                <span className="font-sans text-[0.6rem] font-black uppercase tracking-[0.2em] text-charcoal">
                  Notifications
                </span>
                {unread > 0 ? (
                  <button
                    type="button"
                    onClick={markAllRead}
                    className="font-sans text-[0.6rem] font-bold uppercase tracking-[0.14em] text-charcoal/60 underline"
                  >
                    Mark all read
                  </button>
                ) : null}
              </div>

              {unread === 0 ? (
                <p className="px-4 py-6 font-sans text-[0.84rem] font-medium text-charcoal/55">
                  Nothing new.
                </p>
              ) : (
                <ul className="max-h-[24rem] overflow-y-auto">
                  {items.map((n) => (
                    <li key={n.id} className="border-b border-charcoal/15 last:border-b-0">
                      <Link
                        href={n.url ?? "/admin"}
                        onClick={() => setOpen(false)}
                        className="block px-4 py-3 transition-colors hover:bg-charcoal/5"
                      >
                        <div className="flex items-center gap-2">
                          {n.importance === "high" ? <Badge tone="high">High</Badge> : null}
                          <span className="font-sans text-[0.8rem] font-black text-charcoal">
                            {n.title}
                          </span>
                        </div>
                        {n.body ? (
                          <p className="mt-1 font-sans text-[0.8rem] font-medium text-charcoal/65">
                            {n.body}
                          </p>
                        ) : null}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}
        </div>

        <div className="hidden text-right sm:block">
          <p className="font-sans text-[0.78rem] font-black text-charcoal">
            {profile.full_name ?? profile.email}
          </p>
          <p className="font-sans text-[0.6rem] font-bold uppercase tracking-[0.16em] text-charcoal/50">
            {ROLE_LABEL[profile.role]}
          </p>
        </div>

        <button
          type="button"
          onClick={signOut}
          className="border-[3px] border-charcoal bg-charcoal px-4 py-2 font-sans text-[0.62rem] font-black uppercase tracking-[0.18em] text-gold transition-transform hover:-translate-y-0.5"
        >
          Sign out
        </button>
      </div>

      {pathname ? <span className="sr-only">{pathname}</span> : null}
    </header>
  );
}
