-- sources and health for J1
create table if not exists public.news_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  base_url text,
  enabled boolean default true,
  polling_minutes int default 60,           -- per-source cadence (dev)
  last_status text,                         -- active | failing
  last_latency_ms int,
  updated_at timestamptz default now()
);

create table if not exists public.ingestion_health (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references public.news_sources(id) on delete set null,
  stage text not null,                      -- ingest | cluster | generate
  status text not null,                     -- ok | warn | fail
  info text,
  created_at timestamptz default now()
);

-- admin-only config key/value store (for J2/J3 stubs)
create table if not exists public.admin_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz default now()
);

-- logs for digest/alerts runs
create table if not exists public.job_runs (
  id uuid primary key default gen_random_uuid(),
  job_name text not null,                   -- weekly_digest | stance_alerts
  window_start timestamptz,
  window_end timestamptz,
  status text not null default 'success',   -- success | fail
  stats jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- RLS: admin-only read/write via jwt claim role='admin'
alter table public.news_sources enable row level security;
alter table public.ingestion_health enable row level security;
alter table public.admin_settings enable row level security;
alter table public.job_runs enable row level security;

create policy news_sources_admin_rw on public.news_sources
for all using (auth.jwt() ->> 'role' = 'admin')
with check (auth.jwt() ->> 'role' = 'admin');

create policy ingestion_health_admin_rw on public.ingestion_health
for all using (auth.jwt() ->> 'role' = 'admin')
with check (auth.jwt() ->> 'role' = 'admin');

create policy admin_settings_admin_rw on public.admin_settings
for all using (auth.jwt() ->> 'role' = 'admin')
with check (auth.jwt() ->> 'role' = 'admin');

create policy job_runs_admin_rw on public.job_runs
for all using (auth.jwt() ->> 'role' = 'admin')
with check (auth.jwt() ->> 'role' = 'admin');