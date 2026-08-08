---
name: Adversado
description: One continuous night flight through a dark field, lit in signal gold.
colors:
  signal-gold: "#e6b325"
  deep-harbour-navy: "#1f355e"
  paper-cream: "#f9f7f2"
  tinted-bone: "#f1eee7"
  ink-charcoal: "#212121"
  panel-black: "#120f17"
typography:
  display:
    fontFamily: "Montserrat, Arial, Helvetica, sans-serif"
    fontSize: "clamp(2.5rem, 8vw, 6.5rem)"
    fontWeight: 900
    lineHeight: 1.02
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Merriweather, Georgia, 'Times New Roman', serif"
    fontSize: "clamp(2.5rem, 6.5vw, 5rem)"
    fontWeight: 300
    lineHeight: 1.1
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Montserrat, Arial, Helvetica, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "0.16em"
  body:
    fontFamily: "Montserrat, Arial, Helvetica, sans-serif"
    fontSize: "clamp(1.15rem, 1.9vw, 1.5rem)"
    fontWeight: 300
    lineHeight: 1.8
    letterSpacing: "normal"
  tagline:
    fontFamily: "Merriweather, Georgia, 'Times New Roman', serif"
    fontSize: "clamp(1.05rem, 1.9vw, 1.7rem)"
    fontWeight: 300
    lineHeight: 1.7
    letterSpacing: "0.18em"
  label:
    fontFamily: "Montserrat, Arial, Helvetica, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "0.35em"
rounded:
  none: "0px"
  marker: "0.3em"
  card: "20px"
  panel: "1rem"
  full: "9999px"
spacing:
  section-y: "7rem"
  section-y-lg: "10rem"
  gutter: "1.5rem"
  stack: "3rem"
components:
  button-primary:
    backgroundColor: "{colors.signal-gold}"
    textColor: "{colors.ink-charcoal}"
    rounded: "{rounded.none}"
    padding: "1rem 2.25rem"
    typography: "{typography.label}"
  button-primary-hover:
    backgroundColor: "{colors.paper-cream}"
    textColor: "{colors.ink-charcoal}"
  link-cta:
    textColor: "{colors.signal-gold}"
    rounded: "{rounded.none}"
    typography: "{typography.label}"
  card-panel:
    backgroundColor: "{colors.panel-black}"
    textColor: "{colors.paper-cream}"
    rounded: "{rounded.card}"
    padding: "3.5rem 1.5rem"
  card-vertical:
    backgroundColor: "{colors.ink-charcoal}"
    textColor: "{colors.paper-cream}"
    rounded: "{rounded.panel}"
    padding: "1.5rem"
  marker-highlight:
    textColor: "{colors.signal-gold}"
    rounded: "{rounded.marker}"
    padding: "0.04em 0.22em"
  eyebrow:
    textColor: "{colors.signal-gold}"
    typography: "{typography.label}"
---

# Design System: Adversado

## Overview

**Creative North Star: "The Night Flight"**

The site is one continuous descent, not a stack of pages. A single dark field
runs behind everything from the first viewport to the last; the scrollbar is a
dolly track and the sections are transparent panes of type that the camera
passes through. Nothing paints a ground of its own. That is the whole system in
one sentence, and every other rule here exists to protect it.

This is a deliberate reversal of an earlier direction, and the reversal is
binding. The project's original design language called for full-bleed colour
blocks — "section = colour decision" — alternating navy, gold and white. Built
out, every one of those edges read as the end of one page and the start of
another. Colour blocking is now a **confirmed anti-reference**: it is the thing
this system was defined against, and the ember accent that belonged to it is
dropped from the palette entirely.

Type is the primary graphic. There are no icon sets, no illustration, no
decorative furniture. The only ornament is light — gold bloom, beams, shader
haze — and hairline rules. Restraint is the point: the brand's own thesis is
"attention is rented, memory is owned", and a system that shouts on every
section has nothing left to say on the one that matters.

**Key Characteristics:**

- One continuous dark ground; sections are transparent panes, never blocks.
- Montserrat and Merriweather, and nothing else.
- Gold is a light source, not a fill — it marks the one thing that matters.
- Depth is made with luminance and parallax, never with shadow.
- Every section carries one interaction, in service of continuity.
- Copy is dry, confident and slightly rude; the type setting matches.

## Colors

Two brand colours at high contrast over near-black, with warm off-whites for
reading. The palette is deliberately narrow — five values do the whole site.

### Primary

- **Signal Gold** (`#e6b325`): The brand's only accent and the site's light
  source. It marks the word that carries the argument, the eyebrow above a
  section, the one CTA on a screen, and the beams and blooms that light the
  dark field. Because it is the only accent, its rarity is what makes it read.

### Secondary

- **Deep Harbour Navy** (`#1f355e`): The atmosphere colour rather than a
  surface colour. It tints the scrims behind headlines, the sky in the
  cinematic field, and the knocked-out type on gold. Rarely a flat fill.

### Neutral

