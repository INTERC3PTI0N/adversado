# Adversado Platform — Backend Specification

Premium plan build. Covers the CMS, the CRM & Lead Management module, role-based
access, and the three premium add-ons (Session Booking, Client Portal, Lead
Manager). Written to be implemented, not admired: every table, policy and route
below maps to a file.

- **Database / auth / storage:** Supabase (Postgres 15, RLS, Auth, Storage)
- **App:** Next.js 16 App Router, React 19, TypeScript strict, Tailwind v4
- **Admin styling:** the site's neobrutalist idiom — 3–4px charcoal borders,
  flat offset shadows with no blur, no rounded corners, gold/navy/charcoal/
  cream/bone only
- **Email:** Resend (already wired at `app/api/contact/route.ts`)

---

## 1. Roles and access

Four roles, on a strict ladder. Everything below is enforced in Postgres RLS,
not only in the UI — the UI hides what a role can't do, the database refuses it.

| Role | Intent |
|---|---|
| `super_admin` | Everything, including user management, role changes, destructive deletes, settings, billing data |
| `admin` | Everything operational: all content, all CRM, invoices, bookings, PM. Cannot change roles or delete users |
| `editor` | Content only: pages, posts, projects, case studies, services, team, testimonials, FAQs, media. Can save and schedule, **cannot publish** without approval. No CRM, no invoices, no settings |
| `client` | Client Portal only. Sees only rows belonging to their own `client_id` |

`editor` publish gating is a workflow, not a nicety: `status` moves
`draft → in_review → scheduled → published`, and only `admin`+ may set
`published`.

### Permission matrix

| Capability | super_admin | admin | editor | client |
|---|:--:|:--:|:--:|:--:|
| Manage users & roles | ✅ | — | — | — |
| Site settings, integrations | ✅ | ✅ | — | — |
| Create/edit content | ✅ | ✅ | ✅ | — |
| Publish content | ✅ | ✅ | — | — |
| Delete content (soft) | ✅ | ✅ | ✅ own drafts | — |
| Purge (hard delete) | ✅ | — | — | — |
| Media upload | ✅ | ✅ | ✅ | — |
| View leads | ✅ | ✅ | — | — |
| Edit leads / pipeline | ✅ | ✅ | — | — |
| Export leads CSV | ✅ | ✅ | — | — |
| Invoices | ✅ | ✅ | — | view own |
| PM projects & tasks | ✅ | ✅ | — | view own |
| Bookings | ✅ | ✅ | — | own |
| Audit log | ✅ | view | — | — |

---

## 2. Content model — how "every text section is editable" works

A table per section type does not scale: the site has ~40 distinct sections and
they change shape often. Instead:

```
pages ──< page_sections ──< section_revisions
```

- `pages` — one row per route (`/`, `/about`, `/services`, `/events`, …). Owns
  route-level SEO.
- `page_sections` — one row per section on that page, identified by a stable
  `key` (`hero`, `belief`, `verticals`, `six_ds`, `invitation`…). The editable
  content lives in `data jsonb`, shaped by a **section schema** registered in
  code at `lib/cms/schemas.ts`.
- `section_revisions` — every save snapshots the previous `data`. Restore is a
  copy-forward, never an in-place rewrite, so history is append-only.

