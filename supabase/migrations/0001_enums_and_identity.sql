-- Adversado platform — 0001: extensions, enums, identity, audit.
--
-- Everything downstream depends on `profiles` and the auth helper functions
-- defined here: RLS across every other migration calls them, so this file must
-- run first and must not be reordered.

create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";      -- lead/content fuzzy search
create extension if not exists "unaccent";

-- ─── Enums ────────────────────────────────────────────────────────────────

create type user_role      as enum ('super_admin', 'admin', 'editor', 'client');
create type content_status as enum ('draft', 'in_review', 'scheduled', 'published', 'archived');
create type lead_source    as enum ('website', 'events', 'booking', 'referral', 'manual', 'import');
create type lead_status    as enum ('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost');
create type lead_priority  as enum ('low', 'normal', 'high', 'urgent');
create type invoice_status as enum ('draft', 'sent', 'partial', 'paid', 'overdue', 'void');
create type task_status    as enum ('todo', 'in_progress', 'blocked', 'review', 'done');
create type booking_status as enum ('pending', 'confirmed', 'cancelled', 'completed', 'no_show');
create type project_status as enum ('planning', 'in_progress', 'on_hold', 'review', 'complete');
create type importance     as enum ('low', 'normal', 'high');

-- ─── Clients (referenced by profiles, so declared before it) ──────────────

create table clients (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  company         text,
  email           text,
  phone           text,
  address         jsonb not null default '{}'::jsonb,
  portal_enabled  boolean not null default false,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz
);

create index clients_deleted_idx on clients (deleted_at) where deleted_at is null;

-- ─── Profiles ─────────────────────────────────────────────────────────────
-- One row per auth user. `role` is the single source of truth for access; it
-- lives here rather than in JWT claims so a demotion takes effect on the next
-- query instead of the next token refresh.

create table profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  email         text not null,
  full_name     text,
  avatar_url    text,
  role          user_role not null default 'editor',
  is_active     boolean not null default true,
  client_id     uuid references clients (id) on delete set null,
  last_seen_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index profiles_role_idx      on profiles (role);
create index profiles_client_id_idx on profiles (client_id) where client_id is not null;

comment on column profiles.client_id is
  'Set only for role = client. Scopes every portal query to one client.';

-- New auth users land as inactive editors. Promotion is a deliberate act by a
-- super_admin, so an open signup form can never mint an admin.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url, role, is_active)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    'editor',
    false
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ─── Auth helpers ─────────────────────────────────────────────────────────
-- SECURITY DEFINER so RLS on `profiles` cannot recurse into these, and so a
-- caller cannot spoof a role by writing to a table they control.

create or replace function auth_role()
returns user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid() and is_active
$$;

create or replace function auth_client_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select client_id from public.profiles where id = auth.uid() and is_active
$$;

create or replace function is_staff()
returns boolean
language sql
stable
as $$ select auth_role() in ('super_admin', 'admin', 'editor') $$;

create or replace function is_admin()
returns boolean
language sql
stable
as $$ select auth_role() in ('super_admin', 'admin') $$;

create or replace function is_super_admin()
returns boolean
language sql
stable
as $$ select auth_role() = 'super_admin' $$;

-- ─── updated_at ───────────────────────────────────────────────────────────

create or replace function touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger clients_touch  before update on clients  for each row execute function touch_updated_at();
create trigger profiles_touch before update on profiles for each row execute function touch_updated_at();

-- ─── Audit log ────────────────────────────────────────────────────────────
-- Append-only. No update or delete policy exists for it in 0004, which is what
-- makes it evidence rather than just a table.

create table audit_log (
  id         bigserial primary key,
  actor_id   uuid references profiles (id) on delete set null,
  action     text not null,             -- insert | update | delete | login | export | ...
  entity     text not null,             -- table or domain name
  entity_id  text,
  before     jsonb,
  after      jsonb,
  ip         inet,
  created_at timestamptz not null default now()
);

create index audit_log_entity_idx  on audit_log (entity, entity_id);
create index audit_log_actor_idx   on audit_log (actor_id, created_at desc);
create index audit_log_created_idx on audit_log (created_at desc);

-- Generic trigger. Attached per table in 0005 rather than to everything
-- blindly: high-churn tables (activities, notifications) would drown it.
create or replace function write_audit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id text;
begin
  v_id := coalesce(
    (case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end)->>'id',
    null
  );

  insert into audit_log (actor_id, action, entity, entity_id, before, after)
  values (
    auth.uid(),
    lower(tg_op),
    tg_table_name,
    v_id,
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end
  );

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;
