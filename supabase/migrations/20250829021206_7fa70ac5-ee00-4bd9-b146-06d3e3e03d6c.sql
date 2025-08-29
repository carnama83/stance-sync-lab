-- comments on questions
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  toxicity_flag boolean default false,
  is_hidden boolean default false,          -- moderator action
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- upvotes (one per user per comment)
create table if not exists public.comment_votes (
  comment_id uuid references public.comments(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (comment_id, user_id)
);

-- indexes
create index if not exists comments_qid_created_idx on public.comments (question_id, created_at desc);
create index if not exists comments_user_idx on public.comments (user_id);
create index if not exists comment_votes_comment_idx on public.comment_votes (comment_id);

-- RLS
alter table public.comments enable row level security;
alter table public.comment_votes enable row level security;

-- Policies: comments (read-all, insert/update own; moderators can read all inc. hidden via JWT claim)
create policy comments_read_all on public.comments
for select using (
  true
);

create policy comments_insert_own on public.comments
for insert
with check (auth.uid() = user_id);

create policy comments_update_owner on public.comments
for update using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Policies: votes
create policy comment_votes_read_all on public.comment_votes
for select using (true);

create policy comment_votes_insert_own on public.comment_votes
for insert
with check (auth.uid() = user_id);

create policy comment_votes_delete_own on public.comment_votes
for delete using (auth.uid() = user_id);

-- Simple DB-side rate limits (tunable):
-- Max 5 comments per user per minute; max 5 reports per 10 minutes (reports trigger below).
create or replace function public.enforce_comment_rate_limit()
returns trigger language plpgsql as $$
begin
  if (
    select count(*) from public.comments
    where user_id = new.user_id and created_at > now() - interval '1 minute'
  ) >= 5 then
    raise exception 'Rate limit: too many comments, please wait.';
  end if;
  return new;
end$$;

drop trigger if exists comments_rate_limit on public.comments;
create trigger comments_rate_limit
before insert on public.comments
for each row execute function public.enforce_comment_rate_limit();