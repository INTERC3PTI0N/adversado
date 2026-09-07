-- Adversado platform — 0004: Row Level Security.
--
-- RLS is the access boundary, not the admin UI. Every table below has it on,
-- and the anon role can do exactly two things: read published content, and
-- insert a form submission. Nothing else is reachable without a session.

-- ─── Identity ─────────────────────────────────────────────────────────────

alter table profiles  enable row level security;
alter table clients   enable row level security;
alter table audit_log enable row level security;

create policy profiles_self_read on profiles
  for select using (id = auth.uid() or is_staff());

create policy profiles_self_update on profiles
  for update using (id = auth.uid())
  with check (id = auth.uid());

-- Role changes are a super_admin act. Separate policy so the self-update above
-- can never be the path that grants someone a role.
create policy profiles_admin_manage on profiles
  for all using (is_super_admin()) with check (is_super_admin());

create policy clients_staff on clients
  for all using (is_admin()) with check (is_admin());

create policy clients_portal_read on clients
  for select using (id = auth_client_id());

create policy audit_read on audit_log
  for select using (is_admin());

-- Deliberately no insert/update/delete policy for audit_log. Only the
-- SECURITY DEFINER trigger writes it, so it cannot be edited from a session.

-- ─── Media ────────────────────────────────────────────────────────────────

alter table media         enable row level security;
alter table media_folders enable row level security;

create policy media_public_read on media for select using (true);
create policy media_staff_write on media for all
  using (is_staff()) with check (is_staff());

create policy media_folders_read  on media_folders for select using (true);
create policy media_folders_write on media_folders for all
  using (is_staff()) with check (is_staff());

-- ─── CMS ──────────────────────────────────────────────────────────────────

alter table pages             enable row level security;
alter table page_sections     enable row level security;
alter table section_revisions enable row level security;
alter table posts             enable row level security;
alter table tags              enable row level security;
alter table post_tags         enable row level security;
alter table projects          enable row level security;
alter table case_studies      enable row level security;
alter table services          enable row level security;
alter table team_members      enable row level security;
alter table testimonials      enable row level security;
alter table faqs              enable row level security;
alter table seo_settings      enable row level security;
alter table redirects         enable row level security;

-- Public reads see published rows only. Staff see everything, which is what
-- makes draft preview work without a second connection.
create policy pages_public   on pages for select using (status = 'published' or is_staff());
create policy pages_write    on pages for all using (is_staff()) with check (is_staff());

create policy sections_public on page_sections for select using (status = 'published' or is_staff());
create policy sections_write  on page_sections for all using (is_staff()) with check (is_staff());

create policy revisions_read  on section_revisions for select using (is_staff());
create policy revisions_write on section_revisions for insert with check (is_staff());

create policy posts_public on posts for select
  using ((status = 'published' and deleted_at is null) or is_staff());
create policy posts_write on posts for all using (is_staff()) with check (is_staff());

create policy tags_public     on tags      for select using (true);
create policy tags_write      on tags      for all using (is_staff()) with check (is_staff());
create policy post_tags_public on post_tags for select using (true);
create policy post_tags_write  on post_tags for all using (is_staff()) with check (is_staff());

create policy projects_public on projects for select
  using ((status = 'published' and deleted_at is null) or is_staff());
create policy projects_write on projects for all using (is_staff()) with check (is_staff());

create policy case_studies_public on case_studies for select
  using ((status = 'published' and deleted_at is null) or is_staff());
create policy case_studies_write on case_studies for all using (is_staff()) with check (is_staff());

create policy services_public on services for select
  using ((status = 'published' and deleted_at is null) or is_staff());
create policy services_write on services for all using (is_staff()) with check (is_staff());

create policy team_public on team_members for select
  using ((status = 'published' and deleted_at is null) or is_staff());
create policy team_write on team_members for all using (is_staff()) with check (is_staff());

create policy testimonials_public on testimonials for select
  using ((status = 'published' and deleted_at is null) or is_staff());
create policy testimonials_write on testimonials for all using (is_staff()) with check (is_staff());

create policy faqs_public on faqs for select
  using ((status = 'published' and deleted_at is null) or is_staff());
create policy faqs_write on faqs for all using (is_staff()) with check (is_staff());

create policy seo_read  on seo_settings for select using (true);
create policy seo_write on seo_settings for all using (is_admin()) with check (is_admin());

create policy redirects_read  on redirects for select using (true);
create policy redirects_write on redirects for all using (is_admin()) with check (is_admin());

-- ─── CRM ──────────────────────────────────────────────────────────────────
-- No anonymous read anywhere in this block. The single anonymous write is the
-- form submission insert, which the public forms require.

alter table forms            enable row level security;
alter table form_submissions enable row level security;
alter table leads            enable row level security;
alter table lead_notes       enable row level security;
alter table lead_activities  enable row level security;
alter table lead_tags        enable row level security;
alter table lead_tag_links   enable row level security;

create policy forms_read  on forms for select using (is_staff());
create policy forms_write on forms for all using (is_admin()) with check (is_admin());

create policy submissions_anon_insert on form_submissions
  for insert to anon, authenticated with check (true);
create policy submissions_admin_read on form_submissions
  for select using (is_admin());
create policy submissions_admin_write on form_submissions
  for update using (is_admin()) with check (is_admin());

