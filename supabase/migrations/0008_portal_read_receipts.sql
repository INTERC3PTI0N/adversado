-- Adversado platform — 0008: portal read receipts.
--
-- The portal shows an unread badge, which needs the client to be able to stamp
-- `read_at`. RLS gives a client select and insert on `client_messages` but no
-- update, so the badge would count up and never clear.
--
-- A narrow SECURITY DEFINER function rather than an update policy: RLS grants
-- whole rows, so `for update using (client_id = auth_client_id())` would also
-- let a client rewrite the body of a message the studio sent them. This can
-- only ever set one column, only on their own rows, and only on messages they
-- did not write.

create or replace function mark_client_messages_read()
returns void
language sql
volatile
security definer
set search_path = public
as $$
  update client_messages
     set read_at = now()
   where client_id = auth_client_id()
     and read_at is null
     and (author_id is null or author_id <> auth.uid());
$$;

revoke all on function mark_client_messages_read() from public;
grant execute on function mark_client_messages_read() to authenticated;
