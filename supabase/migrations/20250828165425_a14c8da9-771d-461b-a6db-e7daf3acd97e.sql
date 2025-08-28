-- Cached daily aggregates per question & region scope (no user ids)
create table if not exists public.agg_question_region_daily (
  id uuid primary key default gen_random_uuid(),
  day date not null,
  question_id uuid not null references public.questions(id) on delete cascade,
  scope text not null check (scope in ('city','state','country','global')),
  city text,                -- nullable unless scope='city'
  state text,               -- nullable unless scope in ('city','state')
  country_iso text,         -- required for city/state/country scopes
  histogram jsonb not null, -- {"-2": n, "-1": n, "0": n, "1": n, "2": n}
  sample_size int not null,
  created_at timestamptz default now()
);

-- Create unique index for deduplication
create unique index if not exists agg_qrd_unique_idx on public.agg_question_region_daily 
  (day, question_id, scope, coalesce(city,''), coalesce(state,''), coalesce(country_iso,''));

alter table public.agg_question_region_daily enable row level security;

-- Public read-only; writes restricted to service role (Edge Function)
drop policy if exists agg_qrd_ro on public.agg_question_region_daily;
create policy agg_qrd_ro on public.agg_question_region_daily
  for select using (true);