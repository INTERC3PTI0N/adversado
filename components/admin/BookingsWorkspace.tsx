"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  deleteException, saveAvailability, saveBookingService, saveException,
  setBookingStatus,
} from "@/app/(admin)/admin/(guarded)/bookings/actions";
import { dateTime, money, shortDate } from "@/lib/format";
import type { Booking, BookingService, BookingStatus } from "@/lib/supabase/types";
import {
  Alert, Badge, Button, Field, INPUT_CLASS, Panel, PanelHeader, Table, Td, Th, label,
} from "./ui";

type Rule = { id?: string; weekday: number; start_time: string; end_time: string };
type Exception = { id: string; date: string; reason: string | null };

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const STATUS_TONE: Record<BookingStatus, string> = {
  pending: "in_review",
  confirmed: "published",
  cancelled: "archived",
  completed: "won",
  no_show: "urgent",
};

const blankService = {
  name: "",
  description: "",
  duration_minutes: 30,
  buffer_minutes: 10,
  price: "",
  max_per_day: "",
  is_active: true,
};

/** `09:00:00` from Postgres, `09:00` for `<input type="time">`. */
const toTimeInput = (value: string) => value.slice(0, 5);

export function BookingsWorkspace({
  bookings,
  services,
  rules,
  exceptions,
}: {
  bookings: (Booking & { serviceName: string | null })[];
  services: BookingService[];
  rules: Rule[];
  exceptions: Exception[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ tone: "error" | "success"; text: string } | null>(null);

  const [hours, setHours] = useState<Record<number, { on: boolean; start: string; end: string }>>(
    () =>
      Object.fromEntries(
        DAYS.map((_, weekday) => {
          const rule = rules.find((r) => r.weekday === weekday);
          return [
            weekday,
            rule
              ? { on: true, start: toTimeInput(rule.start_time), end: toTimeInput(rule.end_time) }
              : { on: false, start: "10:00", end: "18:00" },
          ];
        }),
      ),
  );

  const [service, setService] = useState<typeof blankService & { id?: string }>(blankService);
  const [closure, setClosure] = useState({ date: "", reason: "" });

  function run(fn: () => Promise<{ ok: true } | { ok: false; error: string }>, success?: string) {
    setMessage(null);
    startTransition(async () => {
      const result = await fn();
      if (result.ok) {
        if (success) setMessage({ tone: "success", text: success });
        router.refresh();
      } else {
        setMessage({ tone: "error", text: result.error });
      }
    });
  }

  const upcoming = bookings.filter(
    (b) => new Date(b.starts_at) >= new Date() && !["cancelled"].includes(b.status),
  );
  const past = bookings.filter(
    (b) => new Date(b.starts_at) < new Date() || b.status === "cancelled",
  );

  return (
    <div className="flex flex-col gap-7">
      {message ? <Alert tone={message.tone}>{message.text}</Alert> : null}

      <Panel>
        <PanelHeader
          title={`Upcoming · ${upcoming.length}`}
          hint="Confirming or cancelling emails the person automatically."
        />
        {upcoming.length === 0 ? (
          <p className="px-5 py-6 font-sans text-[0.86rem] font-medium text-charcoal/55">
            Nothing booked.
          </p>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>When</Th>
                <Th>Who</Th>
                <Th>Session</Th>
                <Th>Status</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {upcoming.map((booking) => (
                <tr key={booking.id}>
                  <Td className="whitespace-nowrap font-black tabular-nums">
                    {dateTime(booking.starts_at)}
                  </Td>
                  <Td>
                    {booking.name}
                    <span className="block text-[0.78rem] text-charcoal/55">
                      {booking.email}
                      {booking.phone ? ` · ${booking.phone}` : ""}
                    </span>
                  </Td>
                  <Td className="text-charcoal/70">
                    {booking.serviceName ?? "—"}
                  </Td>
                  <Td>
                    <Badge tone={STATUS_TONE[booking.status]}>{label(booking.status)}</Badge>
                  </Td>
                  <Td className="text-right">
                    <div className="flex flex-wrap justify-end gap-2">
                      {booking.status === "pending" ? (
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() =>
                            run(() => setBookingStatus(booking.id, "confirmed"), "Confirmed and emailed.")
                          }
                          className="border-2 border-charcoal bg-gold px-3 py-1 font-sans text-[0.6rem] font-black uppercase tracking-[0.14em] text-charcoal disabled:opacity-40"
                        >
                          Confirm
                        </button>
                      ) : null}
                      {booking.status === "confirmed" ? (
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() =>
                            run(() => setBookingStatus(booking.id, "completed", false), "Marked done.")
                          }
                          className="border-2 border-charcoal bg-cream px-3 py-1 font-sans text-[0.6rem] font-black uppercase tracking-[0.14em] text-charcoal disabled:opacity-40"
                        >
                          Done
                        </button>
                      ) : null}
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() =>
                          run(() => setBookingStatus(booking.id, "cancelled"), "Cancelled and emailed.")
                        }
                        className="border-2 border-charcoal bg-cream px-3 py-1 font-sans text-[0.6rem] font-black uppercase tracking-[0.14em] text-charcoal disabled:opacity-40"
                      >
                        Cancel
                      </button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Panel>

      <Panel>
        <PanelHeader title="Session types" hint="What people can book, and for how long." />

        <div className="grid gap-4 border-b-[3px] border-charcoal bg-bone/60 p-5 sm:grid-cols-[1fr_6rem_6rem_7rem_auto] sm:items-end">
          <Field label="Name">
            <input
              value={service.name}
              onChange={(e) => setService((s) => ({ ...s, name: e.target.value }))}
              placeholder="Discovery call"
              className={INPUT_CLASS}
            />
          </Field>
          <Field label="Minutes">
            <input
              type="number"
              min="5"
              step="5"
              value={service.duration_minutes}
              onChange={(e) =>
                setService((s) => ({ ...s, duration_minutes: Number(e.target.value) || 30 }))
              }
              className={INPUT_CLASS}
            />
          </Field>
          <Field label="Buffer" help="Gap after.">
            <input
              type="number"
              min="0"
              step="5"
              value={service.buffer_minutes}
              onChange={(e) =>
                setService((s) => ({ ...s, buffer_minutes: Number(e.target.value) || 0 }))
              }
              className={INPUT_CLASS}
            />
          </Field>
          <Field label="Price" help="Blank for free.">
            <input
              type="number"
              min="0"
              value={service.price}
              onChange={(e) => setService((s) => ({ ...s, price: e.target.value }))}
              className={INPUT_CLASS}
            />
          </Field>
          <Button
            disabled={pending || !service.name.trim()}
            onClick={() =>
              run(async () => {
                const r = await saveBookingService(service.id ?? null, {
                  name: service.name,
                  description: service.description,
                  duration_minutes: service.duration_minutes,
                  buffer_minutes: service.buffer_minutes,
                  price: service.price === "" ? null : Number(service.price),
                  max_per_day: service.max_per_day === "" ? null : Number(service.max_per_day),
                  is_active: service.is_active,
                });
                if (r.ok) setService(blankService);
                return r;
              }, service.id ? "Session updated." : "Session type added.")
            }
          >
            {service.id ? "Update" : "Add"}
          </Button>
        </div>

        {services.length === 0 ? (
          <p className="px-5 py-6 font-sans text-[0.86rem] font-medium text-charcoal/55">
            No session types yet.
          </p>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Session</Th>
                <Th className="text-right">Length</Th>
                <Th className="text-right">Price</Th>
                <Th>Live</Th>
                <Th className="text-right" />
              </tr>
            </thead>
            <tbody>
              {services.map((s) => (
                <tr key={s.id} className={s.is_active ? "" : "opacity-45"}>
                  <Td className="font-black">{s.name}</Td>
                  <Td className="text-right tabular-nums">
                    {s.duration_minutes}m
                    {s.buffer_minutes ? ` +${s.buffer_minutes}` : ""}
                  </Td>
                  <Td className="text-right tabular-nums">
                    {s.price ? money(s.price, s.currency) : "Free"}
                  </Td>
                  <Td>
                    <Badge tone={s.is_active ? "published" : "archived"}>
                      {s.is_active ? "On" : "Off"}
                    </Badge>
                  </Td>
                  <Td className="text-right">
                    <div className="flex flex-wrap justify-end gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setService({
                            id: s.id,
                            name: s.name,
                            description: s.description ?? "",
                            duration_minutes: s.duration_minutes,
                            buffer_minutes: s.buffer_minutes,
                            price: s.price?.toString() ?? "",
                            max_per_day: s.max_per_day?.toString() ?? "",
                            is_active: s.is_active,
                          })
                        }
                        className="border-2 border-charcoal bg-cream px-3 py-1 font-sans text-[0.6rem] font-black uppercase tracking-[0.14em] text-charcoal"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() =>
                          run(
                            () =>
                              saveBookingService(s.id, {
                                name: s.name,
                                description: s.description ?? "",
                                duration_minutes: s.duration_minutes,
                                buffer_minutes: s.buffer_minutes,
                                price: s.price,
                                max_per_day: s.max_per_day,
                                is_active: !s.is_active,
                              }),
                            s.is_active ? "Taken offline." : "Live.",
                          )
                        }
                        className="border-2 border-charcoal bg-cream px-3 py-1 font-sans text-[0.6rem] font-black uppercase tracking-[0.14em] text-charcoal disabled:opacity-40"
                      >
                        {s.is_active ? "Take offline" : "Put live"}
                      </button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Panel>

      <Panel>
        <PanelHeader
          title="Opening hours"
          hint="When sessions can be booked. Asia/Kolkata."
        />
        <div className="flex flex-col gap-3 p-5">
          {DAYS.map((day, weekday) => (
            <div key={day} className="flex flex-wrap items-center gap-4">
              <label className="flex w-[9rem] items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={hours[weekday].on}
                  onChange={(e) =>
                    setHours((h) => ({ ...h, [weekday]: { ...h[weekday], on: e.target.checked } }))
                  }
                  className="h-5 w-5 border-[3px] border-charcoal accent-gold"
                />
                <span className="font-sans text-[0.78rem] font-black uppercase tracking-[0.12em] text-charcoal">
                  {day}
                </span>
              </label>

              <input
                type="time"
                value={hours[weekday].start}
                disabled={!hours[weekday].on}
                onChange={(e) =>
                  setHours((h) => ({ ...h, [weekday]: { ...h[weekday], start: e.target.value } }))
                }
                className="border-[3px] border-charcoal bg-cream px-3 py-1.5 font-sans text-[0.84rem] font-bold text-charcoal disabled:opacity-30"
              />
              <span className="font-sans text-[0.78rem] font-bold text-charcoal/45">to</span>
              <input
                type="time"
                value={hours[weekday].end}
                disabled={!hours[weekday].on}
                onChange={(e) =>
                  setHours((h) => ({ ...h, [weekday]: { ...h[weekday], end: e.target.value } }))
                }
                className="border-[3px] border-charcoal bg-cream px-3 py-1.5 font-sans text-[0.84rem] font-bold text-charcoal disabled:opacity-30"
              />
            </div>
          ))}
        </div>

        <div className="flex justify-end border-t-[3px] border-charcoal p-5">
          <Button
            disabled={pending}
            onClick={() =>
              run(
                () =>
                  saveAvailability(
                    Object.entries(hours)
                      .filter(([, v]) => v.on)
                      .map(([weekday, v]) => ({
                        weekday: Number(weekday),
                        start_time: v.start,
                        end_time: v.end,
                      })),
                  ),
                "Hours saved.",
              )
            }
          >
            {pending ? "Saving…" : "Save hours"}
          </Button>
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="Days closed" hint="Holidays and anything else that blocks the whole day." />

        <div className="grid gap-4 border-b-[3px] border-charcoal bg-bone/60 p-5 sm:grid-cols-[11rem_1fr_auto] sm:items-end">
          <Field label="Date">
            <input
              type="date"
              value={closure.date}
              onChange={(e) => setClosure((c) => ({ ...c, date: e.target.value }))}
              className={INPUT_CLASS}
            />
          </Field>
          <Field label="Reason">
            <input
              value={closure.reason}
              onChange={(e) => setClosure((c) => ({ ...c, reason: e.target.value }))}
              placeholder="Onam"
              className={INPUT_CLASS}
            />
          </Field>
          <Button
            disabled={pending || !closure.date}
            onClick={() =>
              run(async () => {
                const r = await saveException(closure.date, closure.reason);
                if (r.ok) setClosure({ date: "", reason: "" });
                return r;
              }, "Closed.")
            }
          >
            Close day
          </Button>
        </div>

        {exceptions.length === 0 ? (
          <p className="px-5 py-6 font-sans text-[0.86rem] font-medium text-charcoal/55">
            Nothing blocked out.
          </p>
        ) : (
          <ul className="divide-y divide-charcoal/15">
            {exceptions.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-4 px-5 py-3">
                <div>
                  <p className="font-sans text-[0.88rem] font-black tabular-nums text-charcoal">
                    {shortDate(e.date)}
                  </p>
                  <p className="font-sans text-[0.76rem] font-medium text-charcoal/55">
                    {e.reason ?? "Closed"}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => run(() => deleteException(e.id), "Reopened.")}
                  className="border-2 border-charcoal bg-cream px-3 py-1 font-sans text-[0.6rem] font-black uppercase tracking-[0.14em] text-charcoal disabled:opacity-40"
                >
                  Reopen
                </button>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {past.length > 0 ? (
        <Panel>
          <PanelHeader title="Past & cancelled" />
          <Table>
            <thead>
              <tr>
                <Th>When</Th>
                <Th>Who</Th>
                <Th>Session</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {past.slice(0, 30).map((booking) => (
                <tr key={booking.id} className="opacity-70">
                  <Td className="whitespace-nowrap tabular-nums">{dateTime(booking.starts_at)}</Td>
                  <Td>{booking.name}</Td>
                  <Td className="text-charcoal/70">{booking.serviceName ?? "—"}</Td>
                  <Td>
                    <Badge tone={STATUS_TONE[booking.status]}>{label(booking.status)}</Badge>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Panel>
      ) : null}
    </div>
  );
}
