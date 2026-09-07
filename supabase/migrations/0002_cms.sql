-- Adversado platform — 0002: media, pages/sections, content collections, SEO.

-- ─── Media ────────────────────────────────────────────────────────────────

create table media_folders (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  parent_id  uuid references media_folders (id) on delete cascade,
  path       text not null unique,
  created_at timestamptz not null default now()
);

create table media (
  id           uuid primary key default gen_random_uuid(),
  bucket       text not null default 'media',
  storage_path text not null,
  filename     text not null,
  mime_type    text not null,
  size_bytes   bigint not null default 0,
  width        int,
  height       int,
  alt_text     text,
  caption      text,
  folder_id    uuid references media_folders (id) on delete set null,
  uploaded_by  uuid references profiles (id) on delete set null,
  checksum     text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (bucket, storage_path)
);

create index media_folder_idx   on media (folder_id);
create index media_checksum_idx on media (checksum) where checksum is not null;
create index media_filename_idx on media using gin (filename gin_trgm_ops);

create trigger media_touch before update on media for each row execute function touch_updated_at();

-- ─── Pages and sections ───────────────────────────────────────────────────
-- `data` is jsonb shaped by the section schema registry in lib/cms/schemas.ts.
-- A table per section type would need a migration every time a section grows a
-- field; this needs none, and the registry keeps it typed at the edges.