The schema registry is the contract between the editor UI and the renderer: it
declares each field's key, label, type (`text | textarea | richtext | image |
link | list | group | boolean | number | select`), and validation. The admin
renders a form from it; the page component reads typed data from it. Adding a
field is a one-line schema change plus a migration-free `jsonb` write.

**Fallback rule:** every section component keeps its current hardcoded copy as
the default. If the database has no row, or the row is unpublished, the site
renders the default. The site can never go blank because someone deleted a row.

### Collections (their own tables — they're lists, not page furniture)

`posts`, `projects`, `case_studies`, `services`, `team_members`,
`testimonials`, `faqs`. Each has: slug, status, scheduling, SEO block, ordering,
soft delete, and full-text search.

---

## 3. Database schema

### 3.1 Enums

```
user_role        super_admin | admin | editor | client
content_status   draft | in_review | scheduled | published | archived
lead_source      website | events | booking | referral | manual | import
lead_status      new | contacted | qualified | proposal | negotiation | won | lost
lead_priority    low | normal | high | urgent
invoice_status   draft | sent | partial | paid | overdue | void
task_status      todo | in_progress | blocked | review | done
booking_status   pending | confirmed | cancelled | completed | no_show
project_status   planning | in_progress | on_hold | review | complete
```

### 3.2 Identity

- **`profiles`** — `id` (FK `auth.users`), `email`, `full_name`, `avatar_url`,
  `role`, `is_active`, `client_id` (nullable, for portal users), `last_seen_at`.
  Created by trigger on `auth.users` insert.
- **`audit_log`** — `actor_id`, `action`, `entity`, `entity_id`, `before`,
  `after`, `ip`, `created_at`. Written by trigger on every mutating table.

### 3.3 CMS

- **`pages`** — `slug` unique, `title`, `is_system`, SEO block, `status`.
- **`page_sections`** — `page_id`, `key`, `kind`, `position`, `status`,
  `scheduled_at`, `published_at`, `data jsonb`, `updated_by`. Unique
  `(page_id, key)`.
- **`section_revisions`** — `section_id`, `data`, `note`, `created_by`.
- **`posts`** — `title`, `slug`, `excerpt`, `body` (rich JSON), `cover_id`,
  `author_id`, `status`, `published_at`, `scheduled_at`, `reading_minutes`,
  SEO block, `view_count`.
- **`tags`**, **`post_tags`** — many-to-many.
- **`projects`** — `title`, `slug`, `client_name`, `category`, `year`,
  `cover_id`, `gallery jsonb`, `summary`, `body`, `is_featured`, `position`,
  `status`, SEO block.
- **`case_studies`** — `title`, `slug`, `client_name`, `challenge`, `approach`,
  `result`, `metrics jsonb`, `cover_id`, `project_id` (nullable link),
  `status`, SEO block.
- **`services`** — `name`, `slug`, `tagline`, `quip`, `body`, `bullets jsonb`,
  `vertical_index`, `position`, `status`, SEO block.
- **`team_members`** — `name`, `role_title`, `bio`, `photo_id`, `socials jsonb`,
  `position`, `status`.
- **`testimonials`** — `quote`, `author_name`, `author_role`, `company`,
  `avatar_id`, `rating`, `is_featured`, `position`, `status`.
- **`faqs`** — `question`, `answer`, `category`, `position`, `status`.

**SEO block** (columns on each of the above): `seo_title`, `seo_description`,
`seo_keywords text[]`, `og_image_id`, `canonical_url`, `noindex`, `nofollow`,
`structured_data jsonb`.

- **`redirects`** — `from_path` unique, `to_path`, `status_code`, `is_active`.
- **`seo_settings`** — singleton: site name, title template, default OG image,
  robots directives, verification tokens, organisation JSON-LD.

### 3.4 Media

- **`media_folders`** — `name`, `parent_id`, `path`.
- **`media`** — `storage_path`, `bucket`, `filename`, `mime_type`, `size_bytes`,
  `width`, `height`, `alt_text`, `caption`, `folder_id`, `uploaded_by`,
  `checksum` (dedupe).

Storage buckets: `media` (public read), `documents` (private, portal),
`avatars` (public read).

### 3.5 CRM

- **`forms`** — `key` unique (`contact`, `events_brief`, `booking`, `audit`),
  `name`, `schema jsonb`, `notify_emails text[]`, `is_active`. Every public form
  is registered here so submissions are attributable.
- **`form_submissions`** — **the raw record of every form entry, kept
  permanently and independently of the lead.** `form_id`, `payload jsonb`,
  `lead_id` (nullable), `source_page`, `utm jsonb`, `ip`, `user_agent`,
  `is_spam`, `created_at`. A lead can be merged or deleted; the submission
  stays. This is the audit trail for "we never got that enquiry".
- **`leads`** — `name`, `email`, `phone`, `company`, `message`, `budget`,
  `source` (**`events` is a first-class value, separating Events enquiries from
  the rest of the site**), `source_page`, `utm jsonb`, `status`, `priority`,
  `owner_id`, `estimated_value`, `currency`, `is_read`, `first_contacted_at`,
  `won_at`, `lost_reason`, `client_id` (set on conversion), `score`,
  `deleted_at`.
- **`lead_notes`** — `lead_id`, `author_id`, `body`, `is_pinned`.
- **`lead_activities`** — `lead_id`, `actor_id`, `type` (`created`,
  `status_changed`, `note_added`, `emailed`, `called`, `assigned`, `viewed`),
  `meta jsonb`. Append-only; drives the activity history timeline.
- **`lead_tags`**, **`lead_tag_links`**.

Lead ingestion: `POST /api/contact` writes `form_submissions` first, then
upserts `leads` (dedupe on email within 30 days), then fires notifications and
the Resend email. The submission write is not conditional on the rest
succeeding — a Resend outage must not lose the enquiry.

### 3.6 Invoicing

- **`clients`** — `name`, `company`, `email`, `phone`, `address jsonb`,
  `portal_enabled`, `notes`.
- **`invoices`** — `number` (auto `ADV-YYYY-####`), `client_id`, `lead_id`,
  `status`, `issue_date`, `due_date`, `currency`, `subtotal`, `tax_rate`,
  `tax_amount`, `discount`, `total`, `amount_paid`, `notes`, `terms`,
  `sent_at`, `paid_at`.
