"use client";

import { enumOptions } from "@/lib/filters";
import { FilterBar } from "./FilterBar";

/** Thin wrapper over the shared filter bar, so the Leads list keeps its own
    vocabulary while the behaviour lives in one place. */
export function LeadFilters({
  q, status, source, unread,
}: {
  q: string;
  status: string;
  source: string;
  unread: boolean;
}) {
  return (
    <FilterBar
      basePath="/admin/crm/leads"
      searchPlaceholder="Name, email or company"
      values={{ q, status, source, unread: unread ? "1" : "" }}
      selects={[
        {
          key: "source",
          label: "Source",
          options: enumOptions("All sources", [
            "website", "events", "booking", "referral", "manual",
          ]),
        },
        {
          key: "status",
          label: "Status",
          options: enumOptions("All statuses", [
            "new", "contacted", "qualified", "proposal", "negotiation", "won", "lost",
          ]),
        },
      ]}
      toggles={[{ key: "unread", label: "Unread only" }]}
    />
  );
}
