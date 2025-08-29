-- user reports
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references public.comments(id) on delete cascade,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reason text not null,                     -- spam | harassment | hate | misinformation | other
  severity text default 'normal',           -- normal | high (user selected)
  status text default 'open',               -- open | triaged | actioned | dismissed
  created_at timestamptz default now()
);

-- moderator actions / audit log
create table if not exists public.moderation_actions (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references public.comments(id) on delete cascade,
  moderator_id uuid,                        -- null for system
  action text not null,                     -- hide_comment | restore_comment | restrict_user | ban_user
  notes text,
  created_at timestamptz default now()
);

-- RLS
alter table public.reports enable row level security;
alter table public.moderation_actions enable row level security;

-- Reporter can see own reports
create policy reports_select_self on public.reports
for select using (auth.uid() = reporter_id);

create policy reports_insert_self on public.reports
for insert with check (auth.uid() = reporter_id);

-- Moderators can see all reports and actions (JWT claim role='moderator')
create policy reports_select_mod on public.reports
for select using (auth.jwt() ->> 'role' = 'moderator');

create policy mod_actions_select_mod on public.moderation_actions
for select using (auth.jwt() ->> 'role' = 'moderator');

create policy mod_actions_insert_mod on public.moderation_actions
for insert with check (auth.jwt() ->> 'role' = 'moderator');

-- DB-side report rate limit: 5 reports / 10 minutes
create or replace function public.enforce_report_rate_limit()
returns trigger language plpgsql 
security definer set search_path = public
as $$
begin
  if (
    select count(*) from public.reports
    where reporter_id = new.reporter_id and created_at > now() - interval '10 minutes'
  ) >= 5 then
    raise exception 'Rate limit: too many reports, please wait.';
  end if;
  return new;
end$$;

drop trigger if exists reports_rate_limit on public.reports;
create trigger reports_rate_limit
before insert on public.reports
for each row execute function public.enforce_report_rate_limit();