- **`invoice_items`** — `invoice_id`, `description`, `quantity`, `unit_price`,
  `amount`, `position`.
- **`payments`** — `invoice_id`, `amount`, `method`, `reference`, `paid_at`.

Totals are computed by trigger from `invoice_items`, never trusted from the
client.

### 3.7 Project management

- **`pm_projects`** — `name`, `client_id`, `status`, `progress` (0–100, derived
  from tasks), `starts_on`, `due_on`, `owner_id`, `description`, `budget`.
- **`pm_tasks`** — `project_id`, `title`, `description`, `status`, `assignee_id`,
  `due_on`, `priority`, `position`, `completed_at`.
- **`pm_milestones`** — `project_id`, `title`, `due_on`, `completed_at`.
- **`pm_comments`** — `task_id`, `author_id`, `body`.

`progress` recomputes on task status change via trigger.

### 3.8 Booking engine (add-on)

- **`booking_services`** — `name`, `slug`, `description`, `duration_minutes`,
  `buffer_minutes`, `price`, `currency`, `is_active`, `max_per_day`.
- **`availability_rules`** — `service_id` (null = all), `weekday` 0–6,
  `start_time`, `end_time`, `timezone`.
- **`availability_exceptions`** — `date`, `is_closed`, `start_time`,
  `end_time`, `reason`.
- **`bookings`** — `service_id`, `name`, `email`, `phone`, `starts_at`,
  `ends_at`, `status`, `notes`, `lead_id`, `cancel_token`, `reminded_at`.

Slot generation is a Postgres function `available_slots(service, date_range)`
so the public site and the admin agree on availability by construction. A
partial unique index prevents double-booking a confirmed slot.

### 3.9 Client portal (add-on)

Portal users are `profiles` with `role = 'client'` and a `client_id`. They see
only their own rows, enforced by RLS on `pm_projects`, `pm_tasks`, `invoices`,
`bookings`, `client_documents`.

- **`client_documents`** — `client_id`, `media_id`, `title`, `is_visible`.
- **`client_messages`** — `client_id`, `author_id`, `body`, `read_at`.

### 3.10 Notifications

- **`notifications`** — `user_id`, `type`, `title`, `body`, `entity`,
  `entity_id`, `read_at`, `importance` (`low|normal|high`).
- **`notification_prefs`** — `user_id`, `channel` (`in_app|email`), `event_key`,
  `enabled`.

New-lead notifications carry `importance = 'high'` when the lead's score or
budget crosses a threshold — this is the "importance highlighting" requirement.

### 3.11 Scheduling

Any row with `status = 'scheduled'` and `scheduled_at <= now()` is flipped to
`published` by `publish_scheduled_content()`, run by `pg_cron` every minute.
One function handles every content table, so a new collection needs one line.

---

## 4. Row Level Security

Every table has RLS on. The helper functions are `SECURITY DEFINER` and read
from `profiles`, so a request can't lie about its role:

```sql
auth_role()        -> user_role
is_staff()         -> role in (super_admin, admin, editor)
is_admin()         -> role in (super_admin, admin)
is_super_admin()   -> role = super_admin
auth_client_id()   -> uuid
```

Policy shape per group:

- **Public content** — anonymous `SELECT` where `status = 'published'` and
  `deleted_at is null`. Staff `SELECT` all.
- **Content writes** — `is_staff()` for insert/update; publishing guarded by a
  `BEFORE UPDATE` trigger that raises if a non-admin sets `published`.
- **CRM** — `is_admin()` only. No anonymous read, ever.
- **Form submissions** — anonymous `INSERT` allowed (the public forms need it),
  no anonymous `SELECT`. This is the only anonymous write on the system, and it
  is rate-limited at the route.
- **Portal** — `client_id = auth_client_id()`.
- **Settings / users / audit** — `is_super_admin()` for writes.

---

## 5. Admin application

