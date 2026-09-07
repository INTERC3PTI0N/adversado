-- Adversado platform — 0007: redirect hit counting.
--
-- `redirects.hit_count` existed but nothing could write it: the middleware runs
-- as anon, and `redirects_write` requires is_admin(). A counter nobody can
-- increment is worse than no counter, because the admin shows it as fact.
--
-- SECURITY DEFINER so the anon role can bump exactly this one column on exactly
-- one row, and nothing else. It returns void and takes only the path, so there
-- is no shape of call that reveals or changes anything beyond the count.

create or replace function bump_redirect(p_from text)
returns void
language sql
volatile
security definer
set search_path = public
as $$
  update redirects
     set hit_count = hit_count + 1
   where from_path = p_from
     and is_active;
$$;

revoke all on function bump_redirect(text) from public;
grant execute on function bump_redirect(text) to anon, authenticated;
