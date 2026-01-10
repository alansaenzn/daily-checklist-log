-- Create profiles table with onboarding fields
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  onboarding_completed boolean default false,
  default_category text,
  default_difficulty text,
  show_difficulty boolean default true,
  daily_task_goal integer default 5,
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table profiles enable row level security;

-- Policies: owner can select/insert/update their profile
drop policy if exists "Profiles select own" on profiles;
create policy "Profiles select own" on profiles
  for select using (auth.uid() = id);

drop policy if exists "Profiles insert own" on profiles;
create policy "Profiles insert own" on profiles
  for insert with check (auth.uid() = id);

drop policy if exists "Profiles update own" on profiles;
create policy "Profiles update own" on profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);
