"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { reorder } from "@/app/(admin)/admin/(guarded)/content/[collection]/actions";

/**
 * Move a row up or down.
 *
 * Sends the whole resulting order rather than a swap — positions stay dense
 * and unique that way, which matters once rows have been added and deleted a
 * few times.
 */
export function ReorderControls({
  route, ids, index,
}: {
  route: string;
  ids: string[];
  index: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function move(direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= ids.length) return;

    const next = [...ids];
    [next[index], next[target]] = [next[target], next[index]];

    startTransition(async () => {
      await reorder(route, next);
      router.refresh();
    });
  }

  return (
    <div className="flex gap-1.5">
      <button
        type="button"
        onClick={() => move(-1)}
        disabled={pending || index === 0}
        aria-label="Move up"
        className="border-2 border-charcoal px-2 py-0.5 font-sans text-[0.68rem] font-black disabled:opacity-25"
      >
        ↑
      </button>
      <button
        type="button"
        onClick={() => move(1)}
        disabled={pending || index === ids.length - 1}
        aria-label="Move down"
        className="border-2 border-charcoal px-2 py-0.5 font-sans text-[0.68rem] font-black disabled:opacity-25"
      >
        ↓
      </button>
    </div>
  );
}
