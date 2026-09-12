-- File created date: July 29, 2026
-- Created by: Aswitha
-- Function of file: Supabase schema for Touria conversation history.
--   Run in Supabase → SQL Editor AFTER using history features.
--   Requires public.users (see supabase_users.sql) and auth.users.

-- Conversations (one trip-planning thread)
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  guest_session_id text,
  title text default 'New trip',
  trip_type text,
  status text not null default 'active',
  summary text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists conversations_user_idx
  on public.conversations (user_id, updated_at desc);

create index if not exists conversations_guest_idx
  on public.conversations (guest_session_id, updated_at desc);

-- Messages (one turn per row)
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  token_count int,
  source text default 'llm',
  feedback text check (feedback is null or feedback in ('like', 'dislike')),
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create index if not exists messages_conv_idx
  on public.messages (conversation_id, created_at);

-- Structured trip facts (optional, filled as details are collected)
create table if not exists public.trip_profiles (
  conversation_id uuid primary key references public.conversations(id) on delete cascade,
  origin text,
  destination text,
  travel_dates text,
  traveler_count int,
  age_group text,
  budget_amount numeric,
  budget_currency text default 'USD',
  preferences jsonb default '{}'::jsonb,
  activity_level text,
  accommodation text,
  updated_at timestamptz default now()
);

-- RLS (backend service_role bypasses these; safe for future browser clients)
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.trip_profiles enable row level security;

drop policy if exists "Users read own conversations" on public.conversations;
create policy "Users read own conversations"
  on public.conversations for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users insert own conversations" on public.conversations;
create policy "Users insert own conversations"
  on public.conversations for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users update own conversations" on public.conversations;
create policy "Users update own conversations"
  on public.conversations for update
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users read own messages" on public.messages;
create policy "Users read own messages"
  on public.messages for select
  to authenticated
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  );

drop policy if exists "Users insert own messages" on public.messages;
create policy "Users insert own messages"
  on public.messages for insert
  to authenticated
  with check (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  );

drop policy if exists "Users update own messages" on public.messages;
create policy "Users update own messages"
  on public.messages for update
  to authenticated
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  );

drop policy if exists "Users read own trip profiles" on public.trip_profiles;
create policy "Users read own trip profiles"
  on public.trip_profiles for select
  to authenticated
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  );
