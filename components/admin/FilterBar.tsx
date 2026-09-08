"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import type { FilterOption } from "@/lib/filters";
import { Button, INPUT_CLASS } from "./ui";

/**
 * URL-backed search and filters, shared by every list screen.
 *
 * State lives in the query string rather than in component state: a filtered
 * view is then shareable, survives a refresh, and is what the CSV exports read
 * to decide what to include.
 *
 * Selects apply on change; free text waits for submit, because filtering on
 * every keystroke means a round trip per character.
 */

export type SelectFilter = {
  key: string;
  label: string;
  /** First entry is the "all" option; its value must be "". */
  options: FilterOption[];
};

export type ToggleFilter = { key: string; label: string };

export function FilterBar({
  basePath,
  searchKey = "q",
  searchLabel = "Search",
  searchPlaceholder,
  selects = [],
  toggles = [],
  values,
}: {
  basePath: string;
  searchKey?: string;
  searchLabel?: string;
  searchPlaceholder?: string;
  selects?: SelectFilter[];
  toggles?: ToggleFilter[];
  values: Record<string, string>;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [search, setSearch] = useState(values[searchKey] ?? "");

  function apply(next: Record<string, string>) {
    const sp = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v) sp.set(k, v);
      else sp.delete(k);
    }
    sp.delete("page"); // a new filter always starts at page one
    const qs = sp.toString();
    router.push(qs ? `${basePath}?${qs}` : basePath);
  }

  const active = Object.values(values).some(Boolean);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        apply({ [searchKey]: search });
      }}
      className="flex flex-wrap items-end gap-4 border-[3px] border-charcoal bg-cream p-5 shadow-[6px_6px_0_0_#212121]"
    >
      {searchPlaceholder !== undefined || searchLabel ? (
        <label className="min-w-[15rem] flex-1">
          <span className="font-sans text-[0.6rem] font-black uppercase tracking-[0.2em] text-charcoal">
            {searchLabel}
          </span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className={`${INPUT_CLASS} mt-2`}
          />
        </label>
      ) : null}

      {selects.map((filter) => (
        <label key={filter.key}>
          <span className="font-sans text-[0.6rem] font-black uppercase tracking-[0.2em] text-charcoal">
            {filter.label}
          </span>
          <select
            value={values[filter.key] ?? ""}
            onChange={(e) => apply({ [filter.key]: e.target.value })}
            className={`${INPUT_CLASS} mt-2 appearance-none`}
          >
            {filter.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      ))}

      {toggles.map((toggle) => (
        <label key={toggle.key} className="flex items-center gap-2.5 pb-3">
          <input
            type="checkbox"
            checked={Boolean(values[toggle.key])}
            onChange={(e) => apply({ [toggle.key]: e.target.checked ? "1" : "" })}
            className="h-5 w-5 border-[3px] border-charcoal accent-gold"
          />
          <span className="font-sans text-[0.72rem] font-black uppercase tracking-[0.14em] text-charcoal">
            {toggle.label}
          </span>
        </label>
      ))}

      <Button type="submit">Apply</Button>

      {active ? (
        <Button
          tone="secondary"
          onClick={() => {
            setSearch("");
            router.push(basePath);
          }}
        >
          Clear
        </Button>
      ) : null}
    </form>
  );
}
