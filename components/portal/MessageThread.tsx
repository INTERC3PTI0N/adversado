"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  markMessagesRead, sendClientMessage,
} from "@/app/(portal)/portal/(guarded)/messages/actions";
import { dateTime } from "@/lib/format";
import { Alert, Button, INPUT_CLASS, Panel, PanelHeader } from "@/components/admin/ui";

type Message = {
  id: string;
  body: string;
  created_at: string;
  author_id: string | null;
  read_at: string | null;
};

export function MessageThread({
  messages,
  selfId,
}: {
  messages: Message[];
  selfId: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);

  const unread = messages.some((m) => m.author_id !== selfId && !m.read_at);

  useEffect(() => {
    // Opening the page is what counts as reading it. Only fires when something
    // is actually unread, so a revisit isn't a pointless write.
    if (!unread) return;
    markMessagesRead().then(() => router.refresh());
  }, [unread, router]);

  return (
    <div className="flex flex-col gap-7">
      {error ? <Alert tone="error">{error}</Alert> : null}

      <Panel>
        <PanelHeader title="Write to us" hint="Goes straight to the team on your account." />
        <div className="p-5">
          <textarea
            rows={4}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Anything you need."
            className={`${INPUT_CLASS} resize-y`}
          />
          <div className="mt-4 flex justify-end">
            <Button
              disabled={pending || !body.trim()}
              onClick={() => {
                setError(null);
                startTransition(async () => {
                  const result = await sendClientMessage(body);
                  if (result.ok) {
                    setBody("");
                    router.refresh();
                  } else setError(result.error);
                });
              }}
            >
              {pending ? "Sending…" : "Send"}
            </Button>
          </div>
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="Conversation" />
        {messages.length === 0 ? (
          <p className="px-5 py-8 text-center font-sans text-[0.9rem] font-medium text-charcoal/55">
            Nothing here yet. Say hello.
          </p>
        ) : (
          <ul className="flex flex-col gap-4 p-5">
            {messages.map((m) => {
              const mine = m.author_id === selfId;

              return (
                <li
                  key={m.id}
                  className={`max-w-[46rem] border-[3px] border-charcoal p-4 ${
                    mine ? "ml-auto bg-gold" : "bg-cream"
                  }`}
                >
                  <p className="mb-2 font-sans text-[0.62rem] font-black uppercase tracking-[0.18em] text-charcoal/50">
                    {mine ? "You" : "Adversado"} · {dateTime(m.created_at)}
                  </p>
                  <p className="whitespace-pre-wrap font-sans text-[0.92rem] font-medium leading-[1.65] text-charcoal">
                    {m.body}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </div>
  );
}
