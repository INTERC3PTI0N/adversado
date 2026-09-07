-- Adversado platform — 0005: storage buckets, availability, dashboard views.

-- ─── Storage ──────────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public)
values ('media', 'media', true), ('avatars', 'avatars', true), ('documents', 'documents', false)
on conflict (id) do nothing;

create policy "media public read" on storage.objects
  for select using (bucket_id in ('media', 'avatars'));

create policy "media staff write" on storage.objects
  for insert with check (bucket_id in ('media', 'avatars') and is_staff());

create policy "media staff update" on storage.objects
  for update using (bucket_id in ('media', 'avatars') and is_staff());

create policy "media staff delete" on storage.objects
  for delete using (bucket_id in ('media', 'avatars') and is_admin());

-- Private bucket. A client reaches their own documents only through a signed
-- URL minted server-side after the RLS check on client_documents.
create policy "documents staff" on storage.objects
  for all using (bucket_id = 'documents' and is_admin())
  with check (bucket_id = 'documents' and is_admin());

-- ─── Booking availability ─────────────────────────────────────────────────
-- One source of truth for what is bookable. The public booking form and the
-- admin calendar both call this, so they cannot disagree about a free slot.

create or replace function available_slots(
  p_service_id uuid,
  p_from       date,
  p_to         date
)
returns table (slot_start timestamptz, slot_end timestamptz)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_duration int;
  v_buffer   int;
  v_tz       text;
  v_max      int;
  d          date;
  r          record;
  cur        timestamptz;
  fin        timestamptz;
begin
  select duration_minutes, buffer_minutes, max_per_day
    into v_duration, v_buffer, v_max
    from booking_services
   where id = p_service_id and is_active;

  if v_duration is null then
    return;   -- unknown or inactive service: no slots, not an error
  end if;

  d := p_from;
  while d <= p_to loop
    -- A closed exception removes the day outright.
    if exists (select 1 from availability_exceptions e where e.date = d and e.is_closed) then
      d := d + 1;
      continue;
    end if;

    for r in
      select coalesce(e.start_time, ar.start_time) as s,
             coalesce(e.end_time,   ar.end_time)   as f,
             ar.timezone as tz
        from availability_rules ar
        left join availability_exceptions e
               on e.date = d and not e.is_closed
       where (ar.service_id = p_service_id or ar.service_id is null)
         and ar.weekday = extract(dow from d)
    loop
      v_tz := coalesce(r.tz, 'Asia/Kolkata');
      cur := (d + r.s) at time zone v_tz;
      fin := (d + r.f) at time zone v_tz;

      while cur + make_interval(mins => v_duration) <= fin loop
        -- Free if nothing live overlaps, the day is under its cap, and it is
        -- not in the past.
        if cur > now()
           and not exists (
             select 1 from bookings b
              where b.status in ('pending', 'confirmed')
                and b.starts_at < cur + make_interval(mins => v_duration)
                and b.ends_at   > cur
           )
           and (v_max is null or (
             select count(*) from bookings b2
              where b2.service_id = p_service_id
                and b2.status in ('pending', 'confirmed')
                and b2.starts_at::date = d
           ) < v_max)
        then
          slot_start := cur;
          slot_end   := cur + make_interval(mins => v_duration);
          return next;
        end if;

        cur := cur + make_interval(mins => v_duration + v_buffer);
      end loop;
    end loop;

    d := d + 1;
  end loop;
end;
$$;

-- ─── Dashboard aggregates ─────────────────────────────────────────────────
-- Views rather than client-side counting: the admin dashboard is one round
-- trip, and the numbers are computed where the data is.

create or replace view lead_pipeline_summary as
  select status,
         source,
         count(*)                                   as lead_count,
         coalesce(sum(estimated_value), 0)          as pipeline_value,
         count(*) filter (where not is_read)        as unread_count
    from leads
   where deleted_at is null
   group by status, source;

create or replace view lead_daily_counts as
  select date_trunc('day', created_at)::date as day,
         source,
         count(*) as lead_count
    from leads
   where deleted_at is null and created_at > now() - interval '90 days'
   group by 1, 2;

create or replace view content_scheduled as
  select 'posts'        as entity, id::text, title           as label, scheduled_at from posts        where status = 'scheduled'
  union all
  select 'projects',            id::text, title,                       scheduled_at from projects     where status = 'scheduled'
  union all
  select 'case_studies',        id::text, title,                       scheduled_at from case_studies where status = 'scheduled'
  union all
  select 'services',            id::text, name,                        scheduled_at from services     where status = 'scheduled';

create or replace view invoice_summary as
  select status,
         count(*)                       as invoice_count,
         coalesce(sum(total), 0)        as total_value,
         coalesce(sum(amount_paid), 0)  as paid_value
    from invoices
   where deleted_at is null
   group by status;

-- Views inherit RLS from their base tables when created by a non-superuser;
-- these are additionally locked to staff at the API layer.
grant select on lead_pipeline_summary, lead_daily_counts, content_scheduled, invoice_summary to authenticated;

-- ─── Lead scoring ─────────────────────────────────────────────────────────
-- Cheap heuristic, deliberately transparent: it decides notification
-- importance, not who gets called back.

create or replace function score_lead()
returns trigger
language plpgsql
as $$
declare
  s int := 0;
begin
  if new.company is not null and length(new.company) > 1 then s := s + 15; end if;
  if new.phone   is not null and length(new.phone)   > 5 then s := s + 15; end if;
  if new.budget  is not null and length(new.budget)  > 0 then s := s + 25; end if;
  if new.message is not null and length(new.message) > 120 then s := s + 20;
  elsif new.message is not null and length(new.message) > 40 then s := s + 10; end if;
  if new.source = 'events'  then s := s + 15; end if;
  if new.source = 'booking' then s := s + 25; end if;

  new.score := least(s, 100);
  return new;
end;
$$;

create trigger leads_score before insert or update of company, phone, budget, message on leads
  for each row execute function score_lead();