create policy leads_admin on leads for all using (is_admin()) with check (is_admin());

create policy lead_notes_admin      on lead_notes      for all using (is_admin()) with check (is_admin());
create policy lead_activities_read  on lead_activities for select using (is_admin());
create policy lead_activities_write on lead_activities for insert with check (is_admin());
create policy lead_tags_admin       on lead_tags       for all using (is_admin()) with check (is_admin());
create policy lead_tag_links_admin  on lead_tag_links  for all using (is_admin()) with check (is_admin());

-- ─── Invoicing ────────────────────────────────────────────────────────────

alter table invoices      enable row level security;
alter table invoice_items enable row level security;
alter table payments      enable row level security;

create policy invoices_admin on invoices for all using (is_admin()) with check (is_admin());
create policy invoices_client_read on invoices for select
  using (client_id = auth_client_id() and status <> 'draft' and deleted_at is null);

create policy invoice_items_admin on invoice_items for all using (is_admin()) with check (is_admin());
create policy invoice_items_client_read on invoice_items for select
  using (exists (
    select 1 from invoices i
     where i.id = invoice_items.invoice_id
       and i.client_id = auth_client_id()
       and i.status <> 'draft'
  ));

create policy payments_admin on payments for all using (is_admin()) with check (is_admin());

-- ─── Project management ───────────────────────────────────────────────────

alter table pm_projects   enable row level security;
alter table pm_tasks      enable row level security;
alter table pm_milestones enable row level security;
alter table pm_comments   enable row level security;

create policy pm_projects_admin on pm_projects for all using (is_admin()) with check (is_admin());
create policy pm_projects_client_read on pm_projects for select
  using (client_id = auth_client_id() and is_visible_to_client and deleted_at is null);

create policy pm_tasks_admin on pm_tasks for all using (is_admin()) with check (is_admin());
create policy pm_tasks_client_read on pm_tasks for select
  using (exists (
    select 1 from pm_projects p
     where p.id = pm_tasks.project_id
       and p.client_id = auth_client_id()
       and p.is_visible_to_client
  ));

create policy pm_milestones_admin on pm_milestones for all using (is_admin()) with check (is_admin());
create policy pm_milestones_client_read on pm_milestones for select
  using (exists (
    select 1 from pm_projects p
     where p.id = pm_milestones.project_id
       and p.client_id = auth_client_id()
       and p.is_visible_to_client
  ));

create policy pm_comments_admin on pm_comments for all using (is_admin()) with check (is_admin());

-- ─── Bookings ─────────────────────────────────────────────────────────────

alter table booking_services        enable row level security;
alter table availability_rules      enable row level security;
alter table availability_exceptions enable row level security;
alter table bookings                enable row level security;

create policy booking_services_public on booking_services for select using (is_active or is_staff());
create policy booking_services_write  on booking_services for all using (is_admin()) with check (is_admin());

create policy availability_read  on availability_rules for select using (true);
create policy availability_write on availability_rules for all using (is_admin()) with check (is_admin());

create policy exceptions_read  on availability_exceptions for select using (true);
create policy exceptions_write on availability_exceptions for all using (is_admin()) with check (is_admin());

-- Anonymous visitors book through the route handler on the service-role key,
-- not directly, so there is no anon insert policy here. Clients read their own.
create policy bookings_admin on bookings for all using (is_admin()) with check (is_admin());
create policy bookings_client_read on bookings for select
  using (client_id = auth_client_id());

-- ─── Client portal ────────────────────────────────────────────────────────

alter table client_documents enable row level security;
alter table client_messages  enable row level security;

create policy client_documents_admin on client_documents for all using (is_admin()) with check (is_admin());
create policy client_documents_read on client_documents for select
  using (client_id = auth_client_id() and is_visible);

create policy client_messages_admin on client_messages for all using (is_admin()) with check (is_admin());
create policy client_messages_read on client_messages for select
  using (client_id = auth_client_id());
create policy client_messages_write on client_messages for insert
  with check (client_id = auth_client_id() and author_id = auth.uid());

-- ─── Notifications ────────────────────────────────────────────────────────

alter table notifications      enable row level security;
alter table notification_prefs enable row level security;

create policy notifications_own on notifications for select using (user_id = auth.uid());
create policy notifications_mark_read on notifications for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy notification_prefs_own on notification_prefs for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ─── Audit triggers ───────────────────────────────────────────────────────
-- Attached to the tables where "who changed this" is a real question. Left off
-- the high-churn append-only tables, which would otherwise bury the signal.

create trigger audit_pages         after insert or update or delete on pages         for each row execute function write_audit();
create trigger audit_page_sections after insert or update or delete on page_sections for each row execute function write_audit();
create trigger audit_posts         after insert or update or delete on posts         for each row execute function write_audit();
create trigger audit_projects      after insert or update or delete on projects      for each row execute function write_audit();
create trigger audit_case_studies  after insert or update or delete on case_studies  for each row execute function write_audit();
create trigger audit_services      after insert or update or delete on services      for each row execute function write_audit();
create trigger audit_leads         after insert or update or delete on leads         for each row execute function write_audit();
create trigger audit_invoices      after insert or update or delete on invoices      for each row execute function write_audit();
create trigger audit_profiles      after insert or update or delete on profiles      for each row execute function write_audit();
create trigger audit_clients       after insert or update or delete on clients       for each row execute function write_audit();
