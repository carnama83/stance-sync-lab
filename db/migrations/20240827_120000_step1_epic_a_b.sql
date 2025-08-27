-- Step 1: Epic A (Identity/Onboarding/Privacy) + Epic B MVP (News Ingestion & AQ Generation)
-- Created: 2024-08-27

-- Required extensions
create extension if not exists pgcrypto;

-- URL-safe short id generator (≈10 chars)
create or replace function public.gen_urlsafe_id(n int default 10)
returns text 
language plpgsql 
security definer
set search_path = public
as $$
declare raw text := encode(gen_random_bytes(8),'base64');
begin
  raw := replace(replace(raw,'+','-'),'/','_');
  return left(replace(raw,'=',''), n);
end$$;

-- Profiles (pseudonymous; PII-minimized)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  random_id text unique not null,
  username text unique,
  display_handle text not null,            -- random_id or username
  avatar_url text,
  dob date not null,
  city text not null,
  state text not null,
  country text not null,
  country_iso text not null,               -- ISO 3166-1 alpha-2
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists profiles_username_lower_idx
  on public.profiles (lower(username)) where username is not null;

-- Create default profile row on signup
create or replace function public.handle_new_user()
returns trigger 
language plpgsql 
security definer 
set search_path = public
as $$
declare rid text := public.gen_urlsafe_id(10);
begin
  insert into public.profiles (id, random_id, display_handle, dob, city, state, country, country_iso)
  values (new.id, rid, rid, current_date, 'City','State','Country','US');
  return new;
end$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS (owner-only on base table)
alter table public.profiles enable row level security;

drop policy if exists profiles_public_read on public.profiles;
drop policy if exists profiles_owner_read  on public.profiles;
drop policy if exists profiles_owner_write on public.profiles;

create policy profiles_owner_read  on public.profiles for select using (auth.uid() = id);
create policy profiles_owner_write on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- Public view exposes ONLY non-sensitive columns
create view public.public_profiles as
select
  id, random_id, display_handle, avatar_url, city, state, country, country_iso
from public.profiles;

-- Grant explicit permissions
grant select on public.public_profiles to anon, authenticated;

-- News clustering & AI Question storage (B1–B3)
create table if not exists public.story_clusters (
  id uuid primary key default gen_random_uuid(),
  title text,
  summary text,
  primary_sources jsonb,
  topic text,
  language text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  story_id uuid references public.story_clusters(id),
  title text,
  summary text,
  source_links jsonb,
  topic text,
  language text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.story_clusters enable row level security;
alter table public.questions enable row level security;

-- Public read-only (writes done by Edge Function via service role)
drop policy if exists story_clusters_ro on public.story_clusters;
drop policy if exists questions_ro      on public.questions;

create policy story_clusters_ro on public.story_clusters for select using (true);
create policy questions_ro      on public.questions      for select using (true);

-- Public avatars bucket (or switch to signed URLs later)
insert into storage.buckets (id, name, public)
values ('avatars','avatars', true)
on conflict (id) do nothing;

-- Per-user folder policy: "avatars/<user_id>/<filename>"
create policy "avatars public read"
on storage.objects for select
using (bucket_id = 'avatars');

create policy "avatars user upload own folder"
on storage.objects for insert
with check (bucket_id = 'avatars' and auth.uid()::text = split_part(name,'/',1));

create policy "avatars user update own folder"
on storage.objects for update
using      (bucket_id = 'avatars' and auth.uid()::text = split_part(name,'/',1))
with check (bucket_id = 'avatars' and auth.uid()::text = split_part(name,'/',1));

create policy "avatars user delete own folder"
on storage.objects for delete
using (bucket_id = 'avatars' and auth.uid()::text = split_part(name,'/',1));