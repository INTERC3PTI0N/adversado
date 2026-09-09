"use client";

import { useEffect, useState } from "react";
import { trackLeadCreated } from "@/lib/pixel";

type Service = {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number | null;
  currency: string;
};

type Slot = { slot_start: string; slot_end: string };

const FIELD =
  "w-full border-[3px] border-charcoal bg-cream px-4 py-3 font-sans text-[0.95rem] font-medium text-charcoal outline-none transition-[box-shadow,transform] duration-150 focus:-translate-x-0.5 focus:-translate-y-0.5 focus:shadow-[5px_5px_0_0_#212121]";

const LABEL =
  "font-sans text-[0.62rem] font-black uppercase tracking-[0.22em] text-charcoal";

const dayKey = (iso: string) => iso.slice(0, 10);

/**
 * Free slots for one session type.
 *
 * Remounted by its `key` whenever the session or the reload counter changes,
 * so "start again" is React unmounting it rather than an effect resetting four
 * pieces of state — which is why `loading` can simply start `true`.
 */
function SlotPicker({
  serviceId,
  chosen,
  onPick,
}: {
  serviceId: string;
  chosen: string | null;
  onPick: (start: string | null) => void;
}) {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [day, setDay] = useState<string | null>(null);

  useEffect(() => {
    // Aborted on unmount so a slow response for a previous session type cannot
    // land after a newer one and show the wrong times.
    const controller = new AbortController();

    const from = new Date().toISOString().slice(0, 10);
    const to = new Date(Date.now() + 21 * 86_400_000).toISOString().slice(0, 10);

    fetch(`/api/book?service=${serviceId}&from=${from}&to=${to}`, {
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((data) => {
        const next: Slot[] = data.slots ?? [];
        setSlots(next);
        setDay(next.length ? dayKey(next[0].slot_start) : null);
      })
      .catch(() => {
        if (!controller.signal.aborted) setSlots([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [serviceId]);

  const byDay = slots.reduce<Record<string, Slot[]>>((acc, slot) => {
    (acc[dayKey(slot.slot_start)] ??= []).push(slot);
    return acc;
  }, {});
  const days = Object.keys(byDay);

  if (loading) {
    return (
      <p className="mt-4 font-sans text-[0.9rem] font-medium text-charcoal/55">
        Finding free slots&hellip;
      </p>
    );
  }

  if (days.length === 0) {
    return (
      <p className="mt-4 font-sans text-[0.9rem] font-medium text-charcoal/55">
        Nothing free in the next three weeks. Email us and we&rsquo;ll sort
        something out.
      </p>
    );
  }

  return (
    <div className="mt-4">
      {/* A day at a time. Three weeks of hourly slots laid out at once is over
          a hundred buttons — a wall to read rather than a choice. */}
      <div className="-mx-1 overflow-x-auto px-1 pb-2">
        <div className="flex min-w-max gap-2.5">
          {days.map((key) => {
            const date = new Date(key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => setDay(key)}
                aria-pressed={day === key}
                className={`border-[3px] border-charcoal px-4 py-2.5 text-center transition-transform duration-150 ${
                  day === key
                    ? "bg-charcoal text-gold"
                    : "bg-cream text-charcoal hover:-translate-y-0.5"
                }`}
              >
                <span className="block font-sans text-[0.6rem] font-black uppercase tracking-[0.16em] opacity-70">
                  {date.toLocaleDateString("en-GB", { weekday: "short" })}
                </span>
                <span className="mt-0.5 block font-sans text-[0.95rem] font-black tabular-nums">
                  {date.getDate()}
                </span>
                <span className="block font-sans text-[0.58rem] font-black uppercase tracking-[0.14em] opacity-60">
                  {date.toLocaleDateString("en-GB", { month: "short" })}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2.5">
        {(day ? byDay[day] ?? [] : []).map((slot) => (
          <button
            key={slot.slot_start}
            type="button"
            onClick={() => onPick(slot.slot_start)}
            aria-pressed={chosen === slot.slot_start}
            className={`border-[3px] border-charcoal px-4 py-2 font-sans text-[0.82rem] font-black tabular-nums transition-transform duration-150 ${
              chosen === slot.slot_start
                ? "bg-charcoal text-gold"
                : "bg-cream text-charcoal hover:-translate-y-0.5"
            }`}
          >
            {new Date(slot.slot_start).toLocaleTimeString("en-GB", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Public booking form.
 *
 * Slots are fetched from the server rather than computed here — the browser
 * has no idea what is already taken, and a client-side guess would offer times
 * that fail on submit. Picking a session refetches; picking a time fills the
 * hidden field the POST validates against.
 */
export function BookingForm({ services }: { services: Service[] }) {
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const [chosen, setChosen] = useState<string | null>(null);
  /* Bumped when a slot is taken out from under the visitor. It is part of the
     picker's key, so incrementing it remounts and refetches — setting the same
     serviceId would not, because React bails out of an identical update. */
  const [reload, setReload] = useState(0);

  const [form, setForm] = useState({ name: "", email: "", phone: "", notes: "", website: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [failure, setFailure] = useState<string | null>(null);

  const service = services.find((s) => s.id === serviceId);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setErrors({});
    setFailure(null);
    setStatus("sending");

    const res = await fetch("/api/book", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, service: serviceId, start: chosen }),
    });

    const data = await res.json().catch(() => ({}));

    if (res.ok) {
      // The booking is committed server-side by here — the slot is held and
      // the lead written — so this is a conversion, not an attempt.
      trackLeadCreated();
      setStatus("done");
      return;
    }

    setStatus("idle");
    if (data.errors) setErrors(data.errors);
    else setFailure(data.error ?? "Something went wrong. Please try again.");

    // A 409 means the slot went while they were typing. Remount the picker so
    // it refetches, and drop the choice that is no longer available.
    if (res.status === 409) {
      setChosen(null);
      setReload((n) => n + 1);
    }
  }

  if (status === "done") {
    return (
      <div className="border-[4px] border-charcoal bg-gold p-8 shadow-[10px_10px_0_0_#212121] sm:p-10">
        <h2 className="font-sans text-[clamp(1.5rem,3vw,2.1rem)] font-black uppercase leading-[1.05] tracking-[-0.02em] text-charcoal">
          You&rsquo;re booked in.
        </h2>
        <p className="mt-4 max-w-[46ch] font-sans text-[1rem] font-medium leading-[1.65] text-charcoal/80">
          Check your inbox — the details are on their way. We&rsquo;ll confirm shortly,
          and you can reply to that email to change anything.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-8">
      {failure ? (
        <p
          role="alert"
          className="border-[3px] border-charcoal bg-[#c8322a] px-4 py-3 font-sans text-[0.9rem] font-bold text-cream"
        >
          {failure}
        </p>
      ) : null}

      <fieldset>
        <legend className={LABEL}>What do you need?</legend>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {services.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                setServiceId(s.id);
                setChosen(null);
              }}
              aria-pressed={serviceId === s.id}
              className={`border-[3px] border-charcoal p-5 text-left transition-transform duration-150 ${
                serviceId === s.id
                  ? "bg-gold shadow-[6px_6px_0_0_#212121]"
                  : "bg-cream hover:-translate-x-0.5 hover:-translate-y-0.5"
              }`}
            >
              <span className="block font-sans text-[1rem] font-black uppercase tracking-[-0.01em] text-charcoal">
                {s.name}
              </span>
              <span className="mt-1 block font-sans text-[0.78rem] font-black uppercase tracking-[0.14em] text-charcoal/55">
                {s.duration_minutes} minutes
                {s.price ? ` · ₹${s.price}` : " · free"}
              </span>
              {s.description ? (
                <span className="mt-3 block font-sans text-[0.86rem] font-medium leading-[1.6] text-charcoal/70">
                  {s.description}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className={LABEL}>Pick a time</legend>

        <SlotPicker
          key={`${serviceId}-${reload}`}
          serviceId={serviceId}
          chosen={chosen}
          onPick={setChosen}
        />

        {errors.start ? (
          <p className="mt-3 font-sans text-[0.82rem] font-bold text-[#c8322a]">{errors.start}</p>
        ) : null}
      </fieldset>

      <fieldset className="grid gap-6 sm:grid-cols-2">
        <legend className={`${LABEL} mb-4`}>Your details</legend>

        <label className="block">
          <span className={LABEL}>Name</span>
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className={`${FIELD} mt-2`}
          />
          {errors.name ? (
            <span className="mt-2 block font-sans text-[0.8rem] font-bold text-[#c8322a]">
              {errors.name}
            </span>
          ) : null}
        </label>

        <label className="block">
          <span className={LABEL}>Email</span>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className={`${FIELD} mt-2`}
          />
          {errors.email ? (
            <span className="mt-2 block font-sans text-[0.8rem] font-bold text-[#c8322a]">
              {errors.email}
            </span>
          ) : null}
        </label>

        <label className="block">
          <span className={LABEL}>Phone</span>
          <input
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            className={`${FIELD} mt-2`}
          />
        </label>

        <label className="block sm:col-span-2">
          <span className={LABEL}>Anything we should know?</span>
          <textarea
            rows={4}
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            className={`${FIELD} mt-2 resize-y`}
          />
        </label>

        {/* Honeypot. Real people never fill this; bots usually do. */}
        <input
          type="text"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          value={form.website}
          onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
          className="absolute left-[-9999px] h-px w-px opacity-0"
        />
      </fieldset>

      <div className="flex flex-wrap items-center gap-5">
        <button
          type="submit"
          disabled={status === "sending" || !chosen}
          className="border-[3px] border-charcoal bg-gold px-8 py-4 font-sans text-[0.72rem] font-black uppercase tracking-[0.22em] text-charcoal shadow-[6px_6px_0_0_#212121] transition-transform duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-x-0 disabled:hover:translate-y-0"
        >
          {status === "sending" ? "Booking…" : "Book it"}
        </button>

        {chosen && service ? (
          <p className="font-sans text-[0.88rem] font-bold text-charcoal/65">
            {service.name} ·{" "}
            {new Date(chosen).toLocaleString("en-GB", {
              weekday: "short",
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        ) : (
          <p className="font-sans text-[0.88rem] font-medium text-charcoal/50">
            Pick a time to continue.
          </p>
        )}
      </div>
    </form>
  );
}
