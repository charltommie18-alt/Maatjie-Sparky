-- Run ONLY in a disposable empty PostgreSQL test database as its admin.
-- Simulates Supabase's auth.uid() with a per-session claim: NOT a live Supabase test.
\set ON_ERROR_STOP on
create role anon nologin;
create role authenticated nologin;
create schema auth;
create table auth.users (id uuid primary key);
create function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;
grant usage on schema auth to authenticated, anon;
grant execute on function auth.uid() to authenticated, anon;
insert into auth.users values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'), ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
\ir history-schema.sql
insert into public.slim_conversations (id,owner_id,title) values ('11111111-1111-4111-8111-111111111111','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','A');
insert into public.slim_conversations (id,owner_id,title) values ('22222222-2222-4222-8222-222222222222','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','B');
set role authenticated;
select set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',false);
insert into public.slim_conversations (title) values ('new A');
delete from public.slim_conversations where title='new A';
insert into public.slim_messages (conversation_id,role,body) values ('11111111-1111-4111-8111-111111111111','user','hello');
do $$ begin
  if (select count(*) from public.slim_conversations) <> 1 or (select count(*) from public.slim_messages) <> 1 then raise exception 'A cannot read own data'; end if;
  begin
    insert into public.slim_messages (conversation_id,role,body) values ('11111111-1111-4111-8111-111111111111','assistant','fake');
    raise exception 'Forged assistant accepted';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.slim_conversations (owner_id,title) values ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','forged');
    raise exception 'Forged owner accepted';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.slim_messages (conversation_id,role,body) values ('11111111-1111-4111-8111-111111111111','user',repeat('x',4001));
    raise exception 'Oversized body accepted';
  exception when check_violation then null; end;
end $$;
select set_config('request.jwt.claim.sub','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',false);
do $$ declare n integer; begin
  if (select count(*) from public.slim_conversations) <> 1 or (select count(*) from public.slim_messages) <> 0 then raise exception 'B sees A data'; end if;
  delete from public.slim_conversations where id='11111111-1111-4111-8111-111111111111';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'B deleted A conversation'; end if;
  begin
    insert into public.slim_messages (conversation_id,role,body) values ('11111111-1111-4111-8111-111111111111','user','intrusion');
    raise exception 'B wrote to A conversation';
  exception when insufficient_privilege then null; end;
end $$;
insert into public.slim_messages (conversation_id,role,body) values ('22222222-2222-4222-8222-222222222222','user','private B');
select set_config('request.jwt.claim.sub','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',false);
do $$ begin
 if (select count(*) from public.slim_conversations) <> 1 or (select count(*) from public.slim_messages) <> 1 then raise exception 'A can see B data'; end if;
 delete from public.slim_conversations where id='11111111-1111-4111-8111-111111111111';
 if exists(select 1 from public.slim_messages) then raise exception 'A messages not deleted'; end if;
end $$;
select set_config('request.jwt.claim.sub','',false);
do $$ begin
 if (select count(*) from public.slim_conversations) <> 0 or (select count(*) from public.slim_messages) <> 0 then raise exception 'No subject sees data'; end if;
end $$;
reset role;
set role anon;
do $$ begin
 begin perform count(*) from public.slim_conversations; raise exception 'Anonymous read allowed';
 exception when insufficient_privilege then null; end;
 begin insert into public.slim_messages (conversation_id,role,body) values ('22222222-2222-4222-8222-222222222222','user','anon'); raise exception 'Anonymous write allowed';
 exception when insufficient_privilege then null; end;
end $$;
reset role;
do $$ begin
 if exists(select 1 from public.slim_messages where conversation_id='11111111-1111-4111-8111-111111111111') then raise exception 'Cascade failed'; end if;
 if (select count(*) from public.slim_messages where conversation_id='22222222-2222-4222-8222-222222222222') <> 1 then raise exception 'B data unexpectedly missing'; end if;
end $$;
\echo 'PASS: simulated two-user, anonymous, ownership, constraints, and cascade isolation'
