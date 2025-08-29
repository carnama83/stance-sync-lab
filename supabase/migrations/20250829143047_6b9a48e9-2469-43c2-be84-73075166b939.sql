-- per-user inbox notifications
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,                        -- weekly_digest | stance_shift | system
  title text not null,
  body text not null,
  data jsonb default '{}'::jsonb,           -- links, ids, metadata
  read_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists notifications_user_created_idx
  on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;

-- owner can read their notifications
create policy notifications_read_own on public.notifications
for select using (auth.uid() = user_id);

-- owner can mark read
create policy notifications_update_read on public.notifications
for update using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- only service role inserts
create policy notifications_insert_service on public.notifications
for insert with check (false);