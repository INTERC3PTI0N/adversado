"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ensurePages } from "@/app/(admin)/admin/(guarded)/content/pages/actions";
import { Button } from "./ui";

/**
 * Creates any page or section declared in the schema registry but missing from
 * the database, seeded with the defaults — which are the copy currently live on
 * the site. Idempotent, so it is safe to press at any time.
 */
export function SyncPagesButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  return (
    <div className="flex flex-col items-end gap-2">
      <Button
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setError("");
            const result = await ensurePages();
            if (result.ok) router.refresh();
            else setError(result.error);
          })
        }
      >
        {pending ? "Syncing…" : "Sync pages"}
      </Button>
      {error ? (
        <p className="max-w-[32ch] text-right font-sans text-[0.76rem] font-bold text-[#c8322a]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
