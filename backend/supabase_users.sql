-- File created date: July 22, 2026
-- Created by: Aswitha
-- Function of file: One-time Supabase SQL setup for Touria user profiles.
--   Run in Supabase → SQL Editor. Creates public.users linked to auth.users
--   so /register can store first_name, last_name, and email after Auth signup.

-- Step 1: Create profile table (id matches Supabase Auth user id)
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text,
  last_name text,
  email text unique not null,
  password text,
  created_at timestamptz default now()
);

-- If public.users already exists, add the password column:
-- alter table public.users add column if not exists password text;

-- Step 2: Enable Row Level Security
-- Prefer SUPABASE_KEY = service_role in backend/.env (bypasses RLS).
-- If you use the anon key, the policies below are required for insert/select.

alter table public.users enable row level security;

-- Step 3: Allow inserts from anon/authenticated clients (registration path)
create policy "Allow insert for anon"
  on public.users
  for insert
  to anon, authenticated
  with check (true);

-- Step 4: Allow selects so the app can look up profile rows when needed
create policy "Allow select for anon"
  on public.users
  for select
  to anon, authenticated
  using (true);

-- Step 5: Allow updates (needed for upsert when the profile row already exists)
create policy "Allow update for anon"
  on public.users
  for update
  to anon, authenticated
  using (true)
  with check (true);
