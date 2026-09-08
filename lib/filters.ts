/**
 * Filter-option helpers.
 *
 * A plain module on purpose. This lived in `components/admin/FilterBar.tsx`,
 * which carries `"use client"` — and every export of a client module becomes a
 * *client reference* when a Server Component imports it, not the value. The
 * list pages call this while rendering on the server, so importing it from
 * there threw:
 *
 *   Attempted to call enumOptions() from the server but enumOptions is on the
 *   client.
 *
 * A client module's exports can be rendered or passed as props. They cannot be
 * called. Anything a Server Component needs to *run* belongs in a module with
 * no "use client" at the top.
 */

export type FilterOption = { value: string; label: string };

/** Builds an "All …" option list from enum values. */
export function enumOptions(
  all: string,
  values: readonly string[],
): FilterOption[] {
  return [
    { value: "", label: all },
    ...values.map((v) => ({
      value: v,
      label: v.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase()),
    })),
  ];
}
