-- Onboarding fields on profiles table
alter table profiles
  add column if not exists onboarding_completed boolean default false,
  add column if not exists default_category text,
  add column if not exists default_difficulty text,
  add column if not exists show_difficulty boolean default true,
  add column if not exists daily_task_goal integer default 5;