- **Paper Cream** (`#f9f7f2`): Default text colour on the dark ground. Full
  strength for headlines; `/70` for body; `/40` for text being deliberately
  set aside.
- **Tinted Bone** (`#f1eee7`): The off-white carrying a whisper of navy, for
  the rare light surface that still needs to register as tinted rather than
  plain white.
- **Ink Charcoal** (`#212121`): The document ground and the text colour that
  sits on gold.
- **Panel Black** (`#120f17`): The near-black used for a discrete panel that
  must sit above the field and hold copy legibly.

### Named Rules

**The One Light Rule.** Gold is a light source, not a fill. On any given
viewport there is one thing lit in gold — one CTA, one marked phrase, one
beam. Two golds competing on a screen means neither is the answer.

**The No Ground Rule.** No section paints a background. If a section needs
separation, it gets space, a hairline, or a change in the camera — never a
colour block. This is the single most load-bearing rule in the system.

**The Gold-on-White Ban.** Gold never sits on a light ground as text: not
body, not links, not labels, not validation. On a light surface gold may only
be a filled surface, a rule ≥4px, or display type ≥60px treated consciously as
a decorative graphic whose accessible name comes from elsewhere.

## Typography

**Display Font:** Montserrat (with Arial, Helvetica, sans-serif)
**Body Font:** Montserrat (with Arial, Helvetica, sans-serif)
**Editorial Font:** Merriweather (with Georgia, "Times New Roman", serif)

**Character:** Two faces, no exceptions. Montserrat does the shouting —
geometric, black-weight, tight-tracked, usually uppercase. Merriweather does
the thinking — light-weight serif for the sentences meant to be believed
rather than announced. The tension between a poster voice and an editorial
voice is the type system; adding a third face collapses it.

### Hierarchy

- **Display** (900, `clamp(2.5rem, 8vw, 6.5rem)`, 1.02, `-0.02em`): Hero and
  statement lines. Uppercase. Often split so a clause lands in gold.
- **Headline** (300 serif, `clamp(2.5rem, 6.5vw, 5rem)`, 1.1): Section
  headlines that make an argument. The light weight at large size is the
  brand's most recognisable typographic move.
- **Title** (700, `1.5rem`, `0.16em` tracking, uppercase): Card and list-item
  headings.
- **Body** (300, `clamp(1.15rem, 1.9vw, 1.5rem)`, 1.8): Reading copy. Long
  measures are broken by line rather than justified into a block.
- **Tagline** (300 serif italic, `clamp(1.05rem, 1.9vw, 1.7rem)`, `0.18em`,
  uppercase): Reserved for brand lines only.
- **Label** (500, `0.75rem`, `0.35em` tracking, uppercase): The tracked
  micro-label above a section, and button text.

### Named Rules