Route group `app/(admin)/admin`, guarded in `layout.tsx` by a server-side
session + role check. Never a client-side redirect: unauthorised users get a
server 302, so protected HTML is never sent.

```
/admin                     dashboard — counts, recent leads, pipeline value, scheduled content
/admin/content/pages       page list → /[slug] section editor
/admin/content/blog        list, editor, SEO panel, scheduling
/admin/content/projects    portfolio management
/admin/content/case-studies
/admin/content/services
/admin/content/team
/admin/content/testimonials
/admin/content/faqs
/admin/media               library, upload, folders, alt text
/admin/seo                 defaults, redirects, "needs attention" audit, robots.txt
/admin/crm/leads           table: search, filter, bulk, CSV export
/admin/crm/leads/[id]      detail: pipeline, notes, activity history, convert
/admin/crm/pipeline        kanban by status
/admin/crm/invoices        list + builder + payments + email send
/admin/pm                  projects, tasks board, progress
/admin/bookings            calendar, services, availability
/admin/clients             client records + portal access
/admin/settings/users      RBAC (super_admin only)
/admin/settings/site       identity, integrations, notification prefs
/admin/audit               audit log with field-level diffs (admin)
/admin/crm/submissions     form entries — the permanent record, Events separated
/book                      public booking flow (add-on)
/portal                    client portal: overview, invoices, files, messages
```

**Design language:** reuses the public site's tokens exactly. Cards are
`border-[3px] border-charcoal bg-cream shadow-[6px_6px_0_0_#212121]`; primary
actions gold with a charcoal border and hard shadow that grows on hover;
destructive actions charcoal-on-gold with a confirm step; tables have hard
rules, no zebra striping, uppercase Montserrat headers with wide tracking.

---

## 6. Public site wiring

Each section component gains a typed `content` prop with its current hardcoded
value as the default. Pages fetch published sections server-side and pass them
down. Rendering stays a server component; only the animation shells remain
client components.

Revalidation: `revalidateTag('cms')` on any content write, plus
`revalidatePath` for the affected route. Draft preview uses Next's Draft Mode
with a signed token, so an editor can see unpublished work at the real URL.

---

## 7. Build status

| # | Module | State |
|---|--------|-------|
| 1 | Schema, RLS, helper functions, seed | **Built** — migrations 0001–0008, pushed |
| 2 | Supabase clients, sessions, RBAC guards | **Built** |
| 3 | Admin shell, navigation, dashboard | **Built** |
| 4 | Media library | **Built** — upload, folders, alt text, public/private buckets |
| 5 | CMS: pages/sections, collections | **Built** |
| 6 | SEO module | **Built** — defaults, redirects, audit, robots.txt, sitemap.xml |
| 7 | CRM: leads, pipeline, notes, activity, CSV, notifications | **Built** — plus the form-entries browser |
| 8 | Invoicing | **Built** — builder, payments, email send |
| 9 | PM dashboard | **Built** — projects, task board, milestones |
| 10 | Bookings | **Built** — admin, availability, and the public `/book` flow |
| 11 | Client portal | **Built** — overview, invoices, files, messages |
| 12 | Public site wiring, revalidation, draft preview | **Partial** — `/faq` reads the CMS; the other six pages still render their hardcoded fallbacks. Draft preview not built. |

### Known gaps

- **Public pages not yet CMS-wired.** Home, About, Services, Projects, Events
  and Contact still render their hardcoded copy. The sections are editable in
  the admin and the schemas exist; what is missing is the read side on each
  page. `/faq` is the worked example to follow.
- **Draft preview.** Editors can save and schedule but cannot view unpublished
  work at the real URL. Needs Next Draft Mode plus a signed token.
- **Invoice PDF.** Invoices are emailed as text and rendered in the portal.
  There is no PDF generator; the browser's print view is the stand-in.
- **Per-service availability.** The schema supports rules scoped to one booking
  service (`availability_rules.service_id`); the admin only edits the
  studio-wide rules.
- **Rate limiting.** `/api/contact` and `/api/book` have honeypots and server
  validation but no request throttle.

---

## 8. Setup

```bash
npm i @supabase/supabase-js @supabase/ssr zod
npx supabase link --project-ref <ref>
npx supabase db push
```

Environment (`.env.local`):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=      # server only — never referenced in a client component
RESEND_API_KEY=
CONTACT_FROM=
```

The service-role key bypasses RLS entirely. It is used only in route handlers
and server actions, and never imported into a file that carries `"use client"`.
