-- Adversado platform — 0003: CRM, invoicing, project management, bookings,
-- client portal, notifications.

-- ─── Forms and submissions ────────────────────────────────────────────────
-- Every public form is registered, so a submission is always attributable to a
-- known form rather than arriving as anonymous JSON.

create table forms (
  id            uuid primary key default gen_random_uuid(),
  key           text not null unique,     -- contact | events_brief | booking | audit
  name          text not null,
  description   text,
  schema        jsonb not null default '{}'::jsonb,
  notify_emails text[] not null default '{}',
  source        lead_source not null default 'website',
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

insert into forms (key, name, source, description) values
  ('contact',      'Contact page brief', 'website', 'The main site brief form'),
  ('home',         'Home page brief',    'website', 'Invitation section on the home page'),
  ('events_brief', 'Events enquiry',     'events',  'Closing CTA on the Events landing page'),
  ('booking',      'Session booking',    'booking', 'Booking engine reservation'),
  ('audit',        'Brand audit request','website', 'Audit CTA')
on conflict (key) do nothing;

-- ─── Leads ────────────────────────────────────────────────────────────────

create table leads (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  email               text not null,
  phone               text,
  company             text,
  message             text,
  budget              text,
  source              lead_source not null default 'website',
  source_page         text,
  utm                 jsonb not null default '{}'::jsonb,
  status              lead_status not null default 'new',
  priority            lead_priority not null default 'normal',
  owner_id            uuid references profiles (id) on delete set null,
  client_id           uuid references clients (id) on delete set null,
  estimated_value     numeric(12,2),
  currency            text not null default 'INR',
  score               int not null default 0,
  is_read             boolean not null default false,
  first_contacted_at  timestamptz,
  won_at              timestamptz,
  lost_reason         text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  deleted_at          timestamptz
);

-- `source` carries the Events/website split the brief asks for; indexing it
-- with status is what makes the segmented pipeline views cheap.
create index leads_source_idx   on leads (source, status) where deleted_at is null;
create index leads_status_idx   on leads (status, created_at desc) where deleted_at is null;
create index leads_owner_idx    on leads (owner_id) where deleted_at is null;
create index leads_unread_idx   on leads (created_at desc) where is_read = false and deleted_at is null;
create index leads_email_idx    on leads (lower(email));
create index leads_search_idx   on leads using gin (
  (coalesce(name,'') || ' ' || coalesce(email,'') || ' ' || coalesce(company,'')) gin_trgm_ops
);

create table form_submissions (
  id          uuid primary key default gen_random_uuid(),
  form_id     uuid references forms (id) on delete set null,
  form_key    text not null,             -- denormalised: survives form deletion
  lead_id     uuid references leads (id) on delete set null,
  payload     jsonb not null,
  source_page text,
  utm         jsonb not null default '{}'::jsonb,
  ip          inet,
  user_agent  text,
  is_spam     boolean not null default false,
  created_at  timestamptz not null default now()
);

comment on table form_submissions is
  'Permanent record of every form entry. Deliberately survives lead deletion and
   merging — it is the answer to "we never received that enquiry".';

create index form_submissions_form_idx on form_submissions (form_key, created_at desc);
create index form_submissions_lead_idx on form_submissions (lead_id);

create table lead_notes (
  id         uuid primary key default gen_random_uuid(),
  lead_id    uuid not null references leads (id) on delete cascade,
  author_id  uuid references profiles (id) on delete set null,
  body       text not null,
  is_pinned  boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index lead_notes_lead_idx on lead_notes (lead_id, created_at desc);

create table lead_activities (
  id         bigserial primary key,
  lead_id    uuid not null references leads (id) on delete cascade,
  actor_id   uuid references profiles (id) on delete set null,
  type       text not null,   -- created | status_changed | note_added | assigned | emailed | called | viewed
  meta       jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index lead_activities_lead_idx on lead_activities (lead_id, created_at desc);

create table lead_tags (
  id    uuid primary key default gen_random_uuid(),
  name  text not null unique,
  colour text not null default '#e6b325'
);

create table lead_tag_links (
  lead_id uuid not null references leads (id) on delete cascade,
  tag_id  uuid not null references lead_tags (id) on delete cascade,
  primary key (lead_id, tag_id)
);

-- Status changes and assignment write their own history entry, so the timeline
-- cannot drift from the record even if a change is made outside the admin UI.
create or replace function log_lead_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into lead_activities (lead_id, actor_id, type, meta)
    values (new.id, auth.uid(), 'created',
            jsonb_build_object('source', new.source, 'source_page', new.source_page));
    return new;
  end if;

  if old.status is distinct from new.status then
    insert into lead_activities (lead_id, actor_id, type, meta)
    values (new.id, auth.uid(), 'status_changed',
            jsonb_build_object('from', old.status, 'to', new.status));

    if new.status = 'won' and new.won_at is null then
      new.won_at := now();
    end if;
  end if;

  if old.owner_id is distinct from new.owner_id then
    insert into lead_activities (lead_id, actor_id, type, meta)
    values (new.id, auth.uid(), 'assigned',
            jsonb_build_object('from', old.owner_id, 'to', new.owner_id));
  end if;

  return new;
end;
$$;

create trigger leads_log_insert after  insert on leads for each row execute function log_lead_change();
create trigger leads_log_update before update on leads for each row execute function log_lead_change();
create trigger leads_touch     before update on leads for each row execute function touch_updated_at();
create trigger forms_touch     before update on forms for each row execute function touch_updated_at();

-- ─── Invoicing ────────────────────────────────────────────────────────────

create sequence invoice_number_seq;

create table invoices (
  id           uuid primary key default gen_random_uuid(),
  number       text not null unique,
  client_id    uuid references clients (id) on delete set null,
  lead_id      uuid references leads (id) on delete set null,
  status       invoice_status not null default 'draft',
  issue_date   date not null default current_date,
  due_date     date,
  currency     text not null default 'INR',
  subtotal     numeric(12,2) not null default 0,
  tax_rate     numeric(5,2)  not null default 0,
  tax_amount   numeric(12,2) not null default 0,
  discount     numeric(12,2) not null default 0,
  total        numeric(12,2) not null default 0,
  amount_paid  numeric(12,2) not null default 0,
  notes        text,
  terms        text,
  sent_at      timestamptz,
  paid_at      timestamptz,
  created_by   uuid references profiles (id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz
);

create index invoices_client_idx on invoices (client_id, status);
create index invoices_status_idx on invoices (status, due_date);

create table invoice_items (
  id          uuid primary key default gen_random_uuid(),
  invoice_id  uuid not null references invoices (id) on delete cascade,
  description text not null,
  quantity    numeric(10,2) not null default 1,
  unit_price  numeric(12,2) not null default 0,
  amount      numeric(12,2) not null default 0,
  position    int not null default 0
);

create index invoice_items_invoice_idx on invoice_items (invoice_id, position);

create table payments (
  id         uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices (id) on delete cascade,
  amount     numeric(12,2) not null,
  method     text,
  reference  text,
  paid_at    timestamptz not null default now(),
  created_by uuid references profiles (id) on delete set null
);

-- Money is recomputed server-side from the line items on every change. The
-- client never gets to assert a total.
create or replace function recalc_invoice(p_invoice uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sub numeric(12,2);
  v_paid numeric(12,2);
  v_rate numeric(5,2);
  v_disc numeric(12,2);
begin
  select coalesce(sum(amount), 0) into v_sub  from invoice_items where invoice_id = p_invoice;
  select coalesce(sum(amount), 0) into v_paid from payments      where invoice_id = p_invoice;
  select tax_rate, discount into v_rate, v_disc from invoices where id = p_invoice;

  update invoices set
    subtotal    = v_sub,
    tax_amount  = round((v_sub - coalesce(v_disc,0)) * coalesce(v_rate,0) / 100, 2),
    total       = round((v_sub - coalesce(v_disc,0)) * (1 + coalesce(v_rate,0) / 100), 2),
    amount_paid = v_paid,
    status      = case
                    when status = 'void'  then 'void'
                    when status = 'draft' then 'draft'
                    when v_paid <= 0                                                    then status
                    when v_paid >= round((v_sub - coalesce(v_disc,0)) * (1 + coalesce(v_rate,0)/100), 2) then 'paid'
                    else 'partial'
                  end,
    paid_at     = case when v_paid >= round((v_sub - coalesce(v_disc,0)) * (1 + coalesce(v_rate,0)/100), 2)
                       and v_paid > 0 then coalesce(paid_at, now()) else paid_at end
  where id = p_invoice;
end;
$$;

create or replace function invoice_items_recalc()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op <> 'DELETE' then
    new.amount := round(new.quantity * new.unit_price, 2);
  end if;

  perform recalc_invoice(coalesce(new.invoice_id, old.invoice_id));
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

-- BEFORE for the row's own amount, AFTER for the parent totals.
create trigger invoice_items_amount
  before insert or update on invoice_items
  for each row execute function invoice_items_recalc();

create or replace function invoice_parent_recalc()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform recalc_invoice(coalesce(new.invoice_id, old.invoice_id));
  return null;
end;
$$;

create trigger invoice_items_totals after insert or update or delete on invoice_items
  for each row execute function invoice_parent_recalc();
create trigger payments_totals      after insert or update or delete on payments
  for each row execute function invoice_parent_recalc();

create or replace function next_invoice_number()
returns trigger
language plpgsql
as $$
begin
  if new.number is null or new.number = '' then
    new.number := 'ADV-' || to_char(now(), 'YYYY') || '-' ||
                  lpad(nextval('invoice_number_seq')::text, 4, '0');
  end if;
  return new;
end;
$$;

create trigger invoices_number before insert on invoices for each row execute function next_invoice_number();
create trigger invoices_touch  before update on invoices for each row execute function touch_updated_at();

-- ─── Project management ───────────────────────────────────────────────────

create table pm_projects (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  client_id   uuid references clients (id) on delete set null,
  lead_id     uuid references leads (id) on delete set null,
  status      project_status not null default 'planning',
  progress    int not null default 0 check (progress between 0 and 100),
  starts_on   date,
  due_on      date,
  owner_id    uuid references profiles (id) on delete set null,
  description text,
  budget      numeric(12,2),
  is_visible_to_client boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

create index pm_projects_client_idx on pm_projects (client_id, status);

create table pm_tasks (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references pm_projects (id) on delete cascade,
  title        text not null,
  description  text,
  status       task_status not null default 'todo',
  assignee_id  uuid references profiles (id) on delete set null,
  due_on       date,
  priority     lead_priority not null default 'normal',
  position     int not null default 0,
  completed_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index pm_tasks_project_idx  on pm_tasks (project_id, status, position);
create index pm_tasks_assignee_idx on pm_tasks (assignee_id, status);

create table pm_milestones (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references pm_projects (id) on delete cascade,
  title        text not null,
  due_on       date,
  completed_at timestamptz,
  position     int not null default 0
);

create table pm_comments (
  id         uuid primary key default gen_random_uuid(),
  task_id    uuid not null references pm_tasks (id) on delete cascade,
  author_id  uuid references profiles (id) on delete set null,
  body       text not null,
  created_at timestamptz not null default now()
);

-- Progress is derived, never typed in: a project's percentage is the share of
-- its tasks that are done.
create or replace function recalc_project_progress()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_project uuid := coalesce(new.project_id, old.project_id);
  v_total int;
  v_done  int;
begin
  select count(*), count(*) filter (where status = 'done')
    into v_total, v_done
    from pm_tasks where project_id = v_project;

  update pm_projects
     set progress = case when v_total = 0 then 0 else round(v_done * 100.0 / v_total) end
   where id = v_project;

  return null;
end;
$$;

create trigger pm_tasks_progress after insert or update or delete on pm_tasks
  for each row execute function recalc_project_progress();

create or replace function stamp_task_completion()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'done' and (tg_op = 'INSERT' or old.status is distinct from 'done') then
    new.completed_at := now();
  elsif new.status <> 'done' then
    new.completed_at := null;
  end if;
  return new;
end;
$$;

create trigger pm_tasks_completion before insert or update on pm_tasks
  for each row execute function stamp_task_completion();

create trigger pm_projects_touch before update on pm_projects for each row execute function touch_updated_at();
create trigger pm_tasks_touch    before update on pm_tasks    for each row execute function touch_updated_at();

-- ─── Booking engine ───────────────────────────────────────────────────────

create table booking_services (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  slug             text not null unique,
  description      text,
  duration_minutes int not null default 30,
  buffer_minutes   int not null default 10,
  price            numeric(10,2),
  currency         text not null default 'INR',
  max_per_day      int,
  is_active        boolean not null default true,
  position         int not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table availability_rules (
  id         uuid primary key default gen_random_uuid(),
  service_id uuid references booking_services (id) on delete cascade,  -- null = all services
  weekday    int not null check (weekday between 0 and 6),             -- 0 = Sunday
  start_time time not null,
  end_time   time not null,
  timezone   text not null default 'Asia/Kolkata',
  check (end_time > start_time)
);

create table availability_exceptions (
  id         uuid primary key default gen_random_uuid(),
  date       date not null,
  is_closed  boolean not null default true,
  start_time time,
  end_time   time,
  reason     text,
  unique (date)
);

create table bookings (
  id           uuid primary key default gen_random_uuid(),
  service_id   uuid references booking_services (id) on delete set null,
  lead_id      uuid references leads (id) on delete set null,
  client_id    uuid references clients (id) on delete set null,
  name         text not null,
  email        text not null,
  phone        text,
  starts_at    timestamptz not null,
  ends_at      timestamptz not null,
  status       booking_status not null default 'pending',
  notes        text,
  cancel_token uuid not null default gen_random_uuid(),
  reminded_at  timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  check (ends_at > starts_at)
);

create index bookings_range_idx  on bookings (starts_at, ends_at);
create index bookings_status_idx on bookings (status, starts_at);

-- Two confirmed bookings cannot hold the same start. A partial index rather
-- than app-level checking, so a race between two visitors is resolved by the
-- database instead of by luck.
create unique index bookings_no_double_book
  on bookings (service_id, starts_at)
  where status in ('pending', 'confirmed');

create trigger booking_services_touch before update on booking_services for each row execute function touch_updated_at();
create trigger bookings_touch         before update on bookings         for each row execute function touch_updated_at();

-- ─── Client portal ────────────────────────────────────────────────────────

create table client_documents (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid not null references clients (id) on delete cascade,
  media_id   uuid references media (id) on delete set null,
  title      text not null,
  is_visible boolean not null default true,
  uploaded_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index client_documents_client_idx on client_documents (client_id) where is_visible;

create table client_messages (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid not null references clients (id) on delete cascade,
  author_id  uuid references profiles (id) on delete set null,
  body       text not null,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);

create index client_messages_client_idx on client_messages (client_id, created_at desc);

-- ─── Notifications ────────────────────────────────────────────────────────

create table notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles (id) on delete cascade,
  type       text not null,
  title      text not null,
  body       text,
  entity     text,
  entity_id  text,
  url        text,
  importance importance not null default 'normal',
  read_at    timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_idx on notifications (user_id, read_at, created_at desc);

create table notification_prefs (
  user_id   uuid not null references profiles (id) on delete cascade,
  event_key text not null,
  in_app    boolean not null default true,
  email     boolean not null default true,
  primary key (user_id, event_key)
);

-- A new lead notifies every admin. Importance is raised for high-value or
-- explicitly urgent leads, which is the "importance highlighting" requirement.
create or replace function notify_new_lead()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_importance importance;
begin
  v_importance := case
    when new.priority in ('high', 'urgent') then 'high'
    when new.estimated_value is not null and new.estimated_value >= 500000 then 'high'
    when new.score >= 70 then 'high'
    else 'normal'
  end;

  insert into notifications (user_id, type, title, body, entity, entity_id, url, importance)
  select p.id,
         'lead.created',
         case when new.source = 'events' then 'New Events enquiry' else 'New enquiry' end,
         new.name || coalesce(' — ' || new.company, ''),
         'leads',
         new.id::text,
         '/admin/crm/leads/' || new.id::text,
         v_importance
    from profiles p
   where p.role in ('super_admin', 'admin') and p.is_active;

  return new;
end;
$$;

create trigger leads_notify after insert on leads for each row execute function notify_new_lead();