**The Split Headline Rule.** Every display headline divides into a quiet
clause and a loud clause — weight, colour or face carries the split ("We're
not for everyone. *That's deliberate.*"). This is the most transferable device
in the identity; a headline set in one uniform voice is a missed one.

**The Two Faces Rule.** Montserrat and Merriweather. A third family, a
condensed cut, or a display face for one section is out of system.

**The Eyebrow Rule.** Every section opens with a tracked uppercase label in
gold. It costs almost nothing and it does most of the work of rhythm.

## Layout

Content sits in a centred column — `max-w-4xl` for reading surfaces,
`max-w-6xl` for galleries, up to `1500px` where a section needs the full
width. Gutters are `1.5rem`, rising at `sm`.

Vertical rhythm is the primary spacing instrument: sections run `7rem` of
padding on small screens and `10rem` from `sm` up, and that generous air is
what separates sections now that colour blocks are banned. Within a section,
blocks stack on a roughly `3rem` interval, tightening to `0.75rem` between a
heading and the line that belongs to it.

Two-column rows are used where an object is set against an argument. The
divider between them is a single hairline at `cream/15`, and it belongs to the
column whose height is content-driven — a column sized by aspect ratio leaves
the rule stopping short of the row.

Full-bleed elements break the column deliberately and rarely: the slide
breaker spans `100vw` from a centred parent. The page run is
`overflow-x-hidden` so a full-bleed child cannot introduce a horizontal
scrollbar.

Responsive behaviour is fluid rather than stepped: type is set in `clamp()`
almost everywhere, so most breakpoints are structural (stack versus
side-by-side) rather than typographic.

### Named Rules

**The Air, Not Edges Rule.** Separation between sections is space. If two
sections read as running together, the fix is more vertical rhythm, never a
background, a border, or a divider across the full width.

## Elevation & Depth

There are no shadows in this system. Depth is made with **light and
parallax**: gold bloom, beams, shader haze, radial scrims that deepen behind
copy, and a fixed cinematic field that moves at its own rate as the page
scrolls. Layers are separated by luminance and by how fast they travel, the
way distance actually reads.

The one place a conventional surface appears is a discrete panel — a card that
must hold copy over an active background. It earns separation with a border
and a near-black fill, not a drop shadow.

### Named Rules

**The Light, Not Shadow Rule.** Depth is luminance and parallax. `box-shadow`
is not a depth device here. If an element needs to lift off the page, light it
or move it, don't drop a shadow under it.

**The Scrim Discipline Rule.** A scrim exists to make type legible over an
active background, and it is always the lightest one that achieves that. A
scrim heavy enough to flatten the effect underneath it has defeated the
purpose of having the effect.

## Shapes

Predominantly hard-edged. The CTA is a true rectangle (`0px`) and that
squareness is deliberate — it reads as a stamp rather than a web button.

Radius is used in exactly three places:

- **Marker highlights** (`0.3em`): the gold-tinted background behind a phrase
  that carries the argument, always with `box-decoration-break: clone` so a
  wrapped phrase keeps its ends on both lines.
- **Panels** (`20px`): a discrete card holding copy over an active background,
  carrying a `2px` gold border.
- **Gallery tiles** (`1rem`): the vertical cards, with a faint `cream/12`
  hairline.

Borders are hairlines, not frames — `cream/15` for structural rules, gold at
`2px` when a panel is meant to be an object in its own right.

### Named Rules

**The Square CTA Rule.** The primary action is never rounded. Rounding it
makes it look like every other site's button, which is precisely the thing the
brand has decided not to be.

## Components

### Buttons

- **Shape:** True rectangle, no radius (`0px`).
- **Primary:** Signal Gold fill, Ink Charcoal text, `1rem 2.25rem` padding,
  label typography (500, `0.75rem`, `0.2em` tracking, uppercase).
- **Hover / Focus:** Fill transitions to Paper Cream over 300ms. The arrow
  glyph translates `4px` right. The button itself is magnetic — it leans
  toward the pointer within ~110px and springs back.
- **Text CTA:** Gold, uppercase, tracked, with a trailing arrow that shifts
  right on hover. Used where a button would be too loud for the section.

### Cards / Containers

- **Corner Style:** `20px` for copy panels, `1rem` for gallery tiles.
- **Background:** Panel Black for copy panels; the tile's own theme colour
  under a shader for gallery tiles.
- **Border:** `2px` Signal Gold for a panel meant to read as an object;
  `1px` `cream/12` hairline for tiles.
- **Shadow Strategy:** None. See Elevation & Depth.
- **Internal Padding:** `3.5rem 1.5rem`, rising to `5rem 3rem` from `sm`.

### Navigation

The wordmark sits fixed at top-left throughout. There is no persistent nav
chrome on the homepage — the descent is the navigation, and the scroll cue at
the end of the hero is the only wayfinding offered.

### Signature: the marked phrase

The system's most reusable device. A phrase carrying the argument gets a
gold-tinted ground (`gold/18`), gold text, `0.3em` radius, and cloned box
decoration so it survives a line wrap. Used for the phrase a reader should
leave with — never for more than one phrase in a paragraph.

### Signature: the cinematic field

A fixed, full-viewport dark field with parallax constellations, sitting behind
every section at `z-0` with the content run at `z-10`. It is the ground for
the entire site. Every WebGL shader on the page is gated on proximity to the
viewport, because browsers grant roughly sixteen contexts per page and this
page has repeatedly approached that ceiling.

### Signature: pointer-reactive type

Type answers the cursor rather than sitting still: letters thicken along a
variable weight axis as the pointer nears (`VariableProximity`), words shoulder
away from it (`RepelText`), and a word swells when magnified (`Magnify`). This
is where the system's personality lives — the components are blunt, and the
liveliness is in how they respond.

## Do's and Don'ts

### Do:

- **Do** let the cinematic field be the only ground. Sections are transparent.
- **Do** separate sections with vertical rhythm (`7rem` / `10rem`) and
  hairlines at `cream/15`.
- **Do** split every display headline into a quiet clause and a loud one.
- **Do** keep gold to one lit thing per viewport.
- **Do** set the primary CTA as a square gold block with charcoal text.
- **Do** give a marked phrase `box-decoration-break: clone` so it survives a
  wrap.
- **Do** gate every new shader on viewport proximity; the WebGL context budget
  is a real constraint on this page.
- **Do** keep scroll-revealed content in the DOM pre-animation — animate
  opacity and transform only, never `display: none`.
- **Do** design the `prefers-reduced-motion` variant as a composed static
  state, not an absence.

### Don't:

- **Don't** paint a section background or alternate colour blocks. This is the
  system's confirmed anti-reference, not a matter of taste.
- **Don't** introduce an ember or any third accent. Gold is the only accent.
- **Don't** load a third typeface, a condensed cut, or a display face for one
  section.
- **Don't** use `box-shadow` as a depth device.
- **Don't** round the primary CTA.
- **Don't** set gold as text on a light ground, at any size, for anything
  meant to be read.
- **Don't** stack two interactions in one section, or repeat the same effect
  across sections — motion serves continuity, and an effect that calls
  attention to itself as an effect works against it.
- **Don't** let a scrim get heavy enough to flatten the effect it sits over.
- **Don't** add icon sets, illustration, or decorative furniture. Type and
  light are the graphics.
