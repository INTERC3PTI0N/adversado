"use client";

import { useSyncExternalStore } from "react";

/**
 * Is this a device that cannot afford the full shader stack?
 *
 * The homepage's preloader asks for ten simultaneous WebGL contexts — six
 * `WarpText` lenses (one per headline word), plus the silk backdrop, the globe,
 * the event horizon and the exit tunnel. Desktop Chrome hands out about sixteen
 * and copes. A phone does not: mobile browsers grant far fewer, drop them
 * aggressively under memory pressure, and each of these is a full-screen
 * fragment shader running at the device's pixel ratio — which on a 3× phone is
 * roughly nine times the fragment work per context. The result on real hardware
 * is contexts being killed as fast as they are created and the preloader coming
 * up blank, which is exactly what was reported.
 *
 * Note that emulating a small viewport in desktop devtools does NOT reproduce
 * it: the GPU, the context ceiling and the memory limits are all still the
 * desktop's. This has to be judged from device class, not from width alone.
 *
 * `useSyncExternalStore` rather than state-in-an-effect: it gives the server
 * and the first client render the same answer (`false`, the safe one) and then
 * resubscribes, without the extra render pass or the hydration mismatch that
 * the effect version invites.
 */

function subscribe(onChange: () => void) {
  const mq = window.matchMedia("(pointer: coarse)");
  mq.addEventListener("change", onChange);
  window.addEventListener("resize", onChange);
  return () => {
    mq.removeEventListener("change", onChange);
    window.removeEventListener("resize", onChange);
  };
}

function getSnapshot() {
  const nav = navigator as Navigator & { deviceMemory?: number };
  // A touch primary pointer on a narrow viewport is the clearest signal of a
  // phone. The hardware hints catch low-end laptops and tablets that would
  // struggle for the same reason, and they are optional because Safari does
  // not expose `deviceMemory` at all.
  const touchFirst =
    window.matchMedia("(pointer: coarse)").matches && window.innerWidth < 1024;
  const fewCores = (nav.hardwareConcurrency ?? 8) <= 4;
  const littleMemory = (nav.deviceMemory ?? 8) <= 4;
  return touchFirst || fewCores || littleMemory;
}

/** The server has no device to inspect, and the safe assumption is the rich
 *  one — a desktop that briefly renders the full stack is correct, where a
 *  phone that briefly does is the bug this exists to prevent. Hydration then
 *  corrects it on the first client tick. */
const getServerSnapshot = () => false;

export function useConstrainedDevice() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
