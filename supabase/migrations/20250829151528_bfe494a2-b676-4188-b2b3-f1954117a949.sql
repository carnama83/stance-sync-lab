-- compliance.sql (Epic N: consent + deletion)
-- consent logs for IP inference (viewable by user)
create table if not exists public.consent_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  consent_type text not null,             -- 'ip_inference'
  version text not null,                  -- e.g., 'v1.0'
  granted boolean not null,               -- true/false
  created_at timestamptz default now()
);

alter table public.consent_logs enable row level security;
create index if not exists consent_logs_user_idx on public.consent_logs(user_id, created_at desc);

create policy consent_read_own on public.consent_logs
for select using (auth.uid() = user_id);

create policy consent_insert_own on public.consent_logs
for insert with check (auth.uid() = user_id);

-- account deletion with 14-day grace
create table if not exists public.deletion_requests (
  user_id uuid primary key references auth.users(id) on delete cascade,
  status text not null default 'pending', -- pending | confirmed | cancelled | purged
  confirm_token text not null,
  requested_at timestamptz default now(),
  delete_after timestamptz not null,      -- now() + interval '14 days'
  confirmed_at timestamptz,
  purged_at timestamptz,
  error text
);

alter table public.deletion_requests enable row level security;

create policy delreq_read_own on public.deletion_requests
for select using (auth.uid() = user_id);

create policy delreq_insert_own on public.deletion_requests
for insert with check (auth.uid() = user_id);

create policy delreq_update_own on public.deletion_requests
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- admins may view all
create policy delreq_admin_read on public.deletion_requests
for select using (auth.jwt() ->> 'role' = 'admin');

-- insights_cache.sql (Epic O: cached inline insights)
-- region level enum
do $$ begin
  create type public.region_level as enum ('city','state','country','global');
exception when duplicate_object then null; end $$;

-- cached distributions for inline insights
create table if not exists public.inline_insights_cache (
  question_id uuid not null references public.questions(id) on delete cascade,
  region_level public.region_level not null,
  region_key text,                           -- normalized city/state/country or null for global
  sample_size int not null default 0,
  dist jsonb not null default '{}'::jsonb,   -- { "-2": n, "-1": n, "0": n, "1": n, "2": n }
  updated_at timestamptz default now(),
  primary key (question_id, region_level, region_key)
);

alter table public.inline_insights_cache enable row level security;

-- read-only to all (aggregates only); writes via service role from Edge Function
create policy insights_ro on public.inline_insights_cache
for select using (true);