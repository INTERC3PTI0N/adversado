# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Prospective clients evaluating a creative agency — the person who owns the brand
decision at a company that is at a turning point (launching, relaunching,
repositioning, expanding). They arrive either from search, from a referral, or
from the agency's own outbound, and they are comparison-shopping against other
agencies and against the option of hiring in-house or stitching together
freelancers.

Two secondary audiences the site must also serve:

- **Organic search traffic** arriving on service pages for commercial-intent
  terms ("branding agency", "advertising agency", "digital marketing agency")
  rather than on the homepage.
- **Credibility checkers** — someone who has already heard of Adversado and is
  verifying that it is real and serious before a meeting.

## Product Purpose

Adversado is an integrated creative agency in Kochi, Kerala, India. This project
is its website.

The site has three jobs, and the architecture is committed to all three rather
than optimising for one: **lead generation**, **portfolio credibility**, and
**organic search**. The conversion architecture funnels to a single entry
product — the brand audit — which every CTA on the site points to. Success is a
qualified enquiry that starts with an audit, not raw traffic.

## Positioning

"The Brand Behind The Brands." Branding, advertising, marketing, events and
performance under one roof, on the argument that customers do not experience a
business in departments. The commitment a neighbouring agency could not
truthfully copy is the integration itself: **one team, one voice, one standard**
— one partner instead of ten vendors, with consistency measured as strictly as
quality.

The brand's stated stance is selective rather than eager: "We're not for
everyone. That's deliberate." The strategic claim underneath the work is
"Attention is rented. Memory is owned." — the agency builds for what people
remember rather than for campaign-window applause.

## Operating Context

- **Service structure — four verticals.** Brand Foundation, Brand Marketing,
  Brand Reach, Brand Experience.
- **Process — the Six Ds.** Discover, Debate, Define, Design, Deliver, Develop.
  Every engagement starts with an audit, no exceptions. The company deck's
  four-step version (audit / meet / plan / delivery) is a sales-deck
  simplification; six Ds is the web truth.
- **The brand audit is the entry product.** It is the destination for every CTA
  and the site's conversion engine.
- The site is planned in tiers: a launch core (Home, About, Services hub + four
  vertical pages, Brand Audit, Contact, legal, 404), then an SEO silo of service
  leaf pages, then proof (`/work`) once client permissions exist.

## Capabilities and Constraints

- Existing Next.js App Router codebase (React 19, TypeScript strict, Tailwind
  v4), with GSAP, Motion, three.js and Spline already in use for the motion and
  WebGL layers.
- Currently shipped: a countdown holding page at `/`, and the homepage in
  progress at `/home`.
- **WebGL context budget is a live constraint.** Browsers grant roughly sixteen
  contexts per page and this page has repeatedly approached that ceiling; every
  shader is gated on proximity to the viewport for that reason. Treat an added
  shader as a cost, not a free flourish.
- Vertical 2 is named **Brand Marketing** — decided, final. The company deck's
  "Brand Direction" is superseded and the deck is to be updated to match, not
  the reverse. The name determines a URL, a nav label, a page of copy and the
  "advertising agency" keyword target, so it is a single source of truth.
- **Launch date is not committed.** The countdown currently reads 2026-08-11,
  but that date is soft and expected to move, and the scope required at launch
  is an open decision. Do not treat the countdown target as a deadline or as a
  promise to a scope.
- Content is hand-built for launch; a CMS is deferred until the leaf-page and
  case-study volume justifies it.

## Brand Commitments

- **Name and wordmark:** Adversado. The logo carries a cat in the V/E negative
  space and the white dot on the O is its ball.
- **Palette:** brand gold `#e6b325`, navy `#1f355e`, charcoal `#212121`, cream.
  A two-colour, high-contrast brand where a section is a colour decision rather
  than a white page with accents.
- **Typography:** Montserrat is the primary face, with a serif italic reserved
  for the tagline voice.
- **Type is the primary graphic.** No decorative furniture, no icon sets. The
  reusable device across the identity is headline splitting — every H1/H2
  divides into a quiet clause and a loud clause.
- **The cat is a first-class visual system**, not an easter egg — it is already
  in the logo and the deck. Constraint on record: the cat is never cute.
  Silhouette only, no faces except the logo's eyes, no bounce easing.
- **Voice:** dry, confident, slightly rude. Explicitly distinctive enough that
  generated copy flattens it; long-form copy is a human writing job. The brand
  book bans "we're excited to announce" and the rest of the coming-soon
  vocabulary by name.

## Evidence on Hand

- **Source documents** (repo root, one level above the web project):
  `adversado brand book final.pdf`, `adversado company deck-2.pdf`,
  `Adversado_Website_final_SEO.pdf` (the copy doc), and
  `Adversado Digital Marketing Proposal.pdf`.
- **Planning documents** (`Plan/`): `01-Design-Language.md`,
  `02-Sitemap-and-Page-Specs.md`, `03-Build-Plan.md`.
- **Client logos: available and permitted.** A proof strip using named client
  logos is cleared to build.

Absences that future work must not paper over or invent around:

- **No case studies cleared for publication.** `/work` cannot ship, and no
  project write-up, result, or client narrative may be written speculatively.
- **No commissioned team photography.** The deck's team images are
  stock/placeholder. The About page is blocked on a real shoot; the interim is
  typographic team cards with no images.
- **No testimonials, benchmarks, awards, client counts, or performance figures
  have been confirmed.** None may be fabricated as filler.

## Product Principles

1. **Integration is the product.** Every page should make the one-partner
   argument structurally, not just assert it in copy.
2. **The audit is the only door.** Conversion paths lead to the brand audit
   rather than to a generic contact form.
3. **Selectivity is a feature.** The site is allowed to repel a bad-fit
   prospect; softening that stance costs more than it gains.
4. **Memory over applause.** Favour work that is distinctive enough to be
   remembered over work that performs well for one campaign window.
5. **Claim nothing that isn't cleared.** Where proof is missing, the site says
   less rather than inventing it.

## Accessibility & Inclusion

Committed gates, from the design language doc:

- All body text ≥ 4.5:1. **Gold on white is banned as text** — not body, links,
  small labels, or validation. On white, gold may only be a surface, a rule
  ≥4px, or display type ≥60px treated consciously as a decorative graphic with
  its accessible name supplied elsewhere.
- Focus rings: 2px, 3px offset, in brand gold. (The plan doc specified an
  "ember" accent for this; ember was dropped when the visual system was
  settled, so gold carries it.)
- Scroll-triggered reveals must keep content in the DOM pre-animation —
  opacity/transform only, never `display: none` — so crawlers and screen
  readers see it.
- `prefers-reduced-motion` gets a designed static-but-composed variant of every
  scene, reviewed and signed off, not an auto-generated kill switch.
- The planned cat hunt must be keyboard- and screen-reader-completable, with
  ≥44px hit areas and accessibly-named controls.
- Targets: Lighthouse a11y 100; performance ≥95 on SEO pages, ≥85 on the WebGL
  hero, with that trade-off accepted explicitly rather than assumed free.