create table pages (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique,
  title            text not null,
  description      text,
  is_system        boolean not null default false,   -- cannot be deleted in the UI
  status           content_status not null default 'published',
  seo_title        text,
  seo_description  text,
  seo_keywords     text[],
  og_image_id      uuid references media (id) on delete set null,
  canonical_url    text,
  noindex          boolean not null default false,
  nofollow         boolean not null default false,
  structured_data  jsonb,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table page_sections (
  id            uuid primary key default gen_random_uuid(),
  page_id       uuid not null references pages (id) on delete cascade,
  key           text not null,           -- stable identifier, matches the component
  kind          text not null,           -- schema id in the registry
  label         text,                    -- editor-facing name
  position      int not null default 0,
  status        content_status not null default 'published',
  scheduled_at  timestamptz,
  published_at  timestamptz,
  data          jsonb not null default '{}'::jsonb,
  updated_by    uuid references profiles (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (page_id, key)
);

create index page_sections_page_idx   on page_sections (page_id, position);
create index page_sections_status_idx on page_sections (status);

create table section_revisions (
  id         uuid primary key default gen_random_uuid(),
  section_id uuid not null references page_sections (id) on delete cascade,
  data       jsonb not null,
  note       text,
  created_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index section_revisions_idx on section_revisions (section_id, created_at desc);

-- Snapshot the outgoing value on every content change. Append-only history:
-- restoring copies a revision forward rather than rewinding in place, so the
-- act of restoring is itself recorded.
create or replace function snapshot_section()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.data is distinct from new.data then
    insert into section_revisions (section_id, data, created_by)
    values (old.id, old.data, auth.uid());
  end if;
  return new;
end;
$$;

create trigger page_sections_snapshot
  before update on page_sections
  for each row execute function snapshot_section();

create trigger pages_touch         before update on pages         for each row execute function touch_updated_at();
create trigger page_sections_touch before update on page_sections for each row execute function touch_updated_at();

-- ─── Collections ──────────────────────────────────────────────────────────

create table tags (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  slug       text not null unique,
  created_at timestamptz not null default now()
);

create table posts (
  id               uuid primary key default gen_random_uuid(),
  title            text not null,
  slug             text not null unique,
  excerpt          text,
  body             jsonb not null default '{}'::jsonb,
  cover_id         uuid references media (id) on delete set null,
  author_id        uuid references profiles (id) on delete set null,
  status           content_status not null default 'draft',
  published_at     timestamptz,
  scheduled_at     timestamptz,
  reading_minutes  int not null default 1,
  view_count       int not null default 0,
  is_featured      boolean not null default false,
  seo_title        text,
  seo_description  text,
  seo_keywords     text[],
  og_image_id      uuid references media (id) on delete set null,
  canonical_url    text,
  noindex          boolean not null default false,
  nofollow         boolean not null default false,
  structured_data  jsonb,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  deleted_at       timestamptz
);

create index posts_status_idx    on posts (status, published_at desc);
create index posts_search_idx    on posts using gin (title gin_trgm_ops);
create index posts_scheduled_idx on posts (scheduled_at) where status = 'scheduled';

create table post_tags (
  post_id uuid not null references posts (id) on delete cascade,
  tag_id  uuid not null references tags (id) on delete cascade,
  primary key (post_id, tag_id)
);

create table projects (
  id               uuid primary key default gen_random_uuid(),
  title            text not null,
  slug             text not null unique,
  client_name      text,
  category         text,
  year             int,
  cover_id         uuid references media (id) on delete set null,
  gallery          jsonb not null default '[]'::jsonb,   -- ordered media ids
  summary          text,
  body             jsonb not null default '{}'::jsonb,
  is_featured      boolean not null default false,
  position         int not null default 0,
  status           content_status not null default 'draft',
  published_at     timestamptz,
  scheduled_at     timestamptz,
  seo_title        text,
  seo_description  text,
  seo_keywords     text[],
  og_image_id      uuid references media (id) on delete set null,
  canonical_url    text,
  noindex          boolean not null default false,
  nofollow         boolean not null default false,
  structured_data  jsonb,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  deleted_at       timestamptz
);

create index projects_status_idx on projects (status, position);

create table case_studies (
  id               uuid primary key default gen_random_uuid(),
  title            text not null,
  slug             text not null unique,
  client_name      text,
  challenge        text,
  approach         text,
  result           text,
  metrics          jsonb not null default '[]'::jsonb,   -- [{label, value}]
  cover_id         uuid references media (id) on delete set null,
  project_id       uuid references projects (id) on delete set null,
  position         int not null default 0,
  status           content_status not null default 'draft',
  published_at     timestamptz,
  scheduled_at     timestamptz,
  seo_title        text,
  seo_description  text,
  seo_keywords     text[],
  og_image_id      uuid references media (id) on delete set null,
  canonical_url    text,
  noindex          boolean not null default false,
  nofollow         boolean not null default false,
  structured_data  jsonb,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  deleted_at       timestamptz
);

create table services (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  slug             text not null unique,
  tagline          text,
  quip             text,
  body             jsonb not null default '{}'::jsonb,
  bullets          jsonb not null default '[]'::jsonb,
  vertical_index   text,                                  -- "01".."04"
  cover_id         uuid references media (id) on delete set null,
  position         int not null default 0,
  status           content_status not null default 'published',
  published_at     timestamptz,
  scheduled_at     timestamptz,
  seo_title        text,
  seo_description  text,
  seo_keywords     text[],
  og_image_id      uuid references media (id) on delete set null,
  canonical_url    text,
  noindex          boolean not null default false,
  nofollow         boolean not null default false,
  structured_data  jsonb,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  deleted_at       timestamptz
);

create table team_members (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  role_title  text,
  bio         text,
  photo_id    uuid references media (id) on delete set null,
  socials     jsonb not null default '{}'::jsonb,
  position    int not null default 0,
  status      content_status not null default 'published',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

create table testimonials (
  id            uuid primary key default gen_random_uuid(),
  quote         text not null,
  author_name   text not null,
  author_role   text,
  company       text,
  avatar_id     uuid references media (id) on delete set null,
  rating        int check (rating between 1 and 5),
  is_featured   boolean not null default false,
  position      int not null default 0,
  status        content_status not null default 'published',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);

create table faqs (
  id         uuid primary key default gen_random_uuid(),
  question   text not null,
  answer     text not null,
  category   text,
  position   int not null default 0,
  status     content_status not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create trigger posts_touch        before update on posts        for each row execute function touch_updated_at();
create trigger projects_touch     before update on projects     for each row execute function touch_updated_at();
create trigger case_studies_touch before update on case_studies for each row execute function touch_updated_at();
create trigger services_touch     before update on services     for each row execute function touch_updated_at();
create trigger team_members_touch before update on team_members for each row execute function touch_updated_at();
create trigger testimonials_touch before update on testimonials for each row execute function touch_updated_at();
create trigger faqs_touch         before update on faqs         for each row execute function touch_updated_at();

-- ─── SEO ──────────────────────────────────────────────────────────────────

create table seo_settings (
  id                 boolean primary key default true check (id),   -- singleton
  site_name          text not null default 'Adversado',
  title_template     text not null default '%s — Adversado',
  default_title      text,
  default_description text,
  default_og_image_id uuid references media (id) on delete set null,
  robots_txt         text,
  google_verification text,
  bing_verification  text,
  organisation_jsonld jsonb,
  updated_at         timestamptz not null default now()
);

insert into seo_settings (id) values (true) on conflict do nothing;

create table redirects (
  id          uuid primary key default gen_random_uuid(),
  from_path   text not null unique,
  to_path     text not null,
  status_code int not null default 308 check (status_code in (301, 302, 307, 308)),
  is_active   boolean not null default true,
  hit_count   int not null default 0,
  created_at  timestamptz not null default now()
);

create trigger seo_settings_touch before update on seo_settings for each row execute function touch_updated_at();

-- ─── Publish gate ─────────────────────────────────────────────────────────
-- Editors may write and schedule but not publish. Enforced here rather than in
-- the UI only, because the UI is not a security boundary.

create or replace function guard_publish()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'published'
     and (tg_op = 'INSERT' or old.status is distinct from 'published')
     and not is_admin()
  then
    raise exception 'Only an admin may publish. Set status to in_review instead.'
      using errcode = '42501';
  end if;

  if new.status = 'published' and new.published_at is null then
    new.published_at := now();
  end if;

  return new;
end;
$$;

create trigger posts_publish_gate        before insert or update on posts        for each row execute function guard_publish();
create trigger projects_publish_gate     before insert or update on projects     for each row execute function guard_publish();
create trigger case_studies_publish_gate before insert or update on case_studies for each row execute function guard_publish();
create trigger services_publish_gate     before insert or update on services     for each row execute function guard_publish();

-- ─── Scheduled publishing ─────────────────────────────────────────────────
-- One function for every collection. Run by pg_cron each minute; also safe to
-- call from a route handler if cron is unavailable on the plan.

create or replace function publish_scheduled_content()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  t text;
  n int := 0;
  c int;
begin
  foreach t in array array['posts', 'projects', 'case_studies', 'services', 'page_sections']
  loop
    execute format(
      'update %I set status = ''published'', published_at = coalesce(published_at, now())
       where status = ''scheduled'' and scheduled_at is not null and scheduled_at <= now()',
      t
    );
    get diagnostics c = row_count;
    n := n + c;
  end loop;
  return n;
end;
$$;
