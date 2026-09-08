-- Adversado platform — 0009: job titles, and a fix for self-escalation.

-- ─── Job title ────────────────────────────────────────────────────────────
-- Separate from `role`, which is permission only. "Strategy Head" says what
-- someone does; "admin" says what they may touch. Conflating them would mean
-- inventing a permission level every time a job title changes.

alter table profiles add column if not exists job_title text;

comment on column profiles.job_title is
  'What the person does — Founder, Strategy Head. Display only; never consulted
   for access. Access is `role`.';

-- ─── Privilege guard ──────────────────────────────────────────────────────
-- `profiles_self_update` grants a signed-in user UPDATE on their own row, which
-- is what lets them edit their own name. RLS is row-level, and permissive
-- policies combine with OR, so that grant covers *every column* of that row —
-- including `role`. As written, any editor could promote themselves to
-- super_admin. The separate `profiles_admin_manage` policy does not narrow it;
-- it widens it.
--
-- RLS cannot express "these columns only", so the restriction goes in a
-- trigger. The service role is exempt because it is a server-side secret that
-- already bypasses RLS entirely — the invite and portal-access flows set roles
-- with it, and nothing in the database can meaningfully police a key that can
-- do anything.

create or replace function guard_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role      is distinct from old.role
     or new.is_active is distinct from old.is_active
     or new.client_id is distinct from old.client_id
     or new.id        is distinct from old.id
  then
    if not (
      is_super_admin()
      or current_user in ('service_role', 'postgres', 'supabase_admin')
    ) then
      raise exception
        'Only a super admin may change a role, activation state or client link.'
        using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

create trigger profiles_privilege_guard
  before update on profiles
  for each row execute function guard_profile_privileges();
