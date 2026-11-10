-- Development foundation only. Do not apply to a live database without a security review
-- and isolation tests with two real users. No service-role key belongs in the client.
begin;
create table public.slim_conversations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  created_at timestamptz not null default now()
);
create table public.slim_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.slim_conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);
create index slim_conversations_owner_created_idx on public.slim_conversations (owner_id, created_at desc);
create index slim_messages_conversation_created_idx on public.slim_messages (conversation_id, created_at, id);
alter table public.slim_conversations enable row level security;
alter table public.slim_messages enable row level security;
revoke all on public.slim_conversations, public.slim_messages from public, anon, authenticated;
grant select, delete on public.slim_conversations to authenticated;
grant insert (title) on public.slim_conversations to authenticated;
grant select on public.slim_messages to authenticated;
grant insert (conversation_id, role, body) on public.slim_messages to authenticated;
create policy slim_conversations_select on public.slim_conversations for select to authenticated using (owner_id = (select auth.uid()));
create policy slim_conversations_insert on public.slim_conversations for insert to authenticated with check (owner_id = (select auth.uid()));
create policy slim_conversations_delete on public.slim_conversations for delete to authenticated using (owner_id = (select auth.uid()));
create policy slim_messages_select on public.slim_messages for select to authenticated using (exists (select 1 from public.slim_conversations c where c.id = conversation_id and c.owner_id = (select auth.uid())));
-- Clients may save their own messages only; assistant messages require a trusted backend.
create policy slim_messages_insert on public.slim_messages for insert to authenticated with check (role = 'user' and exists (select 1 from public.slim_conversations c where c.id = conversation_id and c.owner_id = (select auth.uid())));
commit;
