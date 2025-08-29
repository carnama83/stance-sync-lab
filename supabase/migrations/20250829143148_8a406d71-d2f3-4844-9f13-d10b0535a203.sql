-- Drop existing policy if it exists
drop policy if exists notif_settings_rw_owner on public.notification_settings;

-- minimal per-user notification prefs (Epic L will expand later)
create table if not exists public.notification_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  weekly_digest boolean default true,
  alerts_enabled boolean default true,
  channel_inapp boolean default true,
  channel_email boolean default false,  -- keep off by default in dev
  threshold_shift numeric default 0.20, -- 20% default
  updated_at timestamptz default now()
);

alter table public.notification_settings enable row level security;

create policy notif_settings_rw_owner on public.notification_settings
for all using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- initialize row on demand
create or replace function public.ensure_notif_settings(p_user uuid)
returns void language plpgsql as $$
begin
  insert into public.notification_settings (user_id) values (p_user)
  on conflict (user_id) do nothing;
end$$;