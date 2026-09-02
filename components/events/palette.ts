/**
 * Events page palette.
 *
 * The source prototype used four near-miss golds (#E5B611, #fdc500, #ffc300),
 * two navies (#0A192F, #213555) and three off-whites that all sat a few degrees
 * off the brand book. They are mapped here to the book's own tokens once, so
 * the page reads as part of the site rather than as an import — and so a future
 * palette change is one file, not ninety hardcoded hex strings.
 *
 * Relationships are preserved where they carried meaning: GHOST is still a
 * hair darker than BONE so the oversized wordmark behind the hero stays a
 * ghost rather than vanishing into its own background.
 */
export const EV = {
  gold: "#e6b325",
  navy: "#1f355e",
  /** One step up from navy — used where the prototype needed two navies to
   *  separate a panel from its ground. */
  navyLift: "#2a4576",
  charcoal: "#212121",
  cream: "#f9f7f2",
  bone: "#f1eee7",
  /** The oversized wordmark behind the hero: bone, a few percent down. */
  ghost: "#e2ddd0",
  /** True ground, matching the black the rest of the site sits on. */
  ink: "#0b0c11",
} as const;
