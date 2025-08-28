-- Individual user stances on questions
create table if not exists public.stances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  score smallint not null check (score between -2 and 2),
  rationale text,                  -- sanitized on client before write
  links jsonb,                     -- array of sanitized URLs
  extracted_score smallint,        -- from NLP (optional)
  extracted_confidence numeric,    -- 0..1 (optional)
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, question_id)
);

-- (P1 placeholder for D3): audit history of edits
create table if not exists public.stance_history (
  id uuid primary key default gen_random_uuid(),
  stance_id uuid not null references public.stances(id) on delete cascade,
  prev_score smallint not null,
  prev_rationale text,
  prev_links jsonb,
  changed_at timestamptz default now()
);

-- Trigger to maintain updated_at
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now(); return new;
end$$;

drop trigger if exists stances_touch_updated on public.stances;
create trigger stances_touch_updated
  before update on public.stances
  for each row execute function public.touch_updated_at();

-- (P1 placeholder) Trigger to append to history on score/rationale change
create or replace function public.stances_append_history()
returns trigger language plpgsql as $$
begin
  insert into public.stance_history (stance_id, prev_score, prev_rationale, prev_links)
  values (old.id, old.score, old.rationale, old.links);
  return new;
end$$;

drop trigger if exists stances_to_history on public.stances;
create trigger stances_to_history
  after update of score, rationale, links on public.stances
  for each row execute function public.stances_append_history();

-- RLS: owner-only read/write on base table
alter table public.stances enable row level security;

drop policy if exists stances_owner_read  on public.stances;
drop policy if exists stances_owner_write on public.stances;
drop policy if exists stances_owner_update on public.stances;

create policy stances_owner_read  on public.stances
  for select using (auth.uid() = user_id);

create policy stances_owner_write on public.stances
  for insert with check (auth.uid() = user_id);

create policy stances_owner_update on public.stances
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Helpful indexes
create index if not exists stances_user_idx    on public.stances (user_id);
create index if not exists stances_question_idx on public.stances (question_id);

-- Small helpers for feed sorting/filtering
create index if not exists questions_created_idx on public.questions (created_at desc);
create index if not exists questions_topic_idx   on public.questions (topic);
create index if not exists questions_lang_idx    on public.questions (language);