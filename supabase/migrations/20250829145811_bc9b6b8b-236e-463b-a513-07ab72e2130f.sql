-- Step 6 Epic K: Research Exports
-- snapshot of anonymized aggregates for versioned exports
create table if not exists public.aggregate_snapshots (
  id uuid primary key default gen_random_uuid(),
  scope text not null,                 -- 'topic' | 'region' | 'topic_region'
  topic text,                          -- nullable by scope
  region text,                         -- City/State/Country or ISO country; normalized string
  k_threshold int not null default 25, -- k-anonymity threshold
  sample_size int not null,            -- total responses included
  dist jsonb not null,                 -- { "-2": 10, "-1": 32, "0": 55, "1": 27, "2": 8 }
  trend jsonb,                         -- { "pct_change_7d": 0.12, "pct_change_30d": -0.03 }
  version text not null default 'v1',
  created_by uuid references auth.users(id),
  snapshot_at timestamptz not null default now()
);

-- export jobs + produced files (CSV/JSON) stored in Storage bucket
create table if not exists public.export_jobs (
  id uuid primary key default gen_random_uuid(),
  requested_by uuid not null references auth.users(id) on delete cascade,
  format text not null check (format in ('csv','json')),
  filters jsonb not null default '{}'::jsonb,   -- { topic, region, date_range, scope }
  k_threshold int not null default 25,
  status text not null default 'queued',        -- queued | running | complete | failed
  file_path text,                               -- storage path when complete
  row_count int,
  error text,
  created_at timestamptz default now(),
  completed_at timestamptz
);

-- Storage bucket for exports (private)
-- (idempotent: ok to re-run)
insert into storage.buckets (id, name, public)
values ('exports','exports', false)
on conflict (id) do nothing;

-- RLS
alter table public.aggregate_snapshots enable row level security;
alter table public.export_jobs enable row level security;

-- Only the requester (owner) can read their export job records; admin can read all
create policy export_jobs_owner_read on public.export_jobs
for select using (auth.uid() = requested_by);

create policy export_jobs_owner_insert on public.export_jobs
for insert with check (auth.uid() = requested_by);

create policy export_jobs_owner_update on public.export_jobs
for update using (auth.uid() = requested_by) with check (auth.uid() = requested_by);

create policy export_jobs_admin_rw on public.export_jobs
for all using (auth.jwt() ->> 'role' = 'admin') with check (auth.jwt() ->> 'role' = 'admin');

-- Snapshots: readable to all authenticated users (aggregated/anonymized), write via service role
create policy agg_snapshots_read_all on public.aggregate_snapshots
for select using (auth.role() = 'authenticated');

-- Step 6 Epic L: Privacy and Preferences
-- dedicated privacy settings (display_handle lives in profiles; this augments visibility)
create table if not exists public.privacy_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  is_public_profile boolean default false,    -- opt-in public profile
  show_location boolean default true,         -- coarse location visibility
  show_age boolean default false,             -- calculated age visibility
  updated_at timestamptz default now()
);

alter table public.privacy_settings enable row level security;

create policy privacy_rw_owner on public.privacy_settings
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- subscription-level preferences (topic/region/question granularity)
create type public.subscription_type as enum ('topic','region','question');

create table if not exists public.notification_subscriptions (
  user_id uuid not null references auth.users(id) on delete cascade,
  s_type public.subscription_type not null,
  s_key text not null,                        -- e.g., 'Economy', 'Maharashtra', 'question:UUID'
  enabled boolean not null default true,
  created_at timestamptz default now(),
  primary key (user_id, s_type, s_key)
);

alter table public.notification_subscriptions enable row level security;

create policy notif_subs_rw_owner on public.notification_subscriptions
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Storage policies for export downloads
create policy "export_files_owner_read" on storage.objects
for select using (bucket_id = 'exports' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "export_files_service_write" on storage.objects
for insert with check (bucket_id = 'exports');

create policy "export_files_service_update" on storage.objects
for update using (bucket_id = 'exports');

create policy "export_files_admin_all" on storage.objects
for all using (bucket_id = 'exports' and auth.jwt() ->> 'role' = 'admin');