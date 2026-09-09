/**
 * ChatGPT conversion pixel events.
 *
 * The SDK is loaded once in the root layout; this is the reporting side. A
 * plain module, not `"use client"` — client modules can only be rendered from
 * a Server Component, never called.
 *
 * Every call is guarded. `window.oaiq` is undefined until OpenAI's script
 * loads, and it is blocked outright by most ad blockers, so an unguarded call
 * would throw inside a form's success handler and turn a delivered enquiry
 * into a visible error. Analytics never gets to break the thing it measures.
 */

declare global {
  interface Window {
    oaiq?: (...args: unknown[]) => void;
  }
}

/**
 * Fires when someone actually becomes a lead — a contact enquiry accepted by
 * the server, or a booking taken. Deliberately not on page view: this is the
 * conversion, and firing it per page would report a lead for every visit.
 */
export function trackLeadCreated(): void {
  if (typeof window === "undefined") return;

  try {
    window.oaiq?.("measure", "lead_created", { type: "customer_action" });
  } catch {
    /* A tracker failing is never worth surfacing to the visitor. */
  }
}
